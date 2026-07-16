"""Bronze layer: load source CSVs into staging tables."""

from __future__ import annotations

import logging
import re
from pathlib import Path

import duckdb

from .config import CSV_FILES, STAGING_TABLES, PipelineConfig
from .db import ensure_schemas

logger = logging.getLogger(__name__)


def _sql_path(path: Path) -> str:
    """DuckDB-friendly absolute path with forward slashes."""
    return path.resolve().as_posix().replace("'", "''")


def load_bronze(con: duckdb.DuckDBPyConnection, cfg: PipelineConfig) -> dict[str, int]:
    """
    Load all EDA CSVs into bronze.stg_* tables.
    Returns row counts per staging table.
    """
    ensure_schemas(con)
    counts: dict[str, int] = {}

    for key, filename in CSV_FILES.items():
        if key == "geolocation" and cfg.skip_geolocation:
            logger.warning("Skipping geolocation load (DW_SKIP_GEO / --skip-geo)")
            con.execute(
                """
                CREATE OR REPLACE TABLE bronze.stg_geolocation AS
                SELECT
                    CAST(NULL AS VARCHAR) AS geolocation_zip_code_prefix,
                    CAST(NULL AS DOUBLE)  AS geolocation_lat,
                    CAST(NULL AS DOUBLE)  AS geolocation_lng,
                    CAST(NULL AS VARCHAR) AS geolocation_city,
                    CAST(NULL AS VARCHAR) AS geolocation_state
                WHERE 1 = 0
                """
            )
            counts["stg_geolocation"] = 0
            continue

        csv_path = cfg.eda_dir / filename
        table = STAGING_TABLES[key]
        path_sql = _sql_path(csv_path)
        logger.info("Loading bronze.%s ← %s", table, filename)

        # read_csv: utf-8, header, auto-type; normalize BOM on first column later if needed
        con.execute(
            f"""
            CREATE OR REPLACE TABLE bronze.{table} AS
            SELECT
                *,
                current_timestamp AS _loaded_at,
                '{filename}' AS _source_file
            FROM read_csv(
                '{path_sql}',
                header = true,
                auto_detect = true,
                ignore_errors = false,
                quote = '"',
                escape = '"',
                strict_mode = false,
                nullstr = ['', 'null', 'NULL', 'None']
            )
            """
        )

        # Strip UTF-8 BOM from column names if present
        cols = [
            r[0]
            for r in con.execute(
                f"""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = 'bronze' AND table_name = '{table}'
                ORDER BY ordinal_position
                """
            ).fetchall()
        ]
        bom_cols = [c for c in cols if c.startswith("\ufeff") or c.startswith("ï»¿")]
        for c in bom_cols:
            clean = c.lstrip("\ufeff").replace("ï»¿", "")
            # DuckDB rename
            safe_old = c.replace('"', '""')
            con.execute(f'ALTER TABLE bronze.{table} RENAME COLUMN "{safe_old}" TO "{clean}"')

        n = con.execute(f"SELECT COUNT(*) FROM bronze.{table}").fetchone()[0]
        counts[table] = int(n)
        logger.info("  rows = %s", f"{n:,}")

    _normalize_types(con)
    return counts


def _normalize_types(con: duckdb.DuckDBPyConnection) -> None:
    """Light typing / string cleanup without changing grain."""

    # zip codes as zero-padded strings where useful — keep raw in bronze; clean in gold
    # Parse timestamps on orders if read as VARCHAR
    order_ts_cols = [
        "order_purchase_timestamp",
        "order_approved_at",
        "order_delivered_carrier_date",
        "order_delivered_customer_date",
        "order_estimated_delivery_date",
    ]
    for col in order_ts_cols:
        _try_cast_timestamp(con, "bronze.stg_orders", col)

    _try_cast_timestamp(con, "bronze.stg_order_items", "shipping_limit_date")
    _try_cast_timestamp(con, "bronze.stg_order_reviews", "review_creation_date")
    _try_cast_timestamp(con, "bronze.stg_order_reviews", "review_answer_timestamp")


def _try_cast_timestamp(con: duckdb.DuckDBPyConnection, table: str, column: str) -> None:
    try:
        dtype = con.execute(
            f"""
            SELECT data_type FROM information_schema.columns
            WHERE table_schema = split_part('{table}', '.', 1)
              AND table_name = split_part('{table}', '.', 2)
              AND column_name = '{column}'
            """
        ).fetchone()
        if not dtype:
            return
        if dtype[0].upper() in {"TIMESTAMP", "TIMESTAMP WITH TIME ZONE", "DATETIME", "DATE"}:
            return
        # recreate column via CTAS pattern is heavy; use ALTER if supported
        con.execute(
            f"""
            CREATE OR REPLACE TABLE {table} AS
            SELECT
                * EXCLUDE ({column}),
                TRY_CAST({column} AS TIMESTAMP) AS {column}
            FROM {table}
            """
        )
    except Exception as exc:  # noqa: BLE001
        logger.debug("Could not cast %s.%s: %s", table, column, exc)


def pad_zip(expr: str) -> str:
    """SQL expression: normalize zip to 5-digit zero-padded string."""
    return f"lpad(regexp_replace(CAST({expr} AS VARCHAR), '[^0-9]', '', 'g'), 5, '0')"

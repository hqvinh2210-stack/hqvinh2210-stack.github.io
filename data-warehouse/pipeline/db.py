"""Database connection helpers for DuckDB and PostgreSQL."""

from __future__ import annotations

import logging
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Generator, Iterable

import duckdb

from .config import PipelineConfig

logger = logging.getLogger(__name__)


def connect_duckdb(path: Path, read_only: bool = False) -> duckdb.DuckDBPyConnection:
    path.parent.mkdir(parents=True, exist_ok=True)
    con = duckdb.connect(str(path), read_only=read_only)
    # memory / threads sensible defaults
    try:
        con.execute("SET threads TO 4")
        con.execute("SET memory_limit = '4GB'")
    except Exception:  # noqa: BLE001
        pass
    return con


@contextmanager
def duckdb_connection(cfg: PipelineConfig, read_only: bool = False) -> Generator[duckdb.DuckDBPyConnection, None, None]:
    con = connect_duckdb(cfg.duckdb_path, read_only=read_only)
    try:
        yield con
    finally:
        con.close()


def ensure_schemas(con: duckdb.DuckDBPyConnection) -> None:
    for schema in ("bronze", "silver", "gold"):
        con.execute(f"CREATE SCHEMA IF NOT EXISTS {schema}")


def execute_sql(con: duckdb.DuckDBPyConnection, sql: str) -> None:
    """Execute multi-statement SQL script."""
    # DuckDB executes one statement at a time more reliably for mixed DDL/DML
    statements = _split_sql(sql)
    for stmt in statements:
        if stmt.strip():
            con.execute(stmt)


def _split_sql(sql: str) -> list[str]:
    """Naive split on ';' ignoring empty parts. Good enough for our scripts."""
    parts: list[str] = []
    buf: list[str] = []
    in_single = False
    in_double = False
    for ch in sql:
        if ch == "'" and not in_double:
            in_single = not in_single
            buf.append(ch)
        elif ch == '"' and not in_single:
            in_double = not in_double
            buf.append(ch)
        elif ch == ";" and not in_single and not in_double:
            parts.append("".join(buf))
            buf = []
        else:
            buf.append(ch)
    if buf:
        parts.append("".join(buf))
    return parts


def fetch_df(con: duckdb.DuckDBPyConnection, sql: str) -> Any:
    return con.execute(sql).fetchdf()


def table_count(con: duckdb.DuckDBPyConnection, qualified_name: str) -> int:
    return con.execute(f"SELECT COUNT(*) FROM {qualified_name}").fetchone()[0]


def list_tables(con: duckdb.DuckDBPyConnection, schema: str) -> list[str]:
    rows = con.execute(
        """
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = ?
          AND table_type = 'BASE TABLE'
        ORDER BY table_name
        """,
        [schema],
    ).fetchall()
    return [r[0] for r in rows]


def export_schema_to_postgres(
    duck_con: duckdb.DuckDBPyConnection,
    postgres_url: str,
    schema: str = "gold",
    tables: Iterable[str] | None = None,
) -> None:
    """
    Copy DuckDB tables/views materialization into PostgreSQL via SQLAlchemy + pandas.

    Views are converted to tables on the Postgres side.
    """
    import pandas as pd
    from sqlalchemy import create_engine, text

    engine = create_engine(postgres_url)
    tbls = list(tables) if tables is not None else list_tables(duck_con, schema)

    # Also export views commonly used as marts
    view_rows = duck_con.execute(
        """
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = ?
          AND table_type = 'VIEW'
        ORDER BY table_name
        """,
        [schema],
    ).fetchall()
    view_names = [r[0] for r in view_rows]
    targets = sorted(set(tbls) | set(view_names))

    logger.info("Exporting %d objects from duckdb.%s → PostgreSQL", len(targets), schema)

    with engine.begin() as conn:
        conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema}"))

    for name in targets:
        qname = f'{schema}."{name}"' if False else f"{schema}.{name}"
        logger.info("  → %s", qname)
        df: pd.DataFrame = duck_con.execute(f"SELECT * FROM {schema}.{name}").fetchdf()
        df.to_sql(
            name,
            engine,
            schema=schema,
            if_exists="replace",
            index=False,
            method="multi",
            chunksize=5000,
        )
    logger.info("PostgreSQL export complete")

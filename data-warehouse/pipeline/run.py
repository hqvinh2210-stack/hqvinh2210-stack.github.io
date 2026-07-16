#!/usr/bin/env python3
"""
Olist Data Warehouse ETL — CLI entrypoint.

Examples:
  # Full build → DuckDB file
  python -m pipeline.run

  # Custom paths
  python -m pipeline.run --eda ../EDA --duckdb ./output/olist_dw.duckdb

  # DuckDB then export gold to PostgreSQL
  python -m pipeline.run --export-postgres --postgres-url postgresql://user:pass@localhost:5432/olist

  # Direct engine flag (still builds in DuckDB first for transforms)
  python -m pipeline.run --engine duckdb
"""

from __future__ import annotations

import argparse
import logging
import sys
import time
from pathlib import Path

# Allow `python pipeline/run.py` from data-warehouse/
_DW_ROOT = Path(__file__).resolve().parent.parent
if str(_DW_ROOT) not in sys.path:
    sys.path.insert(0, str(_DW_ROOT))

from pipeline.bronze import load_bronze  # noqa: E402
from pipeline.config import PipelineConfig  # noqa: E402
from pipeline.db import duckdb_connection, export_schema_to_postgres  # noqa: E402
from pipeline.export_web import export_web_json  # noqa: E402
from pipeline.gold import build_gold  # noqa: E402
from pipeline.quality import report_quality, run_quality_checks  # noqa: E402


def setup_logging(verbose: bool = False) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
        datefmt="%H:%M:%S",
    )


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Load Olist EDA CSVs into a dimensional data warehouse (DuckDB / PostgreSQL).",
    )
    p.add_argument(
        "--engine",
        choices=["duckdb", "postgres"],
        default=None,
        help="Primary engine (default: duckdb). postgres implies --export-postgres.",
    )
    p.add_argument("--eda", type=Path, default=None, help="Path to EDA CSV folder")
    p.add_argument("--duckdb", type=Path, default=None, help="Output DuckDB database path")
    p.add_argument(
        "--postgres-url",
        default=None,
        help="SQLAlchemy/Postgres URL, e.g. postgresql://user:pass@localhost:5432/olist",
    )
    p.add_argument(
        "--export-postgres",
        action="store_true",
        help="After DuckDB gold build, copy gold schema to PostgreSQL",
    )
    p.add_argument(
        "--no-recreate",
        action="store_true",
        help="Do not drop gold tables before rebuild (still CREATE OR REPLACE bronze)",
    )
    p.add_argument(
        "--skip-geo",
        action="store_true",
        help="Skip geolocation CSV (faster smoke test; geo dim empty except unknown)",
    )
    p.add_argument(
        "--skip-quality",
        action="store_true",
        help="Skip post-load data quality checks",
    )
    p.add_argument(
        "--export-web",
        action="store_true",
        default=True,
        help="Export gold aggregates to assets/data/dashboard.json (default: on)",
    )
    p.add_argument(
        "--no-export-web",
        action="store_true",
        help="Skip JSON export for GitHub Pages",
    )
    p.add_argument(
        "--web-out",
        type=Path,
        default=None,
        help="Output folder for dashboard JSON (default: repo assets/data)",
    )
    p.add_argument("-v", "--verbose", action="store_true")
    return p.parse_args(argv)


def build_config(args: argparse.Namespace) -> PipelineConfig:
    overrides = {}
    if args.engine:
        overrides["engine"] = args.engine
        if args.engine == "postgres":
            overrides["export_to_postgres"] = True
    if args.eda:
        overrides["eda_dir"] = args.eda
    if args.duckdb:
        overrides["duckdb_path"] = args.duckdb
    if args.postgres_url:
        overrides["postgres_url"] = args.postgres_url
    if args.export_postgres:
        overrides["export_to_postgres"] = True
    if args.no_recreate:
        overrides["recreate"] = False
    if args.skip_geo:
        overrides["skip_geolocation"] = True
    return PipelineConfig.from_env(**overrides)


def run(
    cfg: PipelineConfig,
    skip_quality: bool = False,
    export_web: bool = True,
    web_out: Path | None = None,
) -> int:
    logger = logging.getLogger("pipeline")
    cfg.validate()

    logger.info("=== Olist DW Pipeline ===")
    logger.info("EDA dir     : %s", cfg.eda_dir)
    logger.info("DuckDB path : %s", cfg.duckdb_path)
    logger.info("Engine      : %s", cfg.engine)
    logger.info("Export PG   : %s", cfg.export_to_postgres)
    logger.info("Export web  : %s", export_web)

    t0 = time.perf_counter()

    with duckdb_connection(cfg) as con:
        # Bronze
        t1 = time.perf_counter()
        bronze_counts = load_bronze(con, cfg)
        logger.info("Bronze done in %.1fs — %s tables", time.perf_counter() - t1, len(bronze_counts))

        # Gold
        t2 = time.perf_counter()
        gold_counts = build_gold(con, recreate=cfg.recreate)
        logger.info("Gold done in %.1fs — %s objects", time.perf_counter() - t2, len(gold_counts))

        # Quality
        quality_ok = True
        if not skip_quality:
            t3 = time.perf_counter()
            results = run_quality_checks(con)
            quality_ok = report_quality(results)
            logger.info("Quality checks done in %.1fs", time.perf_counter() - t3)

        # Optional Postgres export
        if cfg.export_to_postgres:
            t4 = time.perf_counter()
            assert cfg.postgres_url
            export_schema_to_postgres(con, cfg.postgres_url, schema="gold")
            logger.info("Postgres export done in %.1fs", time.perf_counter() - t4)

        # GitHub Pages JSON
        if export_web:
            t5 = time.perf_counter()
            path = export_web_json(con, out_dir=web_out)
            logger.info("Web JSON export done in %.1fs → %s", time.perf_counter() - t5, path)

        # Summary KPI
        try:
            kpi = con.execute("SELECT * FROM gold.mart_kpi_overview").fetchdf()
            logger.info("KPI overview:\n%s", kpi.to_string(index=False))
        except Exception as exc:  # noqa: BLE001
            logger.warning("Could not read KPI mart: %s", exc)

    elapsed = time.perf_counter() - t0
    logger.info("=== Pipeline finished in %.1fs ===", elapsed)
    logger.info("DuckDB file: %s", cfg.duckdb_path.resolve())

    if not quality_ok:
        logger.error("One or more ERROR quality checks failed")
        return 1
    return 0


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    setup_logging(args.verbose)
    try:
        cfg = build_config(args)
        export_web = not args.no_export_web
        return run(
            cfg,
            skip_quality=args.skip_quality,
            export_web=export_web,
            web_out=args.web_out,
        )
    except Exception:
        logging.getLogger("pipeline").exception("Pipeline failed")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())

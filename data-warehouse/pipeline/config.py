"""Pipeline configuration — paths, engine, connection settings."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

# data-warehouse/ root
DW_ROOT = Path(__file__).resolve().parent.parent
# repo root (hqvinh2210-stack.github.io)
REPO_ROOT = DW_ROOT.parent

load_dotenv(DW_ROOT / ".env")
load_dotenv(REPO_ROOT / ".env")

# Default CSV source
DEFAULT_EDA_DIR = REPO_ROOT / "EDA"
DEFAULT_DUCKDB_PATH = DW_ROOT / "output" / "olist_dw.duckdb"

CSV_FILES: dict[str, str] = {
    "customers": "olist_customers_dataset.csv",
    "geolocation": "olist_geolocation_dataset.csv",
    "orders": "olist_orders_dataset.csv",
    "order_items": "olist_order_items_dataset.csv",
    "order_payments": "olist_order_payments_dataset.csv",
    "order_reviews": "olist_order_reviews_dataset.csv",
    "products": "olist_products_dataset.csv",
    "sellers": "olist_sellers_dataset.csv",
    "category_translation": "product_category_name_translation.csv",
}

# Staging table name per logical source
STAGING_TABLES: dict[str, str] = {
    "customers": "stg_customers",
    "geolocation": "stg_geolocation",
    "orders": "stg_orders",
    "order_items": "stg_order_items",
    "order_payments": "stg_order_payments",
    "order_reviews": "stg_order_reviews",
    "products": "stg_products",
    "sellers": "stg_sellers",
    "category_translation": "stg_category_translation",
}


@dataclass
class PipelineConfig:
    """Runtime config for one pipeline run."""

    engine: str = "duckdb"  # duckdb | postgres
    eda_dir: Path = field(default_factory=lambda: DEFAULT_EDA_DIR)
    duckdb_path: Path = field(default_factory=lambda: DEFAULT_DUCKDB_PATH)
    postgres_url: str | None = None
    # After DuckDB build, optionally copy gold → postgres
    export_to_postgres: bool = False
    recreate: bool = True  # drop & rebuild gold objects
    skip_geolocation: bool = False  # speed flag for smoke tests

    @classmethod
    def from_env(cls, **overrides) -> "PipelineConfig":
        engine = overrides.pop("engine", os.getenv("DW_ENGINE", "duckdb")).lower()
        eda = Path(overrides.pop("eda_dir", os.getenv("DW_EDA_DIR", str(DEFAULT_EDA_DIR))))
        duckdb_path = Path(
            overrides.pop("duckdb_path", os.getenv("DW_DUCKDB_PATH", str(DEFAULT_DUCKDB_PATH)))
        )
        postgres_url = overrides.pop(
            "postgres_url",
            os.getenv("DATABASE_URL") or os.getenv("DW_POSTGRES_URL"),
        )
        export_pg = overrides.pop(
            "export_to_postgres",
            os.getenv("DW_EXPORT_POSTGRES", "").lower() in {"1", "true", "yes"},
        )
        recreate = overrides.pop(
            "recreate",
            os.getenv("DW_RECREATE", "true").lower() in {"1", "true", "yes"},
        )
        skip_geo = overrides.pop(
            "skip_geolocation",
            os.getenv("DW_SKIP_GEO", "").lower() in {"1", "true", "yes"},
        )
        return cls(
            engine=engine,
            eda_dir=eda,
            duckdb_path=duckdb_path,
            postgres_url=postgres_url,
            export_to_postgres=export_pg,
            recreate=recreate,
            skip_geolocation=skip_geo,
            **overrides,
        )

    def validate(self) -> None:
        if self.engine not in {"duckdb", "postgres"}:
            raise ValueError(f"Unsupported engine: {self.engine!r} (use duckdb|postgres)")
        if not self.eda_dir.is_dir():
            raise FileNotFoundError(f"EDA directory not found: {self.eda_dir}")
        missing = []
        for name, fname in CSV_FILES.items():
            if name == "geolocation" and self.skip_geolocation:
                continue
            if not (self.eda_dir / fname).exists():
                missing.append(fname)
        if missing:
            raise FileNotFoundError(f"Missing CSV files in {self.eda_dir}: {missing}")
        if self.engine == "postgres" and not self.postgres_url:
            raise ValueError("PostgreSQL engine requires DATABASE_URL or DW_POSTGRES_URL")
        if self.export_to_postgres and not self.postgres_url:
            raise ValueError("export_to_postgres requires DATABASE_URL or DW_POSTGRES_URL")

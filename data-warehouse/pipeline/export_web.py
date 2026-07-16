"""Export gold mart aggregates to JSON for GitHub Pages (Chart.js)."""

from __future__ import annotations

import json
import logging
from datetime import date, datetime
from pathlib import Path
from typing import Any

import duckdb
import pandas as pd

from .config import REPO_ROOT

logger = logging.getLogger(__name__)

DEFAULT_OUT_DIR = REPO_ROOT / "assets" / "data"


def _json_default(obj: Any) -> Any:
    if isinstance(obj, (datetime, date, pd.Timestamp)):
        return obj.isoformat()
    if hasattr(obj, "item"):  # numpy scalar
        try:
            return obj.item()
        except Exception:  # noqa: BLE001
            pass
    raise TypeError(f"Object of type {type(obj)!r} is not JSON serializable")


def _records(df: pd.DataFrame) -> list[dict[str, Any]]:
    if df is None or df.empty:
        return []
    # Replace NaN with None for valid JSON
    clean = df.where(pd.notnull(df), None)
    return clean.to_dict(orient="records")


def export_web_json(
    con: duckdb.DuckDBPyConnection,
    out_dir: Path | None = None,
) -> Path:
    """
    Query gold layer and write assets/data/dashboard.json (+ meta).
    Returns path to dashboard.json.
    """
    out = Path(out_dir) if out_dir else DEFAULT_OUT_DIR
    out.mkdir(parents=True, exist_ok=True)

    # --- KPI ---
    kpi_df = con.execute("SELECT * FROM gold.mart_kpi_overview").fetchdf()
    kpi_row = _records(kpi_df)[0] if len(kpi_df) else {}

    # Aggregate from facts for accurate distinct-order counts
    sales_monthly = con.execute(
        """
        SELECT
            d.year_month,
            round(sum(f.price), 2) AS gmv,
            count(DISTINCT f.order_id) AS orders,
            count(*) AS items,
            round(sum(f.freight_value), 2) AS freight
        FROM gold.fact_order_item f
        JOIN gold.dim_date d ON f.date_purchase_sk = d.date_sk
        WHERE f.is_delivered = 1 AND d.date_sk <> -1
        GROUP BY d.year_month
        ORDER BY d.year_month
        """
    ).fetchdf()

    top_categories = con.execute(
        """
        SELECT
            p.category_name_en AS category,
            round(sum(f.price), 2) AS gmv,
            count(DISTINCT f.order_id) AS orders,
            count(*) AS items
        FROM gold.fact_order_item f
        JOIN gold.dim_product p ON f.product_sk = p.product_sk
        WHERE f.is_delivered = 1
          AND p.category_name_en IS NOT NULL
          AND p.category_name_en <> 'unknown'
        GROUP BY 1
        ORDER BY gmv DESC
        LIMIT 12
        """
    ).fetchdf()

    top_states = con.execute(
        """
        SELECT
            c.customer_state AS state,
            coalesce(g.region, 'Unknown') AS region,
            round(sum(f.price), 2) AS gmv,
            count(DISTINCT f.order_id) AS orders
        FROM gold.fact_order_item f
        JOIN gold.dim_customer c ON f.customer_sk = c.customer_sk
        LEFT JOIN gold.dim_geography g ON f.geo_customer_sk = g.geo_sk
        WHERE f.is_delivered = 1
          AND c.customer_state IS NOT NULL
          AND c.customer_state <> 'XX'
        GROUP BY 1, 2
        ORDER BY gmv DESC
        LIMIT 12
        """
    ).fetchdf()

    payment_mix = con.execute(
        """
        SELECT
            pt.payment_type,
            pt.payment_group,
            count(*) AS payment_txns,
            count(DISTINCT f.order_id) AS orders,
            round(sum(f.payment_value), 2) AS payment_value,
            round(avg(f.payment_installments), 2) AS avg_installments
        FROM gold.fact_payment f
        JOIN gold.dim_payment_type pt ON f.payment_type_sk = pt.payment_type_sk
        WHERE pt.payment_type <> 'unknown'
        GROUP BY 1, 2
        ORDER BY payment_value DESC
        """
    ).fetchdf()

    review_monthly = con.execute(
        """
        SELECT
            d.year_month,
            count(*) AS reviews,
            round(avg(f.review_score), 3) AS avg_score,
            sum(CASE WHEN f.review_score >= 4 THEN 1 ELSE 0 END) AS positive_reviews,
            sum(CASE WHEN f.review_score <= 2 THEN 1 ELSE 0 END) AS negative_reviews
        FROM gold.fact_review f
        JOIN gold.dim_date d ON f.date_review_sk = d.date_sk
        WHERE d.date_sk <> -1
        GROUP BY d.year_month
        ORDER BY d.year_month
        """
    ).fetchdf()

    delivery_monthly = con.execute(
        """
        SELECT
            d.year_month,
            count(*) AS delivered_orders,
            round(avg(o.delivery_days), 2) AS avg_delivery_days,
            round(avg(CAST(o.is_on_time AS DOUBLE)) * 100, 2) AS on_time_rate_pct
        FROM gold.fact_order o
        JOIN gold.dim_date d ON o.date_purchase_sk = d.date_sk
        WHERE o.is_delivered = 1 AND d.date_sk <> -1
        GROUP BY d.year_month
        ORDER BY d.year_month
        """
    ).fetchdf()

    region_mix = con.execute(
        """
        SELECT
            coalesce(g.region, 'Unknown') AS region,
            round(sum(f.price), 2) AS gmv,
            count(DISTINCT f.order_id) AS orders
        FROM gold.fact_order_item f
        LEFT JOIN gold.dim_geography g ON f.geo_customer_sk = g.geo_sk
        WHERE f.is_delivered = 1
        GROUP BY 1
        ORDER BY gmv DESC
        """
    ).fetchdf()

    # --- Schema summary for architecture section ---
    table_stats = []
    for name in [
        "dim_date",
        "dim_customer",
        "dim_product",
        "dim_seller",
        "dim_geography",
        "fact_order",
        "fact_order_item",
        "fact_payment",
        "fact_review",
    ]:
        try:
            n = con.execute(f"SELECT COUNT(*) FROM gold.{name}").fetchone()[0]
            table_stats.append({"name": name, "rows": int(n), "layer": "gold"})
        except Exception:  # noqa: BLE001
            pass

    payload = {
        "meta": {
            "project": "Olist Brazilian E-Commerce Data Warehouse",
            "source": "Brazilian E-Commerce Public Dataset by Olist",
            "period": "2016-09 to 2018-10",
            "generated_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "currency": "BRL",
            "engine": "DuckDB → star schema → JSON for GitHub Pages",
        },
        "kpi": {
            "delivered_orders": int(kpi_row.get("delivered_orders") or 0),
            "delivered_items": int(kpi_row.get("delivered_items") or 0),
            "total_gmv": float(kpi_row.get("total_gmv") or 0),
            "aov": float(kpi_row.get("aov") or 0),
            "avg_review_score": float(kpi_row.get("avg_review_score") or 0),
            "on_time_rate_pct": float(kpi_row.get("on_time_rate_pct") or 0),
            "repeat_customer_pct": float(kpi_row.get("repeat_customer_pct") or 0),
        },
        "sales_monthly": _records(sales_monthly),
        "top_categories": _records(top_categories),
        "top_states": _records(top_states),
        "payment_mix": _records(payment_mix),
        "review_monthly": _records(review_monthly),
        "delivery_monthly": _records(delivery_monthly),
        "region_mix": _records(region_mix),
        "table_stats": table_stats,
    }

    dash_path = out / "dashboard.json"
    with open(dash_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2, default=_json_default)

    meta_path = out / "meta.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(payload["meta"], f, ensure_ascii=False, indent=2)

    size_kb = dash_path.stat().st_size / 1024
    logger.info("Web export → %s (%.1f KB)", dash_path, size_kb)
    logger.info("  KPI GMV=%.2f | months=%d | categories=%d",
                payload["kpi"]["total_gmv"],
                len(payload["sales_monthly"]),
                len(payload["top_categories"]))
    return dash_path

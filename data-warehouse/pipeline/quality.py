"""Data quality checks after gold load."""

from __future__ import annotations

import logging
from dataclasses import dataclass

import duckdb

logger = logging.getLogger(__name__)


@dataclass
class CheckResult:
    name: str
    passed: bool
    detail: str
    severity: str  # error | warn


def run_quality_checks(con: duckdb.DuckDBPyConnection) -> list[CheckResult]:
    results: list[CheckResult] = []

    def q(sql: str):
        return con.execute(sql).fetchone()

    # --- row presence ---
    for table, min_rows in [
        ("gold.dim_customer", 1000),
        ("gold.dim_product", 1000),
        ("gold.dim_seller", 100),
        ("gold.fact_order", 1000),
        ("gold.fact_order_item", 1000),
        ("gold.fact_payment", 1000),
        ("gold.fact_review", 1000),
    ]:
        n = q(f"SELECT COUNT(*) FROM {table}")[0]
        results.append(
            CheckResult(
                name=f"rowcount::{table}",
                passed=n >= min_rows,
                detail=f"rows={n:,} (min {min_rows:,})",
                severity="error",
            )
        )

    # --- PK uniqueness ---
    dup = q(
        """
        SELECT COUNT(*) FROM (
            SELECT order_id, order_item_id, COUNT(*) c
            FROM gold.fact_order_item
            GROUP BY 1, 2 HAVING COUNT(*) > 1
        ) t
        """
    )[0]
    results.append(
        CheckResult(
            "unique::fact_order_item(order_id,order_item_id)",
            dup == 0,
            f"duplicate_keys={dup}",
            "error",
        )
    )

    dup_o = q(
        """
        SELECT COUNT(*) FROM (
            SELECT order_id, COUNT(*) c FROM gold.fact_order
            GROUP BY 1 HAVING COUNT(*) > 1
        ) t
        """
    )[0]
    results.append(
        CheckResult("unique::fact_order(order_id)", dup_o == 0, f"duplicate_keys={dup_o}", "error")
    )

    # --- unknown dimension leakage (warn if high) ---
    unk_prod = q(
        "SELECT COUNT(*) FROM gold.fact_order_item WHERE product_sk = -1"
    )[0]
    total_items = q("SELECT COUNT(*) FROM gold.fact_order_item")[0] or 1
    pct = unk_prod / total_items * 100
    results.append(
        CheckResult(
            "fk::fact_order_item.product_sk",
            pct < 5.0,
            f"unknown_product_sk={unk_prod:,} ({pct:.2f}%)",
            "warn" if pct < 5 else "error",
        )
    )

    # --- non-negative amounts ---
    neg = q(
        """
        SELECT COUNT(*) FROM gold.fact_order_item
        WHERE price < 0 OR freight_value < 0
        """
    )[0]
    results.append(
        CheckResult("domain::non_negative_amounts", neg == 0, f"negative_rows={neg}", "error")
    )

    # --- payment vs gmv recon (warn) ---
    recon = q(
        """
        WITH g AS (
            SELECT order_id, sum(price + freight_value) AS item_total
            FROM gold.fact_order_item GROUP BY 1
        ),
        p AS (
            SELECT order_id, sum(payment_value) AS pay_total
            FROM gold.fact_payment GROUP BY 1
        )
        SELECT COUNT(*)
        FROM g
        JOIN p USING (order_id)
        WHERE abs(g.item_total - p.pay_total) > 1.0
        """
    )[0]
    results.append(
        CheckResult(
            "recon::payment_vs_item_total",
            recon < 5000,  # Olist has known multi-payment / voucher gaps
            f"orders_diff_gt_1brl={recon:,}",
            "warn",
        )
    )

    # --- date FK integrity ---
    bad_dates = q(
        """
        SELECT COUNT(*)
        FROM gold.fact_order_item f
        LEFT JOIN gold.dim_date d ON f.date_purchase_sk = d.date_sk
        WHERE d.date_sk IS NULL
        """
    )[0]
    results.append(
        CheckResult(
            "fk::date_purchase_sk",
            bad_dates == 0,
            f"orphan_date_sk={bad_dates}",
            "error",
        )
    )

    # --- KPI smoke ---
    kpi = con.execute("SELECT * FROM gold.mart_kpi_overview").fetchdf()
    results.append(
        CheckResult(
            "mart::kpi_overview",
            len(kpi) == 1 and float(kpi["total_gmv"].iloc[0] or 0) > 0,
            kpi.to_dict(orient="records")[0].__repr__() if len(kpi) else "empty",
            "error",
        )
    )

    return results


def report_quality(results: list[CheckResult]) -> bool:
    """Log results. Return True if all error-severity checks passed."""
    ok = True
    for r in results:
        level = logging.INFO if r.passed else (logging.ERROR if r.severity == "error" else logging.WARNING)
        status = "PASS" if r.passed else "FAIL"
        logger.log(level, "[%s][%s] %s — %s", status, r.severity.upper(), r.name, r.detail)
        if not r.passed and r.severity == "error":
            ok = False
    return ok

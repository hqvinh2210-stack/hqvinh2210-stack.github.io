"""
RFM customer segmentation (ML problem #5).

R = days since last delivered order (relative to snapshot)
F = number of delivered orders
M = sum(order_gmv) for delivered orders

Grain: one row per customer_unique_id with ≥1 delivered order.
"""

from __future__ import annotations

import logging
from typing import Any

import duckdb
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.metrics import (
    calinski_harabasz_score,
    davies_bouldin_score,
    silhouette_samples,
    silhouette_score,
)
from sklearn.preprocessing import RobustScaler

logger = logging.getLogger(__name__)

RFM_SQL = """
WITH delivered AS (
    SELECT
        c.customer_unique_id,
        c.customer_state,
        d.full_date AS order_date,
        o.order_gmv
    FROM gold.fact_order o
    JOIN gold.dim_customer c ON o.customer_sk = c.customer_sk
    JOIN gold.dim_date d ON o.date_purchase_sk = d.date_sk
    WHERE o.is_delivered = 1
      AND c.customer_unique_id <> 'unknown'
      AND d.date_sk <> -1
),
bounds AS (
    SELECT max(order_date) AS snapshot_date FROM delivered
)
SELECT
    d.customer_unique_id,
    max(d.customer_state) AS customer_state,
    date_diff('day', max(d.order_date), (SELECT snapshot_date FROM bounds)) AS recency_days,
    count(*)::INTEGER AS frequency,
    round(sum(d.order_gmv), 2) AS monetary,
    min(d.order_date) AS first_order_date,
    max(d.order_date) AS last_order_date,
    (SELECT snapshot_date FROM bounds) AS snapshot_date
FROM delivered d
GROUP BY d.customer_unique_id
"""

# Score for ranking centroids: high engagement = low R, high F, high M
def _engagement_score(r_mean: float, f_mean: float, m_mean: float,
                      r_max: float, f_max: float, m_max: float) -> float:
    r_n = 1.0 - (r_mean / r_max if r_max > 0 else 0.0)
    f_n = f_mean / f_max if f_max > 0 else 0.0
    m_n = m_mean / m_max if m_max > 0 else 0.0
    return 0.35 * r_n + 0.30 * f_n + 0.35 * m_n


def extract_rfm(con: duckdb.DuckDBPyConnection) -> pd.DataFrame:
    df = con.execute(RFM_SQL).fetchdf()
    logger.info("RFM extract: %s customers", f"{len(df):,}")
    return df


def _eval_k(
    X: np.ndarray,
    labels: np.ndarray,
    inertia: float,
    random_state: int = 42,
) -> dict[str, float]:
    """Internal validation metrics for a clustering (higher/lower as noted)."""
    n = X.shape[0]
    sample_size = min(10_000, n)
    sil = float(
        silhouette_score(X, labels, sample_size=sample_size, random_state=random_state)
    )
    # Davies–Bouldin: lower is better; Calinski–Harabasz: higher is better
    dbi = float(davies_bouldin_score(X, labels))
    chi = float(calinski_harabasz_score(X, labels))
    return {
        "silhouette": round(sil, 4),
        "davies_bouldin": round(dbi, 4),
        "calinski_harabasz": round(chi, 2),
        "inertia": round(float(inertia), 2),
    }


def choose_k(
    X: np.ndarray,
    k_min: int = 3,
    k_max: int = 6,
    random_state: int = 42,
) -> tuple[int, list[dict[str, Any]]]:
    """
    Evaluate k candidates on a sample; pick k with best silhouette.
    Returns (best_k, metrics_by_k list for elbow / comparison charts).
    """
    n = X.shape[0]
    sample_n = min(12_000, n)
    if sample_n < n:
        rng = np.random.default_rng(random_state)
        idx = rng.choice(n, size=sample_n, replace=False)
        Xs = X[idx]
    else:
        Xs = X

    metrics_by_k: list[dict[str, Any]] = []
    best_k, best_s = 4, -1.0
    for k in range(k_min, k_max + 1):
        if k >= Xs.shape[0]:
            break
        km = KMeans(n_clusters=k, random_state=random_state, n_init=10)
        labels = km.fit_predict(Xs)
        if len(set(labels)) < 2:
            continue
        m = _eval_k(Xs, labels, km.inertia_, random_state=random_state)
        row = {"k": k, **m}
        metrics_by_k.append(row)
        logger.info(
            "  k=%s silhouette=%.4f DBI=%.4f CHI=%.1f inertia=%.1f",
            k, m["silhouette"], m["davies_bouldin"], m["calinski_harabasz"], m["inertia"],
        )
        if m["silhouette"] > best_s:
            best_s, best_k = m["silhouette"], k
    return best_k, metrics_by_k


def assign_business_labels(cluster_stats: pd.DataFrame) -> dict[int, str]:
    """
    Map cluster_id → business name using engagement ranking of centroids.
    Highest engagement → Champions, lowest → At Risk / Hibernating.
    """
    df = cluster_stats.copy()
    r_max = df["recency_mean"].max() or 1.0
    f_max = df["frequency_mean"].max() or 1.0
    m_max = df["monetary_mean"].max() or 1.0
    df["engagement"] = df.apply(
        lambda r: _engagement_score(
            r["recency_mean"], r["frequency_mean"], r["monetary_mean"],
            r_max, f_max, m_max,
        ),
        axis=1,
    )
    ordered = df.sort_values("engagement", ascending=False)["cluster_id"].tolist()
    n = len(ordered)

    if n == 3:
        names = ["Champions", "Potential Loyalists", "At Risk / Hibernating"]
    elif n == 4:
        names = ["Champions", "Loyal Customers", "New / Promising", "At Risk / Hibernating"]
    elif n == 5:
        names = [
            "Champions",
            "Loyal Customers",
            "Potential Loyalists",
            "New / Promising",
            "At Risk / Hibernating",
        ]
    else:
        names = [f"Segment {i + 1}" for i in range(n)]
        # Still put extremes
        names[0] = "Champions"
        names[-1] = "At Risk / Hibernating"

    return {int(cid): names[i] for i, cid in enumerate(ordered)}


def run_rfm_segmentation(
    con: duckdb.DuckDBPyConnection,
    k: int | None = None,
    random_state: int = 42,
    scatter_sample: int = 2500,
) -> dict[str, Any]:
    """Full RFM pipeline → serializable result dict for JSON export."""
    rfm = extract_rfm(con)
    if rfm.empty:
        raise RuntimeError("No RFM rows — is gold.fact_order populated?")

    snapshot = str(rfm["snapshot_date"].iloc[0])

    # Features for clustering
    feat = pd.DataFrame({
        "R": rfm["recency_days"].astype(float),
        "F_log": np.log1p(rfm["frequency"].astype(float)),
        "M_log": np.log1p(rfm["monetary"].astype(float)),
    })
    # Cap extreme recency for robustness
    r_cap = float(feat["R"].quantile(0.99))
    feat["R"] = feat["R"].clip(upper=r_cap)

    scaler = RobustScaler()
    X = scaler.fit_transform(feat.values)

    metrics_by_k: list[dict[str, Any]] = []
    if k is None:
        k, metrics_by_k = choose_k(X, random_state=random_state)
    else:
        k = int(k)
        # Still compute comparison curve for evaluation charts
        _, metrics_by_k = choose_k(X, random_state=random_state)

    model = KMeans(n_clusters=k, random_state=random_state, n_init=10)
    labels = model.fit_predict(X)
    rfm = rfm.copy()
    rfm["cluster_id"] = labels

    # Final model evaluation on full scaled matrix
    final_metrics = _eval_k(X, labels, model.inertia_, random_state=random_state)

    # Per-point silhouette → mean per cluster (sample for speed)
    n = X.shape[0]
    rng = np.random.default_rng(random_state)
    sil_idx = rng.choice(n, size=min(15_000, n), replace=False)
    sil_vals = silhouette_samples(X[sil_idx], labels[sil_idx])
    sil_df = pd.DataFrame({"cluster_id": labels[sil_idx], "silhouette": sil_vals})
    sil_by_cluster = {
        int(cid): round(float(g["silhouette"].mean()), 4)
        for cid, g in sil_df.groupby("cluster_id")
    }

    # Per-cluster stats
    rows = []
    total_m = float(rfm["monetary"].sum()) or 1.0
    n_all = len(rfm)
    for cid, g in rfm.groupby("cluster_id"):
        rows.append({
            "cluster_id": int(cid),
            "size": int(len(g)),
            "pct": round(100.0 * len(g) / n_all, 2),
            "recency_mean": round(float(g["recency_days"].mean()), 2),
            "recency_median": round(float(g["recency_days"].median()), 2),
            "frequency_mean": round(float(g["frequency"].mean()), 3),
            "frequency_median": round(float(g["frequency"].median()), 2),
            "monetary_mean": round(float(g["monetary"].mean()), 2),
            "monetary_median": round(float(g["monetary"].median()), 2),
            "monetary_sum": round(float(g["monetary"].sum()), 2),
            "gmv_share_pct": round(100.0 * float(g["monetary"].sum()) / total_m, 2),
            "silhouette_mean": sil_by_cluster.get(int(cid)),
        })
    cluster_stats = pd.DataFrame(rows)
    label_map = assign_business_labels(cluster_stats)
    cluster_stats["segment"] = cluster_stats["cluster_id"].map(label_map)
    rfm["segment"] = rfm["cluster_id"].map(label_map)

    # Sort segments by size desc for charts
    cluster_stats = cluster_stats.sort_values("size", ascending=False)

    # Scatter sample (smaller for lighter JSON)
    sample_n = min(scatter_sample, len(rfm))
    sample = rfm.sample(n=sample_n, random_state=random_state)
    scatter = [
        {
            "r": int(row.recency_days),
            "m": round(float(row.monetary), 2),
            "f": int(row.frequency),
            "segment": row.segment,
            "cluster_id": int(row.cluster_id),
        }
        for row in sample.itertuples()
    ]

    # Backward-compatible silhouette_by_k map
    silhouette_by_k = {str(r["k"]): r["silhouette"] for r in metrics_by_k}

    result = {
        "task": "rfm_segmentation",
        "method": "RFM + RobustScaler + KMeans",
        "snapshot_date": snapshot,
        "n_customers": n_all,
        "k": k,
        "features": ["recency_days", "log1p(frequency)", "log1p(monetary)"],
        "scaler": "RobustScaler",
        # Primary metrics (final model)
        "silhouette": final_metrics["silhouette"],
        "davies_bouldin": final_metrics["davies_bouldin"],
        "calinski_harabasz": final_metrics["calinski_harabasz"],
        "inertia": final_metrics["inertia"],
        # Evaluation bundle for UI
        "evaluation": {
            "final": {
                **final_metrics,
                "k": k,
                "n_samples": n_all,
                "n_features": 3,
                "metric_notes": {
                    "silhouette": "[-1, 1] higher better — separation vs cohesion",
                    "davies_bouldin": "≥0 lower better — avg similarity of clusters",
                    "calinski_harabasz": "higher better — between/within dispersion",
                    "inertia": "SSE to centroids — lower better; use elbow vs k",
                },
            },
            "by_k": metrics_by_k,
            "silhouette_by_cluster": [
                {
                    "cluster_id": int(r["cluster_id"]),
                    "segment": r["segment"],
                    "silhouette_mean": r["silhouette_mean"],
                    "size": int(r["size"]),
                }
                for r in cluster_stats.to_dict(orient="records")
            ],
            "selection_rule": "argmax silhouette over k in [3..6]",
        },
        "silhouette_by_k": silhouette_by_k,
        "segments": cluster_stats.to_dict(orient="records"),
        "scatter_sample": scatter,
        "overall": {
            "recency_mean": round(float(rfm["recency_days"].mean()), 2),
            "frequency_mean": round(float(rfm["frequency"].mean()), 3),
            "monetary_mean": round(float(rfm["monetary"].mean()), 2),
            "repeat_customer_pct": round(
                100.0 * float((rfm["frequency"] >= 2).mean()), 2
            ),
        },
        "label_map": {str(kk): vv for kk, vv in label_map.items()},
        "interpretation": [
            "Champions: high monetary value — prioritize retention & VIP.",
            "Loyal / Potential: mid value — nurture with cross-sell.",
            "New / Promising: recent first orders — second-purchase push.",
            "At Risk / Hibernating: high recency (long silence) — win-back.",
        ],
    }

    logger.info(
        "RFM done: n=%s k=%s sil=%.4f DBI=%.4f CHI=%.1f segments=%s",
        f"{n_all:,}", k,
        final_metrics["silhouette"],
        final_metrics["davies_bouldin"],
        final_metrics["calinski_harabasz"],
        ", ".join(f"{r['segment']}={r['size']}" for r in result["segments"]),
    )
    return result

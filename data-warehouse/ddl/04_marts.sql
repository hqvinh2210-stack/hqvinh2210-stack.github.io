-- ============================================================
-- GOLD — Analytical marts (views)
-- ============================================================

-- Daily sales by customer state & product category
CREATE OR REPLACE VIEW gold.mart_sales_daily AS
SELECT
    d.full_date,
    d.year,
    d.year_month,
    c.customer_state,
    g.region AS customer_region,
    p.category_name_en,
    COUNT(DISTINCT f.order_id)              AS orders,
    COUNT(*)                                AS items,
    SUM(f.price)                            AS gmv,
    SUM(f.freight_value)                    AS freight,
    SUM(f.item_total)                       AS gmv_plus_freight,
    ROUND(SUM(f.price) / NULLIF(COUNT(DISTINCT f.order_id), 0), 2) AS aov
FROM gold.fact_order_item f
JOIN gold.dim_date d ON f.date_purchase_sk = d.date_sk
JOIN gold.dim_customer c ON f.customer_sk = c.customer_sk
LEFT JOIN gold.dim_geography g ON f.geo_customer_sk = g.geo_sk
JOIN gold.dim_product p ON f.product_sk = p.product_sk
WHERE f.is_delivered = 1
GROUP BY 1, 2, 3, 4, 5, 6;

-- Seller monthly performance
CREATE OR REPLACE VIEW gold.mart_seller_performance AS
SELECT
    d.year_month,
    s.seller_id,
    s.seller_city,
    s.seller_state,
    COUNT(DISTINCT f.order_id)   AS orders,
    COUNT(*)                     AS items,
    SUM(f.price)                 AS gmv,
    SUM(f.freight_value)         AS freight,
    ROUND(AVG(f.delivery_days), 2) AS avg_delivery_days,
    ROUND(AVG(f.is_late::NUMERIC) * 100, 2) AS late_rate_pct
FROM gold.fact_order_item f
JOIN gold.dim_date d ON f.date_purchase_sk = d.date_sk
JOIN gold.dim_seller s ON f.seller_sk = s.seller_sk
WHERE f.is_delivered = 1
GROUP BY 1, 2, 3, 4;

-- Delivery SLA by route (customer state × seller state)
CREATE OR REPLACE VIEW gold.mart_delivery_sla AS
SELECT
    d.year_month,
    gc.state AS customer_state,
    gs.state AS seller_state,
    COUNT(*) AS delivered_items,
    ROUND(AVG(f.delivery_days), 2) AS avg_delivery_days,
    ROUND(AVG(CASE WHEN f.is_late = 0 THEN 1.0 ELSE 0.0 END) * 100, 2) AS on_time_rate_pct,
    SUM(CASE WHEN f.is_late = 1 THEN 1 ELSE 0 END) AS late_items
FROM gold.fact_order_item f
JOIN gold.dim_date d ON f.date_purchase_sk = d.date_sk
LEFT JOIN gold.dim_geography gc ON f.geo_customer_sk = gc.geo_sk
LEFT JOIN gold.dim_geography gs ON f.geo_seller_sk = gs.geo_sk
WHERE f.is_delivered = 1
GROUP BY 1, 2, 3;

-- Payment mix
CREATE OR REPLACE VIEW gold.mart_payment_mix AS
SELECT
    d.year_month,
    pt.payment_type,
    pt.payment_group,
    COUNT(*) AS payment_txns,
    COUNT(DISTINCT f.order_id) AS orders,
    SUM(f.payment_value) AS payment_value,
    ROUND(AVG(f.payment_installments), 2) AS avg_installments
FROM gold.fact_payment f
JOIN gold.dim_date d ON f.date_purchase_sk = d.date_sk
JOIN gold.dim_payment_type pt ON f.payment_type_sk = pt.payment_type_sk
GROUP BY 1, 2, 3;

-- Review quality
CREATE OR REPLACE VIEW gold.mart_review_quality AS
SELECT
    d.year_month,
    c.customer_state,
    COUNT(*) AS reviews,
    ROUND(AVG(f.review_score), 3) AS avg_score,
    SUM(CASE WHEN f.review_score >= 4 THEN 1 ELSE 0 END) AS positive_reviews,
    SUM(CASE WHEN f.review_score <= 2 THEN 1 ELSE 0 END) AS negative_reviews,
    ROUND(AVG(f.has_comment::NUMERIC) * 100, 2) AS comment_rate_pct
FROM gold.fact_review f
JOIN gold.dim_date d ON f.date_review_sk = d.date_sk
JOIN gold.dim_customer c ON f.customer_sk = c.customer_sk
GROUP BY 1, 2;

-- Customer repeat (simple lifetime from fact_order)
CREATE OR REPLACE VIEW gold.mart_customer_lifetime AS
SELECT
    c.customer_unique_id,
    c.customer_state,
    COUNT(*) AS lifetime_orders,
    SUM(o.order_gmv) AS lifetime_gmv,
    MIN(d.full_date) AS first_order_date,
    MAX(d.full_date) AS last_order_date,
    CASE WHEN COUNT(*) >= 2 THEN 1 ELSE 0 END AS is_repeat
FROM gold.fact_order o
JOIN gold.dim_customer c ON o.customer_sk = c.customer_sk
JOIN gold.dim_date d ON o.date_purchase_sk = d.date_sk
WHERE o.is_delivered = 1
GROUP BY 1, 2;

-- KPI snapshot (single-row style aggregate for dashboard)
CREATE OR REPLACE VIEW gold.mart_kpi_overview AS
SELECT
    (SELECT COUNT(DISTINCT order_id) FROM gold.fact_order WHERE is_delivered = 1) AS delivered_orders,
    (SELECT COUNT(*) FROM gold.fact_order_item WHERE is_delivered = 1) AS delivered_items,
    (SELECT ROUND(SUM(price), 2) FROM gold.fact_order_item WHERE is_delivered = 1) AS total_gmv,
    (SELECT ROUND(SUM(price) / NULLIF(COUNT(DISTINCT order_id), 0), 2)
     FROM gold.fact_order_item WHERE is_delivered = 1) AS aov,
    (SELECT ROUND(AVG(review_score), 3) FROM gold.fact_review) AS avg_review_score,
    (SELECT ROUND(AVG(is_on_time::NUMERIC) * 100, 2) FROM gold.fact_order WHERE is_delivered = 1) AS on_time_rate_pct,
    (SELECT ROUND(AVG(is_repeat::NUMERIC) * 100, 2) FROM gold.mart_customer_lifetime) AS repeat_customer_pct;

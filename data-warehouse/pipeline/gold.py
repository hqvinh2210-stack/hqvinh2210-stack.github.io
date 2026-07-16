"""Gold layer: dimensions, facts, and analytical marts (DuckDB SQL)."""

from __future__ import annotations

import logging

import duckdb

from .db import ensure_schemas, table_count

logger = logging.getLogger(__name__)

# Brazil region mapping used in dim_geography / customer enrichment
REGION_CASE = """
CASE UPPER(TRIM(state_code))
    WHEN 'AC' THEN 'North' WHEN 'AM' THEN 'North' WHEN 'AP' THEN 'North'
    WHEN 'PA' THEN 'North' WHEN 'RO' THEN 'North' WHEN 'RR' THEN 'North'
    WHEN 'TO' THEN 'North'
    WHEN 'AL' THEN 'Northeast' WHEN 'BA' THEN 'Northeast' WHEN 'CE' THEN 'Northeast'
    WHEN 'MA' THEN 'Northeast' WHEN 'PB' THEN 'Northeast' WHEN 'PE' THEN 'Northeast'
    WHEN 'PI' THEN 'Northeast' WHEN 'RN' THEN 'Northeast' WHEN 'SE' THEN 'Northeast'
    WHEN 'ES' THEN 'Southeast' WHEN 'MG' THEN 'Southeast' WHEN 'RJ' THEN 'Southeast'
    WHEN 'SP' THEN 'Southeast'
    WHEN 'PR' THEN 'South' WHEN 'RS' THEN 'South' WHEN 'SC' THEN 'South'
    WHEN 'DF' THEN 'Midwest' WHEN 'GO' THEN 'Midwest' WHEN 'MS' THEN 'Midwest'
    WHEN 'MT' THEN 'Midwest'
    ELSE 'Unknown'
END
"""


def build_gold(con: duckdb.DuckDBPyConnection, recreate: bool = True) -> dict[str, int]:
    """Build all gold dimensions, facts, and marts. Returns row counts."""
    ensure_schemas(con)
    if recreate:
        _drop_gold(con)

    logger.info("Building dim_date ...")
    _build_dim_date(con)
    logger.info("Building dim_order_status / dim_payment_type ...")
    _build_seed_dims(con)
    logger.info("Building dim_geography ...")
    _build_dim_geography(con)
    logger.info("Building dim_customer ...")
    _build_dim_customer(con)
    logger.info("Building dim_seller ...")
    _build_dim_seller(con)
    logger.info("Building dim_product ...")
    _build_dim_product(con)
    logger.info("Building order-customer map + facts ...")
    _build_order_map(con)
    _build_fact_order(con)
    _build_fact_order_item(con)
    _build_fact_payment(con)
    _build_fact_review(con)
    logger.info("Building marts ...")
    _build_marts(con)

    counts = {}
    for schema_table in [
        "gold.dim_date",
        "gold.dim_order_status",
        "gold.dim_payment_type",
        "gold.dim_geography",
        "gold.dim_customer",
        "gold.dim_seller",
        "gold.dim_product",
        "gold.fact_order",
        "gold.fact_order_item",
        "gold.fact_payment",
        "gold.fact_review",
    ]:
        counts[schema_table] = table_count(con, schema_table)
        logger.info("  %s = %s", schema_table, f"{counts[schema_table]:,}")
    return counts


def _drop_gold(con: duckdb.DuckDBPyConnection) -> None:
    # DuckDB errors if you DROP VIEW on a TABLE (or vice versa) — keep lists separate.
    views = [
        "gold.mart_kpi_overview",
        "gold.mart_customer_lifetime",
        "gold.mart_review_quality",
        "gold.mart_payment_mix",
        "gold.mart_delivery_sla",
        "gold.mart_seller_performance",
        "gold.mart_sales_daily",
        "gold.vw_order_customer_map",
    ]
    tables = [
        "gold.fact_review",
        "gold.fact_payment",
        "gold.fact_order_item",
        "gold.fact_order",
        "gold.dim_product",
        "gold.dim_seller",
        "gold.dim_customer",
        "gold.dim_geography",
        "gold.dim_payment_type",
        "gold.dim_order_status",
        "gold.dim_date",
    ]
    for obj in views:
        con.execute(f"DROP VIEW IF EXISTS {obj}")
    for obj in tables:
        con.execute(f"DROP TABLE IF EXISTS {obj}")


def _build_dim_date(con: duckdb.DuckDBPyConnection) -> None:
    con.execute(
        """
        CREATE TABLE gold.dim_date AS
        SELECT
            CAST(strftime(d, '%Y%m%d') AS INTEGER) AS date_sk,
            d AS full_date,
            CAST(year(d) AS INTEGER) AS year,
            CAST(quarter(d) AS INTEGER) AS quarter,
            CAST(month(d) AS INTEGER) AS month,
            monthname(d) AS month_name,
            CAST(day(d) AS INTEGER) AS day_of_month,
            CAST(isodow(d) AS INTEGER) AS day_of_week,
            dayname(d) AS day_name,
            CAST(week(d) AS INTEGER) AS week_of_year,
            strftime(d, '%Y-%m') AS year_month,
            isodow(d) IN (6, 7) AS is_weekend
        FROM generate_series(DATE '2016-01-01', DATE '2019-12-31', INTERVAL 1 DAY) AS t(d)

        UNION ALL

        SELECT
            -1,
            DATE '1900-01-01',
            1900, 1, 1, 'Unknown', 1, 1, 'Unknown', 1, '1900-01', FALSE
        """
    )


def _build_seed_dims(con: duckdb.DuckDBPyConnection) -> None:
    con.execute(
        """
        CREATE TABLE gold.dim_order_status AS
        SELECT * FROM (VALUES
            (-1, 'unknown',     0, FALSE, FALSE),
            ( 1, 'created',     1, FALSE, FALSE),
            ( 2, 'approved',    2, FALSE, FALSE),
            ( 3, 'invoiced',    3, FALSE, FALSE),
            ( 4, 'processing',  4, FALSE, FALSE),
            ( 5, 'shipped',     5, FALSE, FALSE),
            ( 6, 'delivered',   6, TRUE,  TRUE),
            ( 7, 'canceled',    7, FALSE, TRUE),
            ( 8, 'unavailable', 8, FALSE, TRUE)
        ) AS t(order_status_sk, order_status, sort_order, is_success, is_terminal)
        """
    )
    con.execute(
        """
        CREATE TABLE gold.dim_payment_type AS
        SELECT * FROM (VALUES
            (-1, 'unknown',     'unknown'),
            ( 1, 'credit_card', 'card'),
            ( 2, 'debit_card',  'card'),
            ( 3, 'boleto',      'cash_like'),
            ( 4, 'voucher',     'voucher'),
            ( 5, 'not_defined', 'unknown')
        ) AS t(payment_type_sk, payment_type, payment_group)
        """
    )


def _build_dim_geography(con: duckdb.DuckDBPyConnection) -> None:
    region_expr = REGION_CASE  # expects column alias state_code
    con.execute(
        f"""
        CREATE TABLE gold.dim_geography AS
        WITH cleaned AS (
            SELECT
                lpad(regexp_replace(CAST(geolocation_zip_code_prefix AS VARCHAR), '[^0-9]', '', 'g'), 5, '0')
                    AS zip_code_prefix,
                lower(trim(geolocation_city)) AS city,
                upper(trim(geolocation_state)) AS state_code,
                geolocation_lat AS latitude,
                geolocation_lng AS longitude
            FROM bronze.stg_geolocation
            WHERE geolocation_zip_code_prefix IS NOT NULL
        ),
        ranked AS (
            SELECT
                zip_code_prefix,
                city,
                state_code,
                latitude,
                longitude,
                row_number() OVER (
                    PARTITION BY zip_code_prefix
                    ORDER BY city
                ) AS rn
            FROM cleaned
        ),
        one_city AS (
            SELECT zip_code_prefix, city, state_code
            FROM ranked WHERE rn = 1
        ),
        agg AS (
            SELECT
                zip_code_prefix,
                avg(latitude) AS latitude,
                avg(longitude) AS longitude
            FROM cleaned
            GROUP BY zip_code_prefix
        )
        SELECT
            CAST(row_number() OVER (ORDER BY a.zip_code_prefix) AS INTEGER) AS geo_sk,
            a.zip_code_prefix,
            o.city,
            o.state_code AS state,
            {region_expr.replace('state_code', 'o.state_code')} AS region,
            a.latitude,
            a.longitude
        FROM agg a
        JOIN one_city o ON a.zip_code_prefix = o.zip_code_prefix

        UNION ALL

        SELECT -1, '00000', 'unknown', 'XX', 'Unknown', NULL, NULL
        """
    )


def _build_dim_customer(con: duckdb.DuckDBPyConnection) -> None:
    con.execute(
        """
        CREATE TABLE gold.dim_customer AS
        WITH ranked AS (
            SELECT
                customer_unique_id,
                lpad(regexp_replace(CAST(customer_zip_code_prefix AS VARCHAR), '[^0-9]', '', 'g'), 5, '0')
                    AS customer_zip_code_prefix,
                lower(trim(customer_city)) AS customer_city,
                upper(trim(customer_state)) AS customer_state,
                row_number() OVER (
                    PARTITION BY customer_unique_id
                    ORDER BY customer_id
                ) AS rn
            FROM bronze.stg_customers
            WHERE customer_unique_id IS NOT NULL
        ),
        one AS (
            SELECT * EXCLUDE (rn) FROM ranked WHERE rn = 1
        )
        SELECT
            CAST(row_number() OVER (ORDER BY o.customer_unique_id) AS INTEGER) AS customer_sk,
            o.customer_unique_id,
            o.customer_zip_code_prefix,
            o.customer_city,
            o.customer_state,
            coalesce(g.geo_sk, -1) AS geo_sk,
            current_timestamp AS etl_loaded_at
        FROM one o
        LEFT JOIN gold.dim_geography g
            ON o.customer_zip_code_prefix = g.zip_code_prefix

        UNION ALL

        SELECT -1, 'unknown', '00000', 'unknown', 'XX', -1, current_timestamp
        """
    )


def _build_dim_seller(con: duckdb.DuckDBPyConnection) -> None:
    con.execute(
        """
        CREATE TABLE gold.dim_seller AS
        WITH s AS (
            SELECT
                seller_id,
                lpad(regexp_replace(CAST(seller_zip_code_prefix AS VARCHAR), '[^0-9]', '', 'g'), 5, '0')
                    AS seller_zip_code_prefix,
                lower(trim(seller_city)) AS seller_city,
                upper(trim(seller_state)) AS seller_state
            FROM bronze.stg_sellers
        )
        SELECT
            CAST(row_number() OVER (ORDER BY s.seller_id) AS INTEGER) AS seller_sk,
            s.seller_id,
            s.seller_zip_code_prefix,
            s.seller_city,
            s.seller_state,
            coalesce(g.geo_sk, -1) AS geo_sk,
            current_timestamp AS etl_loaded_at
        FROM s
        LEFT JOIN gold.dim_geography g
            ON s.seller_zip_code_prefix = g.zip_code_prefix

        UNION ALL

        SELECT -1, 'unknown', '00000', 'unknown', 'XX', -1, current_timestamp
        """
    )


def _build_dim_product(con: duckdb.DuckDBPyConnection) -> None:
    con.execute(
        """
        CREATE TABLE gold.dim_product AS
        WITH p AS (
            SELECT
                product_id,
                coalesce(nullif(trim(product_category_name), ''), 'unknown') AS category_name_pt,
                product_name_lenght AS product_name_length,
                product_description_lenght AS product_description_length,
                product_photos_qty,
                product_weight_g,
                product_length_cm,
                product_height_cm,
                product_width_cm
            FROM bronze.stg_products
        ),
        t AS (
            SELECT
                trim(product_category_name) AS product_category_name,
                product_category_name_english
            FROM bronze.stg_category_translation
        )
        SELECT
            CAST(row_number() OVER (ORDER BY p.product_id) AS INTEGER) AS product_sk,
            p.product_id,
            p.category_name_pt,
            coalesce(t.product_category_name_english, 'unknown') AS category_name_en,
            p.product_name_length,
            p.product_description_length,
            p.product_photos_qty,
            p.product_weight_g,
            p.product_length_cm,
            p.product_height_cm,
            p.product_width_cm,
            CASE
                WHEN p.product_length_cm IS NOT NULL
                 AND p.product_height_cm IS NOT NULL
                 AND p.product_width_cm  IS NOT NULL
                THEN CAST(p.product_length_cm AS DOUBLE)
                     * p.product_height_cm * p.product_width_cm
                ELSE NULL
            END AS volume_cm3,
            CASE
                WHEN p.product_weight_g IS NULL THEN 'unknown'
                WHEN p.product_weight_g < 500 THEN 'light'
                WHEN p.product_weight_g < 2000 THEN 'medium'
                ELSE 'heavy'
            END AS weight_bucket,
            CASE
                WHEN p.product_length_cm IS NULL OR p.product_height_cm IS NULL
                     OR p.product_width_cm IS NULL THEN 'unknown'
                WHEN (CAST(p.product_length_cm AS DOUBLE) * p.product_height_cm * p.product_width_cm) < 2000
                    THEN 'small'
                WHEN (CAST(p.product_length_cm AS DOUBLE) * p.product_height_cm * p.product_width_cm) < 15000
                    THEN 'medium'
                ELSE 'large'
            END AS size_bucket,
            current_timestamp AS etl_loaded_at
        FROM p
        LEFT JOIN t ON p.category_name_pt = t.product_category_name

        UNION ALL

        SELECT
            -1, 'unknown', 'unknown', 'unknown',
            NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
            'unknown', 'unknown', current_timestamp
        """
    )


def _build_order_map(con: duckdb.DuckDBPyConnection) -> None:
    con.execute(
        """
        CREATE OR REPLACE VIEW gold.vw_order_customer_map AS
        SELECT
            o.order_id,
            o.customer_id,
            o.order_status,
            TRY_CAST(o.order_purchase_timestamp AS TIMESTAMP) AS order_purchase_timestamp,
            TRY_CAST(o.order_approved_at AS TIMESTAMP) AS order_approved_at,
            TRY_CAST(o.order_delivered_carrier_date AS TIMESTAMP) AS order_delivered_carrier_date,
            TRY_CAST(o.order_delivered_customer_date AS TIMESTAMP) AS order_delivered_customer_date,
            TRY_CAST(o.order_estimated_delivery_date AS TIMESTAMP) AS order_estimated_delivery_date,
            c.customer_unique_id,
            coalesce(dc.customer_sk, -1) AS customer_sk,
            coalesce(dos.order_status_sk, -1) AS order_status_sk
        FROM bronze.stg_orders o
        LEFT JOIN bronze.stg_customers c ON o.customer_id = c.customer_id
        LEFT JOIN gold.dim_customer dc ON c.customer_unique_id = dc.customer_unique_id
        LEFT JOIN gold.dim_order_status dos ON o.order_status = dos.order_status
        """
    )


def _date_sk(expr: str) -> str:
    return f"coalesce(CAST(strftime(CAST({expr} AS DATE), '%Y%m%d') AS INTEGER), -1)"


def _build_fact_order(con: duckdb.DuckDBPyConnection) -> None:
    con.execute(
        f"""
        CREATE TABLE gold.fact_order AS
        WITH items AS (
            SELECT
                order_id,
                count(*) AS item_cnt,
                sum(CAST(price AS DOUBLE)) AS gmv,
                sum(CAST(freight_value AS DOUBLE)) AS freight
            FROM bronze.stg_order_items
            GROUP BY order_id
        ),
        pays AS (
            SELECT order_id, sum(CAST(payment_value AS DOUBLE)) AS pay_total
            FROM bronze.stg_order_payments
            GROUP BY order_id
        )
        SELECT
            CAST(row_number() OVER (ORDER BY m.order_id) AS BIGINT) AS order_sk,
            {_date_sk('m.order_purchase_timestamp')} AS date_purchase_sk,
            CASE WHEN m.order_approved_at IS NOT NULL
                 THEN CAST(strftime(CAST(m.order_approved_at AS DATE), '%Y%m%d') AS INTEGER) END
                AS date_approved_sk,
            CASE WHEN m.order_delivered_customer_date IS NOT NULL
                 THEN CAST(strftime(CAST(m.order_delivered_customer_date AS DATE), '%Y%m%d') AS INTEGER) END
                AS date_delivered_sk,
            CASE WHEN m.order_estimated_delivery_date IS NOT NULL
                 THEN CAST(strftime(CAST(m.order_estimated_delivery_date AS DATE), '%Y%m%d') AS INTEGER) END
                AS date_estimated_sk,
            m.customer_sk,
            coalesce(dc.geo_sk, -1) AS geo_customer_sk,
            m.order_status_sk,
            m.order_id,
            coalesce(i.item_cnt, 0) AS order_item_count,
            coalesce(i.gmv, 0) AS order_gmv,
            coalesce(i.freight, 0) AS order_freight,
            coalesce(p.pay_total, 0) AS order_payment_total,
            date_diff('second', m.order_purchase_timestamp, m.order_approved_at) / 3600.0
                AS approval_hours,
            date_diff('second', m.order_purchase_timestamp, m.order_delivered_customer_date) / 86400.0
                AS delivery_days,
            date_diff('second', m.order_purchase_timestamp, m.order_estimated_delivery_date) / 86400.0
                AS estimated_days,
            date_diff('second', m.order_estimated_delivery_date, m.order_delivered_customer_date) / 86400.0
                AS delay_days,
            CASE WHEN m.order_status = 'delivered' THEN 1 ELSE 0 END AS is_delivered,
            CASE
                WHEN m.order_delivered_customer_date IS NULL
                  OR m.order_estimated_delivery_date IS NULL THEN NULL
                WHEN CAST(m.order_delivered_customer_date AS DATE)
                     <= CAST(m.order_estimated_delivery_date AS DATE) THEN 1
                ELSE 0
            END AS is_on_time,
            current_timestamp AS etl_loaded_at
        FROM gold.vw_order_customer_map m
        LEFT JOIN gold.dim_customer dc ON m.customer_sk = dc.customer_sk
        LEFT JOIN items i ON m.order_id = i.order_id
        LEFT JOIN pays p ON m.order_id = p.order_id
        """
    )


def _build_fact_order_item(con: duckdb.DuckDBPyConnection) -> None:
    con.execute(
        f"""
        CREATE TABLE gold.fact_order_item AS
        SELECT
            CAST(row_number() OVER (ORDER BY oi.order_id, oi.order_item_id) AS BIGINT) AS order_item_sk,
            {_date_sk('m.order_purchase_timestamp')} AS date_purchase_sk,
            CASE WHEN oi.shipping_limit_date IS NOT NULL
                 THEN CAST(strftime(CAST(TRY_CAST(oi.shipping_limit_date AS TIMESTAMP) AS DATE), '%Y%m%d') AS INTEGER) END
                AS date_shipping_limit_sk,
            CASE WHEN m.order_delivered_customer_date IS NOT NULL
                 THEN CAST(strftime(CAST(m.order_delivered_customer_date AS DATE), '%Y%m%d') AS INTEGER) END
                AS date_delivered_sk,
            m.customer_sk,
            coalesce(dp.product_sk, -1) AS product_sk,
            coalesce(ds.seller_sk, -1) AS seller_sk,
            coalesce(dc.geo_sk, -1) AS geo_customer_sk,
            coalesce(ds.geo_sk, -1) AS geo_seller_sk,
            m.order_status_sk,
            oi.order_id,
            CAST(oi.order_item_id AS INTEGER) AS order_item_id,
            CAST(oi.price AS DOUBLE) AS price,
            CAST(oi.freight_value AS DOUBLE) AS freight_value,
            CAST(oi.price AS DOUBLE) + CAST(oi.freight_value AS DOUBLE) AS item_total,
            CASE WHEN m.order_status = 'delivered' THEN 1 ELSE 0 END AS is_delivered,
            date_diff('second', m.order_purchase_timestamp, m.order_delivered_customer_date) / 86400.0
                AS delivery_days,
            CASE
                WHEN m.order_delivered_customer_date IS NULL
                  OR m.order_estimated_delivery_date IS NULL THEN NULL
                WHEN CAST(m.order_delivered_customer_date AS DATE)
                     > CAST(m.order_estimated_delivery_date AS DATE) THEN 1
                ELSE 0
            END AS is_late,
            current_timestamp AS etl_loaded_at
        FROM bronze.stg_order_items oi
        JOIN gold.vw_order_customer_map m ON oi.order_id = m.order_id
        LEFT JOIN gold.dim_product dp ON oi.product_id = dp.product_id
        LEFT JOIN gold.dim_seller ds ON oi.seller_id = ds.seller_id
        LEFT JOIN gold.dim_customer dc ON m.customer_sk = dc.customer_sk
        """
    )


def _build_fact_payment(con: duckdb.DuckDBPyConnection) -> None:
    con.execute(
        f"""
        CREATE TABLE gold.fact_payment AS
        SELECT
            CAST(row_number() OVER (ORDER BY pay.order_id, pay.payment_sequential) AS BIGINT) AS payment_sk,
            {_date_sk('m.order_purchase_timestamp')} AS date_purchase_sk,
            m.customer_sk,
            coalesce(dpt.payment_type_sk, -1) AS payment_type_sk,
            coalesce(dc.geo_sk, -1) AS geo_customer_sk,
            pay.order_id,
            CAST(pay.payment_sequential AS INTEGER) AS payment_sequential,
            CAST(pay.payment_installments AS INTEGER) AS payment_installments,
            CAST(pay.payment_value AS DOUBLE) AS payment_value,
            current_timestamp AS etl_loaded_at
        FROM bronze.stg_order_payments pay
        JOIN gold.vw_order_customer_map m ON pay.order_id = m.order_id
        LEFT JOIN gold.dim_payment_type dpt ON pay.payment_type = dpt.payment_type
        LEFT JOIN gold.dim_customer dc ON m.customer_sk = dc.customer_sk
        """
    )


def _build_fact_review(con: duckdb.DuckDBPyConnection) -> None:
    con.execute(
        f"""
        CREATE TABLE gold.fact_review AS
        SELECT
            CAST(row_number() OVER (ORDER BY r.review_id) AS BIGINT) AS review_sk,
            {_date_sk('TRY_CAST(r.review_creation_date AS TIMESTAMP)')} AS date_review_sk,
            CASE WHEN m.order_purchase_timestamp IS NOT NULL
                 THEN CAST(strftime(CAST(m.order_purchase_timestamp AS DATE), '%Y%m%d') AS INTEGER) END
                AS date_purchase_sk,
            coalesce(m.customer_sk, -1) AS customer_sk,
            coalesce(dc.geo_sk, -1) AS geo_customer_sk,
            r.order_id,
            r.review_id,
            CAST(r.review_score AS INTEGER) AS review_score,
            CASE
                WHEN nullif(trim(CAST(r.review_comment_title AS VARCHAR)), '') IS NOT NULL
                  OR nullif(trim(CAST(r.review_comment_message AS VARCHAR)), '') IS NOT NULL
                THEN 1 ELSE 0
            END AS has_comment,
            date_diff(
                'second',
                TRY_CAST(r.review_creation_date AS TIMESTAMP),
                TRY_CAST(r.review_answer_timestamp AS TIMESTAMP)
            ) / 3600.0 AS response_hours,
            current_timestamp AS etl_loaded_at
        FROM bronze.stg_order_reviews r
        LEFT JOIN gold.vw_order_customer_map m ON r.order_id = m.order_id
        LEFT JOIN gold.dim_customer dc ON m.customer_sk = dc.customer_sk
        """
    )


def _build_marts(con: duckdb.DuckDBPyConnection) -> None:
    con.execute(
        """
        CREATE OR REPLACE VIEW gold.mart_sales_daily AS
        SELECT
            d.full_date,
            d.year,
            d.year_month,
            c.customer_state,
            g.region AS customer_region,
            p.category_name_en,
            count(DISTINCT f.order_id) AS orders,
            count(*) AS items,
            sum(f.price) AS gmv,
            sum(f.freight_value) AS freight,
            sum(f.item_total) AS gmv_plus_freight,
            round(sum(f.price) / nullif(count(DISTINCT f.order_id), 0), 2) AS aov
        FROM gold.fact_order_item f
        JOIN gold.dim_date d ON f.date_purchase_sk = d.date_sk
        JOIN gold.dim_customer c ON f.customer_sk = c.customer_sk
        LEFT JOIN gold.dim_geography g ON f.geo_customer_sk = g.geo_sk
        JOIN gold.dim_product p ON f.product_sk = p.product_sk
        WHERE f.is_delivered = 1
        GROUP BY 1, 2, 3, 4, 5, 6
        """
    )
    con.execute(
        """
        CREATE OR REPLACE VIEW gold.mart_seller_performance AS
        SELECT
            d.year_month,
            s.seller_id,
            s.seller_city,
            s.seller_state,
            count(DISTINCT f.order_id) AS orders,
            count(*) AS items,
            sum(f.price) AS gmv,
            sum(f.freight_value) AS freight,
            round(avg(f.delivery_days), 2) AS avg_delivery_days,
            round(avg(CAST(f.is_late AS DOUBLE)) * 100, 2) AS late_rate_pct
        FROM gold.fact_order_item f
        JOIN gold.dim_date d ON f.date_purchase_sk = d.date_sk
        JOIN gold.dim_seller s ON f.seller_sk = s.seller_sk
        WHERE f.is_delivered = 1
        GROUP BY 1, 2, 3, 4
        """
    )
    con.execute(
        """
        CREATE OR REPLACE VIEW gold.mart_delivery_sla AS
        SELECT
            d.year_month,
            gc.state AS customer_state,
            gs.state AS seller_state,
            count(*) AS delivered_items,
            round(avg(f.delivery_days), 2) AS avg_delivery_days,
            round(avg(CASE WHEN f.is_late = 0 THEN 1.0 ELSE 0.0 END) * 100, 2) AS on_time_rate_pct,
            sum(CASE WHEN f.is_late = 1 THEN 1 ELSE 0 END) AS late_items
        FROM gold.fact_order_item f
        JOIN gold.dim_date d ON f.date_purchase_sk = d.date_sk
        LEFT JOIN gold.dim_geography gc ON f.geo_customer_sk = gc.geo_sk
        LEFT JOIN gold.dim_geography gs ON f.geo_seller_sk = gs.geo_sk
        WHERE f.is_delivered = 1
        GROUP BY 1, 2, 3
        """
    )
    con.execute(
        """
        CREATE OR REPLACE VIEW gold.mart_payment_mix AS
        SELECT
            d.year_month,
            pt.payment_type,
            pt.payment_group,
            count(*) AS payment_txns,
            count(DISTINCT f.order_id) AS orders,
            sum(f.payment_value) AS payment_value,
            round(avg(f.payment_installments), 2) AS avg_installments
        FROM gold.fact_payment f
        JOIN gold.dim_date d ON f.date_purchase_sk = d.date_sk
        JOIN gold.dim_payment_type pt ON f.payment_type_sk = pt.payment_type_sk
        GROUP BY 1, 2, 3
        """
    )
    con.execute(
        """
        CREATE OR REPLACE VIEW gold.mart_review_quality AS
        SELECT
            d.year_month,
            c.customer_state,
            count(*) AS reviews,
            round(avg(f.review_score), 3) AS avg_score,
            sum(CASE WHEN f.review_score >= 4 THEN 1 ELSE 0 END) AS positive_reviews,
            sum(CASE WHEN f.review_score <= 2 THEN 1 ELSE 0 END) AS negative_reviews,
            round(avg(CAST(f.has_comment AS DOUBLE)) * 100, 2) AS comment_rate_pct
        FROM gold.fact_review f
        JOIN gold.dim_date d ON f.date_review_sk = d.date_sk
        JOIN gold.dim_customer c ON f.customer_sk = c.customer_sk
        GROUP BY 1, 2
        """
    )
    con.execute(
        """
        CREATE OR REPLACE VIEW gold.mart_customer_lifetime AS
        SELECT
            c.customer_unique_id,
            c.customer_state,
            count(*) AS lifetime_orders,
            sum(o.order_gmv) AS lifetime_gmv,
            min(d.full_date) AS first_order_date,
            max(d.full_date) AS last_order_date,
            CASE WHEN count(*) >= 2 THEN 1 ELSE 0 END AS is_repeat
        FROM gold.fact_order o
        JOIN gold.dim_customer c ON o.customer_sk = c.customer_sk
        JOIN gold.dim_date d ON o.date_purchase_sk = d.date_sk
        WHERE o.is_delivered = 1
        GROUP BY 1, 2
        """
    )
    con.execute(
        """
        CREATE OR REPLACE VIEW gold.mart_kpi_overview AS
        SELECT
            (SELECT count(DISTINCT order_id) FROM gold.fact_order WHERE is_delivered = 1) AS delivered_orders,
            (SELECT count(*) FROM gold.fact_order_item WHERE is_delivered = 1) AS delivered_items,
            (SELECT round(sum(price), 2) FROM gold.fact_order_item WHERE is_delivered = 1) AS total_gmv,
            (SELECT round(sum(price) / nullif(count(DISTINCT order_id), 0), 2)
             FROM gold.fact_order_item WHERE is_delivered = 1) AS aov,
            (SELECT round(avg(review_score), 3) FROM gold.fact_review) AS avg_review_score,
            (SELECT round(avg(CAST(is_on_time AS DOUBLE)) * 100, 2)
             FROM gold.fact_order WHERE is_delivered = 1) AS on_time_rate_pct,
            (SELECT round(avg(CAST(is_repeat AS DOUBLE)) * 100, 2)
             FROM gold.mart_customer_lifetime) AS repeat_customer_pct
        """
    )

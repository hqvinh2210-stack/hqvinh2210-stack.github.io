-- ============================================================
-- BRONZE — Staging tables (1:1 with source CSV)
-- ============================================================

DROP TABLE IF EXISTS bronze.stg_customers CASCADE;
CREATE TABLE bronze.stg_customers (
    customer_id               VARCHAR(64),
    customer_unique_id        VARCHAR(64),
    customer_zip_code_prefix  VARCHAR(16),
    customer_city             VARCHAR(128),
    customer_state            CHAR(2),
    _loaded_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    _source_file              VARCHAR(256) DEFAULT 'olist_customers_dataset.csv'
);

DROP TABLE IF EXISTS bronze.stg_geolocation CASCADE;
CREATE TABLE bronze.stg_geolocation (
    geolocation_zip_code_prefix VARCHAR(16),
    geolocation_lat             DOUBLE PRECISION,
    geolocation_lng             DOUBLE PRECISION,
    geolocation_city            VARCHAR(128),
    geolocation_state           CHAR(2),
    _loaded_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    _source_file                VARCHAR(256) DEFAULT 'olist_geolocation_dataset.csv'
);

DROP TABLE IF EXISTS bronze.stg_orders CASCADE;
CREATE TABLE bronze.stg_orders (
    order_id                      VARCHAR(64),
    customer_id                   VARCHAR(64),
    order_status                  VARCHAR(32),
    order_purchase_timestamp      TIMESTAMP,
    order_approved_at             TIMESTAMP,
    order_delivered_carrier_date  TIMESTAMP,
    order_delivered_customer_date TIMESTAMP,
    order_estimated_delivery_date TIMESTAMP,
    _loaded_at                    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    _source_file                  VARCHAR(256) DEFAULT 'olist_orders_dataset.csv'
);

DROP TABLE IF EXISTS bronze.stg_order_items CASCADE;
CREATE TABLE bronze.stg_order_items (
    order_id            VARCHAR(64),
    order_item_id       INTEGER,
    product_id          VARCHAR(64),
    seller_id           VARCHAR(64),
    shipping_limit_date TIMESTAMP,
    price               NUMERIC(12, 2),
    freight_value       NUMERIC(12, 2),
    _loaded_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    _source_file        VARCHAR(256) DEFAULT 'olist_order_items_dataset.csv'
);

DROP TABLE IF EXISTS bronze.stg_order_payments CASCADE;
CREATE TABLE bronze.stg_order_payments (
    order_id             VARCHAR(64),
    payment_sequential   INTEGER,
    payment_type         VARCHAR(32),
    payment_installments INTEGER,
    payment_value        NUMERIC(12, 2),
    _loaded_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    _source_file         VARCHAR(256) DEFAULT 'olist_order_payments_dataset.csv'
);

DROP TABLE IF EXISTS bronze.stg_order_reviews CASCADE;
CREATE TABLE bronze.stg_order_reviews (
    review_id               VARCHAR(64),
    order_id                VARCHAR(64),
    review_score            INTEGER,
    review_comment_title    TEXT,
    review_comment_message  TEXT,
    review_creation_date    TIMESTAMP,
    review_answer_timestamp TIMESTAMP,
    _loaded_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    _source_file            VARCHAR(256) DEFAULT 'olist_order_reviews_dataset.csv'
);

DROP TABLE IF EXISTS bronze.stg_products CASCADE;
CREATE TABLE bronze.stg_products (
    product_id                 VARCHAR(64),
    product_category_name      VARCHAR(128),
    product_name_lenght        INTEGER,  -- source spelling retained
    product_description_lenght INTEGER,
    product_photos_qty         INTEGER,
    product_weight_g           INTEGER,
    product_length_cm          INTEGER,
    product_height_cm          INTEGER,
    product_width_cm           INTEGER,
    _loaded_at                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    _source_file               VARCHAR(256) DEFAULT 'olist_products_dataset.csv'
);

DROP TABLE IF EXISTS bronze.stg_sellers CASCADE;
CREATE TABLE bronze.stg_sellers (
    seller_id              VARCHAR(64),
    seller_zip_code_prefix VARCHAR(16),
    seller_city            VARCHAR(128),
    seller_state           CHAR(2),
    _loaded_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    _source_file           VARCHAR(256) DEFAULT 'olist_sellers_dataset.csv'
);

DROP TABLE IF EXISTS bronze.stg_category_translation CASCADE;
CREATE TABLE bronze.stg_category_translation (
    product_category_name         VARCHAR(128),
    product_category_name_english VARCHAR(128),
    _loaded_at                    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    _source_file                  VARCHAR(256) DEFAULT 'product_category_name_translation.csv'
);

-- Example load (PostgreSQL):
-- \copy bronze.stg_customers FROM 'EDA/olist_customers_dataset.csv' CSV HEADER;

-- ============================================================
-- Olist Data Warehouse — Schemas (Medallion)
-- Compatible: PostgreSQL 14+ / adapt for BigQuery/Snowflake
-- ============================================================

CREATE SCHEMA IF NOT EXISTS bronze;  -- staging / raw
CREATE SCHEMA IF NOT EXISTS silver;  -- cleaned
CREATE SCHEMA IF NOT EXISTS gold;    -- dimensional model + marts

-- Optional: roles
-- CREATE ROLE dw_engineer;
-- CREATE ROLE dw_analyst;
-- GRANT USAGE ON SCHEMA gold TO dw_analyst;
-- GRANT SELECT ON ALL TABLES IN SCHEMA gold TO dw_analyst;

# Data Warehouse Design — Olist Brazilian E-Commerce

**Nguồn dữ liệu (EDA):** 9 file CSV trong thư mục `EDA/`  
**Phạm vi thời gian:** 2016-09-04 → 2018-10-17  
**Mô hình:** Kimball Dimensional Modeling (Star Schema)  
**Kiến trúc:** Medallion (Bronze → Silver → Gold)

---

## 1. Mục tiêu nghiệp vụ (Business Goals)

| # | Câu hỏi phân tích | Fact chính | Dimension chính |
|---|-------------------|------------|-----------------|
| 1 | Doanh thu / số đơn theo thời gian, mùa vụ | `fact_order_item` | `dim_date` |
| 2 | Top sản phẩm / danh mục bán chạy | `fact_order_item` | `dim_product` |
| 3 | Hiệu suất seller (GMV, số đơn, freight) | `fact_order_item` | `dim_seller`, `dim_geography` |
| 4 | Hành vi khách hàng theo bang / thành phố | `fact_order_item` | `dim_customer`, `dim_geography` |
| 5 | Phương thức thanh toán & trả góp | `fact_payment` | `dim_payment_type` |
| 6 | Chất lượng giao hàng (đúng hẹn / trễ) | `fact_order` | `dim_date`, `dim_order_status` |
| 7 | Điểm review & NPS proxy | `fact_review` | `dim_date`, `dim_product` |

### KPI cốt lõi

- **GMV** = `SUM(price)` (chỉ đơn delivered / valid)
- **Freight revenue** = `SUM(freight_value)`
- **AOV** (Average Order Value) = GMV / số order distinct
- **Items per order** = số line item / số order
- **On-time delivery rate** = % đơn delivered đúng/sớm so với `estimated_delivery_date`
- **Avg delivery days** = `delivered_customer_date − purchase_timestamp`
- **Avg review score**
- **Payment mix** = % theo `payment_type`
- **Repeat customer rate** = khách có ≥ 2 order / tổng khách (`customer_unique_id`)

---

## 2. Nguồn dữ liệu (Source Profile)

| File | Số dòng (approx) | Grain nguồn | Vai trò DW |
|------|------------------|-------------|------------|
| `olist_orders_dataset.csv` | 99,441 | 1 dòng / order | Header đơn + timeline giao hàng |
| `olist_order_items_dataset.csv` | 112,650 | 1 dòng / item trong order | Fact bán hàng chính |
| `olist_order_payments_dataset.csv` | 103,886 | 1 dòng / payment sequence | Fact thanh toán |
| `olist_order_reviews_dataset.csv` | 99,224 | 1 dòng / review | Fact đánh giá |
| `olist_customers_dataset.csv` | 99,441 | 1 dòng / `customer_id` (session) | Dim khách (map unique) |
| `olist_products_dataset.csv` | 32,951 | 1 dòng / product | Dim sản phẩm |
| `olist_sellers_dataset.csv` | 3,095 | 1 dòng / seller | Dim seller |
| `olist_geolocation_dataset.csv` | 1,000,163 | nhiều lat/lng / zip | Dim địa lý (aggregate) |
| `product_category_name_translation.csv` | 71 | 1 dòng / category PT→EN | Enrich dim product |

### Quan hệ nguồn (logical ER)

```
customers 1──∞ orders 1──∞ order_items ∞──1 products
                  │              └──∞──1 sellers
                  ├──∞ payments
                  └──∞ reviews

customers.zip ──► geolocation.zip
sellers.zip   ──► geolocation.zip
products.category ──► category_translation
```

**Lưu ý quan trọng:**

- `customer_id` là ID “session/order-scoped”; **khách thật** là `customer_unique_id` (~96,096 unique).
- 1 order có thể có nhiều items, nhiều payments (installments / multi-method), nhiều reviews (hiếm).
- Geolocation có **nhiều tọa độ** cho cùng zip → cần aggregate (AVG lat/lng) khi load dim.

---

## 3. Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────────────┐
│                     SOURCE  (CSV / EDA folder)                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │  Batch load (daily / one-shot)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  BRONZE (Staging) — raw, minimal transform                      │
│  stg_*  : giữ nguyên cột, thêm _loaded_at, _source_file         │
└──────────────────────────────┬──────────────────────────────────┘
                               │  Clean, type, dedupe, FK check
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  SILVER (Conformed) — cleaned tables                            │
│  cln_orders, cln_order_items, cln_customers, ...                │
└──────────────────────────────┬──────────────────────────────────┘
                               │  Dimensional model + surrogate keys
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  GOLD (Presentation) — Star Schema + Data Marts                 │
│  dim_*  +  fact_*  +  mart_* views                              │
└──────────────────────────────┬──────────────────────────────────┘
                               │
               ┌───────────────┼───────────────┐
               ▼               ▼               ▼
          Power BI /     SQL Analytics     Portfolio
          Looker /       ad-hoc            dashboard
          Tableau
```

### Nguyên tắc thiết kế

1. **Star schema** ưu tiên (dễ BI), snowflake nhẹ cho geography nếu cần.
2. **Surrogate key** (`*_sk` INT) trên mọi dimension; business key giữ riêng.
3. **Conformed dimensions** dùng chung giữa các fact (Date, Customer, Product, Seller, Geography).
4. **Additive facts** lưu measure gốc; ratio (AOV, %) tính ở semantic layer / mart.
5. **Late-arriving / missing** → row `Unknown` (`sk = -1`) trên mọi dim.

---

## 4. Grain & Fact Tables

### 4.1 `fact_order_item` — **Primary sales fact**

| Thuộc tính | Giá trị |
|------------|---------|
| **Grain** | 1 dòng = 1 sản phẩm trong 1 đơn (`order_id` + `order_item_id`) |
| **Nguồn** | `order_items` ⋈ `orders` ⋈ payments (aggregated) optional |
| **Số dòng kỳ vọng** | ~112,650 |

| Cột | Loại | Mô tả |
|-----|------|--------|
| `order_item_sk` | PK | Surrogate |
| `date_purchase_sk` | FK → dim_date | Ngày mua |
| `date_shipping_limit_sk` | FK → dim_date | Hạn ship |
| `date_delivered_sk` | FK → dim_date | Ngày giao (nullable) |
| `customer_sk` | FK → dim_customer | |
| `product_sk` | FK → dim_product | |
| `seller_sk` | FK → dim_seller | |
| `geo_customer_sk` | FK → dim_geography | Vị trí khách |
| `geo_seller_sk` | FK → dim_geography | Vị trí seller |
| `order_status_sk` | FK → dim_order_status | |
| `order_id` | DD | Degenerate dimension |
| `order_item_id` | DD | |
| `price` | measure | Giá item (BRL) |
| `freight_value` | measure | Phí vận chuyển |
| `item_total` | measure | `price + freight_value` |
| `is_delivered` | flag | 1/0 |
| `delivery_days` | measure | Ngày giao thực tế (nullable) |
| `is_late` | flag | Giao trễ so estimated |
| `etl_loaded_at` | meta | |

### 4.2 `fact_payment`

| Thuộc tính | Giá trị |
|------------|---------|
| **Grain** | 1 dòng = 1 payment sequence của 1 order |
| **Nguồn** | `order_payments` ⋈ `orders` |
| **Số dòng** | ~103,886 |

| Cột chính | Mô tả |
|-----------|--------|
| `date_purchase_sk` | Ngày mua đơn |
| `customer_sk` | |
| `payment_type_sk` | credit_card / boleto / voucher / debit_card |
| `order_id`, `payment_sequential` | Degenerate |
| `payment_installments` | Số kỳ trả góp |
| `payment_value` | Số tiền |

### 4.3 `fact_review`

| Thuộc tính | Giá trị |
|------------|---------|
| **Grain** | 1 dòng = 1 review |
| **Nguồn** | `order_reviews` ⋈ `orders` |
| **Số dòng** | ~99,224 |

| Cột chính | Mô tả |
|-----------|--------|
| `date_review_sk` | Ngày tạo review |
| `date_purchase_sk` | Ngày mua (context) |
| `customer_sk` | |
| `order_id`, `review_id` | Degenerate |
| `review_score` | 1–5 (semi-additive / additive count) |
| `has_comment` | 1 nếu có title hoặc message |
| `response_hours` | Thời gian seller/platform phản hồi (nếu có) |

### 4.4 `fact_order` — Order-level delivery fact

| Thuộc tính | Giá trị |
|------------|---------|
| **Grain** | 1 dòng = 1 order |
| **Mục đích** | Metrics giao hàng không bị double-count khi multi-item |
| **Số dòng** | ~99,441 |

| Measure | Công thức |
|---------|-----------|
| `order_item_count` | COUNT items |
| `order_gmv` | SUM(price) |
| `order_freight` | SUM(freight) |
| `order_payment_total` | SUM(payment_value) |
| `approval_hours` | approved_at − purchase |
| `delivery_days` | delivered − purchase |
| `estimated_days` | estimated − purchase |
| `delay_days` | delivered − estimated (âm = sớm) |
| `is_on_time` | delivered ≤ estimated |

---

## 5. Dimension Tables

### 5.1 `dim_date` (conformed)

- Range: **2016-01-01 → 2019-12-31** (cover + buffer)
- PK: `date_sk` = `YYYYMMDD` (smart key) hoặc surrogate tuần tự
- Attributes: `full_date`, `year`, `quarter`, `month`, `month_name`, `week_of_year`, `day_of_week`, `day_name`, `is_weekend`, `year_month` (`YYYY-MM`)

### 5.2 `dim_customer`

| Cột | Nguồn | Ghi chú |
|-----|-------|---------|
| `customer_sk` | surrogate | PK |
| `customer_unique_id` | customers | **Business key** (khách thật) |
| `customer_zip_code_prefix` | customers | Lấy từ bản ghi mới nhất |
| `customer_city` | customers | |
| `customer_state` | customers | UF Brazil (27) |
| `geo_sk` | FK dim_geography | |
| `first_order_date` | derived | SCD Type 1 enrichment |
| `lifetime_orders` | derived | Optional mini-agg (hoặc tính từ fact) |
| `is_current` | SCD | Nếu dùng Type 2 |
| `valid_from` / `valid_to` | SCD Type 2 | Optional |

**SCD recommendation:** Type 1 (overwrite city/state) đủ cho portfolio; Type 2 nếu track di chuyển địa lý theo thời gian.

**Lưu ý:** `customer_id` (order-scoped) **không** đưa vào dim; map qua bridge khi ETL:

```
orders.customer_id → customers.customer_id → customers.customer_unique_id → dim_customer
```

### 5.3 `dim_product`

| Cột | Nguồn |
|-----|-------|
| `product_sk` | surrogate |
| `product_id` | products (BK) |
| `category_name_pt` | products.product_category_name |
| `category_name_en` | translation |
| `product_name_length` | products |
| `product_description_length` | products |
| `product_photos_qty` | products |
| `product_weight_g` | products |
| `product_length_cm`, `height_cm`, `width_cm` | products |
| `volume_cm3` | derived: L×H×W |
| `weight_bucket` | derived: light/medium/heavy |
| `size_bucket` | derived từ volume |

### 5.4 `dim_seller`

| Cột | Nguồn |
|-----|-------|
| `seller_sk` | surrogate |
| `seller_id` | sellers (BK) |
| `seller_zip_code_prefix` | sellers |
| `seller_city`, `seller_state` | sellers |
| `geo_sk` | FK dim_geography |

### 5.5 `dim_geography`

Aggregate từ `olist_geolocation_dataset` theo zip:

| Cột | Mô tả |
|-----|--------|
| `geo_sk` | surrogate |
| `zip_code_prefix` | BK (chuẩn hóa 5 số) |
| `city` | mode / first clean |
| `state` | UF |
| `latitude` | AVG(lat) theo zip |
| `longitude` | AVG(lng) theo zip |
| `region` | derived: North / Northeast / Southeast / South / Midwest |

**Region mapping (Brazil):**

| Region | States |
|--------|--------|
| North | AC, AM, AP, PA, RO, RR, TO |
| Northeast | AL, BA, CE, MA, PB, PE, PI, RN, SE |
| Southeast | ES, MG, RJ, SP |
| South | PR, RS, SC |
| Midwest | DF, GO, MS, MT |

### 5.6 `dim_order_status`

Junk / small dimension:

| status | sort_order | is_success | is_terminal |
|--------|------------|------------|-------------|
| created | 1 | 0 | 0 |
| approved | 2 | 0 | 0 |
| invoiced | 3 | 0 | 0 |
| processing | 4 | 0 | 0 |
| shipped | 5 | 0 | 0 |
| delivered | 6 | 1 | 1 |
| canceled | 7 | 0 | 1 |
| unavailable | 8 | 0 | 1 |

### 5.7 `dim_payment_type`

| payment_type | payment_group |
|--------------|---------------|
| credit_card | card |
| debit_card | card |
| boleto | cash_like |
| voucher | voucher |
| not_defined | unknown |

---

## 6. Bus Matrix (Conformed Dimensions)

| Fact \ Dim | Date | Customer | Product | Seller | Geography | Order Status | Payment Type |
|------------|:----:|:--------:|:-------:|:------:|:---------:|:------------:|:------------:|
| fact_order_item | ✓ | ✓ | ✓ | ✓ | ✓ (cust+seller) | ✓ | |
| fact_payment | ✓ | ✓ | | | ✓ (cust) | | ✓ |
| fact_review | ✓ | ✓ | | | ✓ (cust) | | |
| fact_order | ✓ | ✓ | | | ✓ (cust) | ✓ | |

---

## 7. Star Schema (logical)

```
                         ┌──────────────┐
                         │   dim_date   │
                         └──────┬───────┘
                                │
┌──────────────┐    ┌───────────┴────────────┐    ┌──────────────┐
│ dim_customer │────│   fact_order_item      │────│ dim_product  │
└──────┬───────┘    │   (grain: line item)   │    └──────────────┘
       │            └───────────┬────────────┘
       │                        │
┌──────┴───────┐         ┌──────┴───────┐
│dim_geography │         │  dim_seller  │─── dim_geography
└──────────────┘         └──────────────┘

┌──────────────┐    ┌────────────────────┐    ┌──────────────────┐
│ dim_customer │────│   fact_payment     │────│ dim_payment_type │
└──────────────┘    └────────────────────┘    └──────────────────┘

┌──────────────┐    ┌────────────────────┐
│ dim_customer │────│   fact_review      │
└──────────────┘    └────────────────────┘

┌──────────────┐    ┌────────────────────┐    ┌──────────────────┐
│ dim_customer │────│   fact_order       │────│ dim_order_status │
└──────────────┘    └────────────────────┘    └──────────────────┘
```

Xem sơ đồ Mermaid: [`diagrams/star_schema.mmd`](diagrams/star_schema.mmd)

---

## 8. ETL Pipeline (tóm tắt)

### 8.1 Bronze — Load

```
COPY / bulk insert CSV → stg_*
+ metadata: loaded_at, source_file, row_hash
```

### 8.2 Silver — Transform rules

| Rule | Chi tiết |
|------|----------|
| Trim / lower city names | Chuẩn hóa chuỗi |
| Zip pad | `zip_code_prefix` → 5 ký tự zero-pad |
| Timestamp parse | ISO → TIMESTAMP |
| Null status dates | Giữ NULL (không fake date) |
| Dedupe geolocation | GROUP BY zip → AVG lat/lng |
| Category join | LEFT JOIN translation; missing → `'unknown'` |
| Order without items | Vẫn vào `fact_order`; không vào `fact_order_item` |
| Payment orphan | Drop hoặc quarantine nếu order_id không tồn tại |
| Review multi | Giữ tất cả; grain = review_id |

### 8.3 Gold — Load order (dependencies)

```
1. dim_date (static generate)
2. dim_order_status, dim_payment_type (seed)
3. dim_geography  ← geolocation aggregate
4. dim_customer   ← customers + geo
5. dim_seller     ← sellers + geo
6. dim_product    ← products + translation
7. fact_order
8. fact_order_item
9. fact_payment
10. fact_review
11. mart views / aggregates
```

### 8.4 Incremental strategy (production)

- **Watermark:** `order_purchase_timestamp` / `review_answer_timestamp`
- **Facts:** append + merge theo business key
- **Dims:** SCD1 upsert theo BK; SCD2 nếu bật
- **Full refresh OK** cho portfolio (toàn bộ < 1.5M rows)

---

## 9. Data Quality Checks

| Check | Rule | Severity |
|-------|------|----------|
| PK uniqueness | `order_id+order_item_id` unique in fact_order_item | Error |
| FK integrity | Mọi `*_sk` tồn tại trong dim (hoặc -1) | Error |
| Amount non-negative | `price`, `freight_value`, `payment_value` ≥ 0 | Warn |
| Date order | `purchase ≤ approved ≤ carrier ≤ delivered` (khi có) | Warn |
| Status consistency | delivered ⇒ `delivered_customer_date` NOT NULL | Warn |
| Payment vs GMV | `SUM(payment)` ≈ `SUM(price+freight)` per order (±1 BRL) | Warn |
| Row count drift | Bronze count vs source file lines − 1 | Error |

---

## 10. Data Marts (views / aggregate tables)

### `mart_sales_daily`
Grain: date × state × category  
Measures: gmv, freight, orders, items, aov

### `mart_seller_performance`
Grain: seller × month  
Measures: gmv, orders, avg_review (join), late_rate

### `mart_customer_cohort`
Grain: first_order_month × activity_month  
Measures: active_customers, revenue (retention)

### `mart_delivery_sla`
Grain: date × customer_state × seller_state  
Measures: avg_delivery_days, on_time_rate, late_orders

### `mart_payment_mix`
Grain: date × payment_type  
Measures: payment_value, txn_count, avg_installments

---

## 11. Security & Governance (gợi ý)

- PII nhẹ: city/state/zip — **không** có tên/email/SĐT trong Olist public.
- Phân quyền: Analyst (SELECT Gold), Engineer (ALL Bronze/Silver).
- Lineage: document `source_file → stg → cln → dim/fact`.
- Naming: `snake_case`, prefix `dim_` / `fact_` / `stg_` / `mart_`.

---

## 12. Công nghệ đề xuất (stack linh hoạt)

| Layer | Option A (cloud) | Option B (local portfolio) |
|-------|------------------|----------------------------|
| Storage | S3 / GCS | Local / DuckDB file |
| Warehouse | BigQuery / Snowflake / Redshift | PostgreSQL / DuckDB |
| ETL | dbt + Airflow / Dagster | Python (pandas/polars) + SQL |
| BI | Power BI / Metabase / Looker Studio | Power BI / portfolio HTML charts |

Portfolio hiện tại đã gắn tech tags: **Python · SQL · Power BI · Airflow** → khớp Option B + dbt-style SQL.

---

## 13. Deliverables trong repo

```
data-warehouse/
├── DESIGN.md                 ← tài liệu này
├── README.md                 ← hướng dẫn chạy pipeline
├── requirements.txt
├── pipeline/                 ← Python ETL (CSV → DuckDB / PostgreSQL)
│   ├── run.py
│   ├── bronze.py
│   ├── gold.py
│   └── quality.py
├── diagrams/
│   └── star_schema.mmd       ← Mermaid ER/star
├── ddl/                      ← reference PostgreSQL DDL
│   ├── 00_create_schemas.sql
│   ├── 01_staging.sql
│   ├── 02_dimensions.sql
│   ├── 03_facts.sql
│   └── 04_marts.sql
└── output/
    └── olist_dw.duckdb       ← tạo khi chạy pipeline
```

### Chạy pipeline

```powershell
cd data-warehouse
python -m pip install -r requirements.txt
python -m pipeline.run
# optional:
python -m pipeline.run --export-postgres --postgres-url "postgresql://user:pass@localhost:5432/olist"
```

Pipeline mặc định export **GitHub Pages JSON**:

- `assets/data/dashboard.json` — KPI + series cho Chart.js (`index.html`)
- `assets/data/meta.json` — metadata

Tắt export web: `python -m pipeline.run --no-export-web`

---

## 14. Tóm tắt quyết định thiết kế

| Quyết định | Lý do |
|------------|--------|
| 4 fact tables | Khác grain (item / payment / review / order) — tránh fan-out sai KPI |
| `customer_unique_id` làm BK dim_customer | Phản ánh khách thật, đo repeat rate đúng |
| Geography dim dùng chung | Customer & seller cùng conformed geo |
| `fact_order` tách riêng | Delivery SLA không bị nhân bản khi multi-item |
| Geolocation aggregate theo zip | 1M rows → ~dim size hợp lý |
| Star (không full snowflake) | Tối ưu cho Power BI star-schema engine |

---

*Thiết kế dựa trên bộ Olist E-Commerce public dataset trong `EDA/`. Có thể triển khai trực tiếp bằng các script DDL kèm theo.*

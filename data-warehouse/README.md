# Olist Data Warehouse — Python Pipeline

ETL pipeline: **EDA CSV → Bronze (staging) → Gold (star schema)** using **DuckDB** (default) with optional export to **PostgreSQL**.

## Quick start (DuckDB + GitHub Pages JSON)

```powershell
cd C:\Users\admin\Downloads\hqvinh2210-stack.github.io\data-warehouse

python -m pip install -r requirements.txt

# Full load → output/olist_dw.duckdb + ../assets/data/dashboard.json
python -m pipeline.run
```

Expected runtime: ~30–90s depending on disk (geolocation ~1M rows).

### Dashboard on GitHub Pages

Pipeline **exports web JSON by default**:

| Output | Used by |
|--------|---------|
| `assets/data/dashboard.json` | `index.html` + Chart.js |
| `assets/data/meta.json` | generation metadata |

```powershell
# skip JSON export
python -m pipeline.run --no-export-web

# custom JSON folder
python -m pipeline.run --web-out ..\assets\data
```

Preview locally (required for `fetch` of JSON — do not open `index.html` as `file://`):

```powershell
cd C:\Users\admin\Downloads\hqvinh2210-stack.github.io
python -m http.server 8080
# open http://localhost:8080
```

## Query the warehouse

```powershell
python -c "import duckdb; c=duckdb.connect('output/olist_dw.duckdb'); print(c.sql('SELECT * FROM gold.mart_kpi_overview').df())"
```

```sql
-- Top categories by GMV
SELECT category_name_en, SUM(gmv) AS gmv, SUM(orders) AS orders
FROM gold.mart_sales_daily
GROUP BY 1
ORDER BY gmv DESC
LIMIT 10;
```

## CLI options

| Flag | Description |
|------|-------------|
| `--eda PATH` | Folder containing Olist CSVs (default: `../EDA`) |
| `--duckdb PATH` | Output `.duckdb` file |
| `--export-postgres` | Copy `gold.*` tables/views → PostgreSQL |
| `--postgres-url URL` | e.g. `postgresql://user:pass@localhost:5432/olist` |
| `--engine postgres` | Same as DuckDB build + export to Postgres |
| `--skip-geo` | Skip 1M-row geolocation (smoke test) |
| `--skip-quality` | Skip DQ checks |
| `-v` | Debug logs |

### Export to PostgreSQL

```powershell
python -m pipeline.run `
  --export-postgres `
  --postgres-url "postgresql://postgres:postgres@localhost:5432/olist_dw"
```

Requires a running Postgres instance and `psycopg2-binary` (in `requirements.txt`).

## Architecture

```
EDA/*.csv
    │  pipeline.bronze.load_bronze
    ▼
bronze.stg_*          (raw + _loaded_at)
    │  pipeline.gold.build_gold
    ▼
gold.dim_*            (date, customer, product, seller, geography, ...)
gold.fact_*           (order, order_item, payment, review)
gold.mart_*           (views for BI)
    │  optional export_schema_to_postgres
    ▼
PostgreSQL gold.*
```

See [DESIGN.md](./DESIGN.md) for the full dimensional model.

## Project layout

```
data-warehouse/
├── DESIGN.md
├── README.md
├── requirements.txt
├── .env.example
├── pipeline/
│   ├── run.py          # CLI
│   ├── config.py
│   ├── db.py
│   ├── bronze.py
│   ├── gold.py
│   └── quality.py
├── ddl/                # Reference PostgreSQL DDL
└── output/
    └── olist_dw.duckdb # created at runtime
```

## Data quality

After load, the pipeline runs checks:

- Minimum row counts on dims/facts  
- Uniqueness of fact business keys  
- Non-negative prices  
- Date surrogate FK integrity  
- Payment vs item total reconciliation (warn)  
- `mart_kpi_overview` smoke test  

Exit code `1` if any **error** check fails; `2` on unexpected exception.

## Environment variables

Copy `.env.example` → `.env` and adjust. See file for keys (`DW_ENGINE`, `DATABASE_URL`, …).

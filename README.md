# Olist E-Commerce Data Warehouse Portfolio

Static GitHub Pages site showcasing a **Kimball star-schema data warehouse** built from the Brazilian Olist e-commerce dataset.

## Live site

GitHub Pages: `https://hqvinh2210-stack.github.io/` (after push + Pages enabled)

## What you see

- **Dashboard** — GMV, orders, categories, payments, regions, reviews, delivery SLA (Chart.js)
- **Architecture** — Bronze → Gold → JSON web export
- **Data** — `assets/data/dashboard.json` (generated from DuckDB gold layer)

## Rebuild data + dashboard JSON + RFM ML

```powershell
cd data-warehouse
python -m pip install -r requirements.txt
python -m pipeline.run
python -m ml.run_ml
```

Outputs:

- `data-warehouse/output/olist_dw.duckdb` — full warehouse (local; large)
- `assets/data/dashboard.json` / `js/dashboard-data.js` — BI aggregates (commit)
- `js/ml_results.json` — RFM segments for the ML section (commit)

## Local preview

```powershell
cd C:\Users\admin\Downloads\hqvinh2210-stack.github.io
python -m http.server 8080
```

Open http://localhost:8080

## Docs

- [data-warehouse/DESIGN.md](data-warehouse/DESIGN.md) — dimensional model
- [data-warehouse/README.md](data-warehouse/README.md) — pipeline CLI

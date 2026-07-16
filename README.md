# Olist E-Commerce Data Warehouse Portfolio

Static GitHub Pages site showcasing a **Kimball star-schema data warehouse** built from the Brazilian Olist e-commerce dataset.

## Live site

GitHub Pages: `https://hqvinh2210-stack.github.io/` (after push + Pages enabled)

## What you see

- **Dashboard** — GMV, orders, categories, payments, regions, reviews, delivery SLA (Chart.js)
- **Architecture** — Bronze → Gold → JSON web export
- **Data** — `assets/data/dashboard.json` (generated from DuckDB gold layer)

## Rebuild data + dashboard JSON

```powershell
cd data-warehouse
python -m pip install -r requirements.txt
python -m pipeline.run
```

Outputs:

- `data-warehouse/output/olist_dw.duckdb` — full warehouse (local; large)
- `assets/data/dashboard.json` — aggregates for the website (commit this)

## Local preview

```powershell
cd C:\Users\admin\Downloads\hqvinh2210-stack.github.io
python -m http.server 8080
```

Open http://localhost:8080

## Docs

- [data-warehouse/DESIGN.md](data-warehouse/DESIGN.md) — dimensional model
- [data-warehouse/README.md](data-warehouse/README.md) — pipeline CLI

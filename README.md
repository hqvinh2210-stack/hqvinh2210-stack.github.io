# HA QUANG VINH — Data Analyst Portfolio

React + Vite portfolio with an Olist e-commerce data warehouse case study.

## Live site

https://hqvinh2210-stack.github.io/

## Why deploy was broken

GitHub Pages was serving the **source** `index.html`, which loads `/src/main.jsx`. Browsers cannot run JSX and reject the wrong MIME type (`text/jsx`). The app must be **built** with Vite first; only the `dist/` output should be published.

## Local development

```powershell
cd C:\Users\admin\Downloads\hqvinh2210-stack.github.io
npm.cmd install
npm.cmd run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## Production build (local check)

```powershell
npm.cmd run build
npm.cmd run preview
```

`build` writes optimized JS/CSS into `dist/` and copies `index.html` → `404.html` for SPA deep links.

## Deploy (GitHub Pages)

Deployment is automated by [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):

1. Push to `main` (or run the workflow manually under **Actions**).
2. One-time setup on GitHub:
   - **Settings → Pages → Build and deployment → Source: GitHub Actions**
3. After the workflow succeeds, the site is live at the URL above.

Do **not** point Pages at the repo root on `main` — that serves raw JSX and causes the MIME error.

## Data warehouse rebuild (optional)

```powershell
cd data-warehouse
python -m pip install -r requirements.txt
python -m pipeline.run
python -m ml.run_ml
```

Outputs used by the site live under `public/assets/data/` (copied into `dist` on build).

## Docs

- [data-warehouse/DESIGN.md](data-warehouse/DESIGN.md) — dimensional model
- [data-warehouse/README.md](data-warehouse/README.md) — pipeline CLI

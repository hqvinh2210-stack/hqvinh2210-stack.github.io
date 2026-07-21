export const profile = {
  name: "HA QUANG VINH",
  title: "Data Analyst",
  location: "Vietnam · Remote-friendly",
  email: "hqvinh2210@gmail.com",
  github: "https://github.com/hqvinh2210-stack",
  linkedin: "https://www.linkedin.com/in/",
  valueProp:
    "I turn messy operational data into clear decisions: problem, analysis, insight, and quantified impact.",
  bio: "Data analyst focused on e-commerce and operational analytics. I build end-to-end pipelines (CSV to star schema), exploratory models (RFM / clustering), and dashboards that product and ops teams can actually use. Comfortable moving between SQL, Python, and BI tools without losing the business question.",
};

export const skills = [
  { name: "SQL", level: 92 },
  { name: "Python", level: 88 },
  { name: "Power BI / Tableau", level: 84 },
  { name: "Excel", level: 86 },
  { name: "Statistics", level: 80 },
  { name: "Data Modeling", level: 90 },
];

export const skillRadar = [
  { skill: "SQL", value: 92 },
  { skill: "Python", value: 88 },
  { skill: "BI Tools", value: 84 },
  { skill: "Excel", value: 86 },
  { skill: "Stats", value: 80 },
  { skill: "Modeling", value: 90 },
];

export const projects = [
  {
    id: "olist-dw",
    title: "Olist E-Commerce Data Warehouse",
    problem:
      "Fragmented CSVs made it hard to trust GMV, delivery SLA, and category performance across 2 years of orders.",
    metrics: [
      { label: "Delivered orders", value: "96.5K" },
      { label: "On-time rate", value: "93.2%" },
    ],
    stack: ["Python", "DuckDB", "Kimball SQL", "EDA"],
    href: "/case-study/olist-dw",
    preview: "gmv-trend",
  },
  {
    id: "rfm-segments",
    title: "RFM Customer Segmentation",
    problem:
      "Marketing needed a durable customer grouping beyond one-off spreadsheets: who is loyal, who is at risk, who is high-value.",
    metrics: [
      { label: "Customers scored", value: "93.4K" },
      { label: "Silhouette (k=3)", value: "0.35" },
    ],
    stack: ["Python", "scikit-learn", "RFM", "KMeans 3D"],
    href: "/case-study/olist-dw#clustering",
    preview: "rfm-bars",
  },
  {
    id: "ops-sla",
    title: "Delivery SLA Insight Layer",
    problem:
      "Late deliveries were discussed anecdotally. Ops needed a single definition of on-time and a path to root causes by region.",
    metrics: [
      { label: "On-time deliveries", value: "93.2%" },
      { label: "Avg review score", value: "4.09" },
    ],
    stack: ["SQL", "Star schema", "Power BI"],
    href: "/case-study/olist-dw#impact",
    preview: "sla-gauge",
  },
];

export const experience = [
  {
    period: "2025 — Present",
    role: "Data Analyst (Portfolio & Applied Projects)",
    org: "Independent / Open datasets",
    points: [
      "Ran full EDA on 9 Olist CSVs, then designed Kimball star schema on DuckDB.",
      "Shipped medallion pipeline (bronze → gold) plus portfolio BI + 3D RFM clusters.",
      "Built RFM + KMeans with silhouette / Davies-Bouldin / Calinski-Harabasz metrics.",
    ],
  },
  {
    period: "2023 — 2025",
    role: "Business / Operations Analytics",
    org: "Cross-functional projects",
    points: [
      "Translated stakeholder questions into measurable KPIs and dashboard specs.",
      "Automated recurring Excel/SQL reports; cut manual refresh time substantially.",
      "Partnered with product and ops to define SLA and revenue metrics consistently.",
    ],
  },
  {
    period: "Earlier",
    role: "Foundation: SQL, Python, BI",
    org: "Courses & self-directed labs",
    points: [
      "Practiced dimensional modeling, A/B framing, and descriptive statistics.",
      "Built portfolio pieces focused on story: problem → method → insight → impact.",
    ],
  },
];

export const caseStudy = {
  slug: "olist-dw",
  title: "Olist Brazilian E-Commerce Data Warehouse",
  subtitle:
    "EDA, medallion warehouse, and RFM clustering: from 9 raw CSVs to trusted KPIs and segment decisions.",
  context: {
    industry: "E-commerce marketplace (Brazil)",
    period: "2016-09 to 2018-10",
    goal: "Create a single source of truth for revenue, delivery performance, and customer behavior that stakeholders can explore without raw CSV gymnastics.",
  },
  dataSource: [
    "Olist public dataset: orders, items, payments, reviews, products, sellers, customers, geolocation",
    "9 source tables under EDA/ loaded into a DuckDB warehouse",
    "Currency: BRL. Scope for primary KPIs: delivered orders",
  ],
  eda: {
    title: "Exploratory Data Analysis",
    summary:
      "Before modeling, I profiled every source table: grain, keys, nulls, and join paths. The goal was to freeze business definitions (GMV, on-time, unique customer) so the warehouse and ML layers share one truth.",
    questions: [
      "What is the natural grain of each file, and which keys actually join?",
      "How do order status, delivery timestamps, and reviews affect KPI filters?",
      "Is customer_id order-scoped while customer_unique_id is the true buyer?",
      "Where do nulls, multi-payments, and multi-zip geolocation break naive joins?",
    ],
    sourceTables: [
      {
        file: "olist_orders_dataset.csv",
        rows: "99,441",
        grain: "1 row / order",
        role: "Order header + delivery timeline",
      },
      {
        file: "olist_order_items_dataset.csv",
        rows: "112,650",
        grain: "1 row / item in order",
        role: "Primary sales fact source",
      },
      {
        file: "olist_order_payments_dataset.csv",
        rows: "103,886",
        grain: "1 row / payment sequence",
        role: "Payment mix and installments",
      },
      {
        file: "olist_order_reviews_dataset.csv",
        rows: "99,224",
        grain: "1 row / review",
        role: "Satisfaction and SLA narrative",
      },
      {
        file: "olist_customers_dataset.csv",
        rows: "99,441",
        grain: "1 row / customer_id (session)",
        role: "Map to customer_unique_id",
      },
      {
        file: "olist_products_dataset.csv",
        rows: "32,951",
        grain: "1 row / product",
        role: "Category and physical attributes",
      },
      {
        file: "olist_sellers_dataset.csv",
        rows: "3,095",
        grain: "1 row / seller",
        role: "Seller geo and performance",
      },
      {
        file: "olist_geolocation_dataset.csv",
        rows: "1,000,163",
        grain: "many lat/lng per zip",
        role: "Aggregate to dim_geography",
      },
      {
        file: "product_category_name_translation.csv",
        rows: "71",
        grain: "1 row / category",
        role: "PT to EN category labels",
      },
    ],
    keyFindings: [
      {
        title: "customer_id is not the buyer",
        body: "customer_id is order-session scoped. True repeat behavior uses customer_unique_id (~96K people). Using the wrong key inflates unique customers and kills retention metrics.",
      },
      {
        title: "Multi-payment and multi-item orders",
        body: "One order can have several payment rows and several items. Payment value and GMV must not be double-counted when rolled to order grain.",
      },
      {
        title: "Geolocation needs aggregation",
        body: "Zip codes carry many lat/lng samples. Staging averages coordinates per zip before joining customer and seller dimensions.",
      },
      {
        title: "KPI filter: delivered only",
        body: "Primary GMV and AOV use delivered orders. Cancelled and unavailable statuses stay in the warehouse for funnel views but stay out of revenue KPIs.",
      },
    ],
    cleaningRules: [
      "Type coercion on timestamps and numerics at bronze load",
      "Unknown dimension rows (sk = -1) for missing product / seller / geo",
      "Dedupe on fact grains: (order_id, order_item_id), order_id, payment sequence",
      "Category names joined to English labels for BI readability",
      "Delivery days and is_late flags computed from purchase vs estimated vs delivered dates",
    ],
  },
  warehouse: {
    title: "Data warehouse processing",
    architecture: "Medallion (Bronze → Silver → Gold) on DuckDB with Kimball star schema",
    layers: [
      {
        name: "Bronze (staging)",
        detail:
          "stg_* tables: raw CSV columns plus _loaded_at and _source_file. Minimal transform so reloads stay auditable.",
      },
      {
        name: "Silver (conformed)",
        detail:
          "Typed, cleaned tables. Null handling, FK readiness, geo aggregation, category translation. Business keys validated before dims.",
      },
      {
        name: "Gold (star + marts)",
        detail:
          "dim_date, dim_customer, dim_product, dim_seller, dim_geography + fact_order, fact_order_item, fact_payment, fact_review. Marts export monthly GMV, categories, payments, regions.",
      },
      {
        name: "Serving",
        detail:
          "pipeline.export_web writes dashboard.json for the portfolio. ML reads gold.fact_order + dims for RFM features.",
      },
    ],
    designPrinciples: [
      "Star schema first for BI; surrogate keys (*_sk) on every dimension",
      "Conformed dims shared across facts (date, customer, product, seller, geo)",
      "Additive measures stored raw; ratios (AOV, on-time %) computed in marts / semantic layer",
      "Late or missing keys map to Unknown (sk = -1), never silent drops",
    ],
    qualityChecks: [
      { name: "Row presence", rule: "Min row thresholds on every gold table" },
      { name: "PK uniqueness", rule: "No duplicate grains on fact_order / fact_order_item" },
      { name: "Unknown leakage", rule: "Warn when product_sk / seller_sk = -1 rate is high" },
      { name: "KPI sanity", rule: "GMV, on-time rate, review score in expected ranges" },
    ],
    grains: [
      { fact: "fact_order_item", grain: "1 row = 1 product line in 1 order", rows: "~112,650" },
      { fact: "fact_order", grain: "1 row = 1 order header", rows: "~99,441" },
      { fact: "fact_payment", grain: "1 row = 1 payment sequence", rows: "~103,886" },
      { fact: "fact_review", grain: "1 row = 1 review", rows: "~99,224" },
    ],
  },
  methodology: [
    "EDA: profile 9 CSVs, document grain, keys, nulls, and KPI filters",
    "Bronze: typed ingest from EDA/ with load metadata",
    "Silver: clean, dedupe, aggregate geolocation, translate categories",
    "Gold Kimball dims + facts with surrogate keys and Unknown rows",
    "Quality suite: row counts, uniqueness, unknown leakage, KPI bounds",
    "Gold marts + JSON export for static portfolio BI",
    "RFM features + RobustScaler + KMeans (k chosen by silhouette)",
  ],
  clustering: {
    title: "RFM clustering results",
    method: "RFM + RobustScaler + KMeans",
    features: ["recency_days", "log1p(frequency)", "log1p(monetary)"],
    nCustomers: "93,358",
    k: 3,
    selectionRule: "argmax silhouette over k in [3..6]",
    metricNotes: {
      silhouette: "[-1, 1] higher better: separation vs cohesion",
      davies_bouldin: ">= 0 lower better: avg similarity of clusters",
      calinski_harabasz: "higher better: between / within dispersion",
      inertia: "SSE to centroids; lower better; use elbow vs k",
    },
  },
  findings: [
    {
      title: "Revenue scale is real and seasonal",
      body: "Delivered GMV reaches ~R$13.2M across 96.5K orders. Monthly series shows clear growth through 2017-2018 with volatility that ops and finance should plan around.",
    },
    {
      title: "Delivery reliability is a strength",
      body: "On-time rate sits at 93.2%. That becomes the baseline for SLA dashboards and exception monitoring by region and carrier proxies.",
    },
    {
      title: "Repeat purchase is thin; retention is the open opportunity",
      body: "Repeat customer rate is only ~3%. RFM segmentation surfaces high-value and at-risk cohorts so CRM can target retention, not only acquisition.",
    },
    {
      title: "Review quality tracks the operational story",
      body: "Average review score ~4.09. Coupling reviews with late deliveries creates a measurable lever: protect SLA to protect reputation.",
    },
  ],
  recommendations: [
    "Publish a weekly SLA pack: on-time %, late volume, and top late regions with the same definitions as the warehouse.",
    "Stand up a retention pilot on RFM Champions and At-Risk segments (offer + timing experiments).",
    "Treat category and payment mix as margin-aware views once cost data is available. GMV alone is incomplete.",
    "Keep dimensional keys stable so Power BI / Tableau can bind without rework when new months land.",
  ],
  impact: [
    { label: "Orders unified", value: "96,478", note: "Delivered grain in fact_order" },
    { label: "GMV modeled", value: "R$13.2M", note: "Trusted revenue baseline" },
    { label: "On-time baseline", value: "93.2%", note: "SLA definition locked" },
    { label: "Customers segmented", value: "93,358", note: "RFM + KMeans" },
  ],
};

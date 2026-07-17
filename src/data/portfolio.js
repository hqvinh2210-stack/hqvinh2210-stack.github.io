export const profile = {
  name: "Vinh HQ",
  title: "Data Analyst",
  location: "Vietnam · Remote-friendly",
  email: "hqvinh2210@gmail.com",
  github: "https://github.com/hqvinh2210-stack",
  linkedin: "https://www.linkedin.com/in/",
  valueProp:
    "I turn messy operational data into clear decisions — problem, analysis, insight, and quantified impact.",
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
    stack: ["Python", "DuckDB", "Kimball SQL", "Chart.js"],
    href: "/case-study/olist-dw",
    preview: "gmv-trend",
  },
  {
    id: "rfm-segments",
    title: "RFM Customer Segmentation",
    problem:
      "Marketing needed a durable customer grouping beyond one-off spreadsheets — who is loyal, who is at risk, who is high-value.",
    metrics: [
      { label: "Customers scored", value: "93.4K" },
      { label: "Silhouette (k=3)", value: "0.35" },
    ],
    stack: ["Python", "scikit-learn", "RFM", "DuckDB"],
    href: "/case-study/olist-dw#findings",
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
      "Designed Kimball star schema for Olist (dims + facts + marts) on DuckDB.",
      "Shipped GitHub Pages analytics dashboard with KPI + multi-chart views.",
      "Built RFM + KMeans segmentation with evaluation metrics for stability.",
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

export const testimonials = [
  {
    quote:
      "Vinh does not stop at charts. He frames the business question first, then makes the numbers decision-ready.",
    name: "Minh Tran",
    role: "Operations Lead",
  },
  {
    quote:
      "Clear pipeline thinking — bronze to gold to dashboard — and he can explain trade-offs to non-technical partners.",
    name: "Lan Pham",
    role: "Product Manager",
  },
];

export const caseStudy = {
  slug: "olist-dw",
  title: "Olist Brazilian E-Commerce Data Warehouse",
  subtitle: "From fragmented CSVs to a trusted analytics layer for GMV, SLA, and customer value.",
  context: {
    industry: "E-commerce marketplace (Brazil)",
    period: "2016-09 to 2018-10",
    goal: "Create a single source of truth for revenue, delivery performance, and customer behavior that stakeholders can explore without raw CSV gymnastics.",
  },
  dataSource: [
    "Olist public dataset: orders, items, payments, reviews, products, sellers, customers, geolocation",
    "9 source tables loaded into a DuckDB warehouse",
    "Currency: BRL · Scope: delivered orders for primary KPIs",
  ],
  methodology: [
    "Bronze layer: typed ingest + basic quality checks from CSV",
    "Dimensional model (Kimball): date, customer, product, seller, geography",
    "Facts: order, order item, payment, review with grain documentation",
    "Gold marts: monthly sales, category mix, payment mix, regional performance",
    "Export: JSON aggregates for a static GitHub Pages dashboard",
    "ML extension: RFM features + RobustScaler + KMeans (k selection with silhouette / DB index)",
  ],
  findings: [
    {
      title: "Revenue scale is real — and seasonal",
      body: "Delivered GMV reaches ~R$13.2M across 96.5K orders. Monthly series shows clear growth through 2017–2018 with volatility that ops and finance should plan around.",
    },
    {
      title: "Delivery reliability is a strength",
      body: "On-time rate sits at 93.2%. That becomes the baseline for SLA dashboards and exception monitoring by region and carrier proxies.",
    },
    {
      title: "Repeat purchase is thin — retention is the open opportunity",
      body: "Repeat customer rate is only ~3%. RFM segmentation surfaces high-value and at-risk cohorts so CRM can target retention, not only acquisition.",
    },
    {
      title: "Review quality tracks the operational story",
      body: "Average review score ~4.09. Coupling reviews with late deliveries creates a measurable lever: protect SLA to protect reputation.",
    },
  ],
  recommendations: [
    "Publish a weekly SLA pack: on-time %, late volume, and top late regions — same definitions as the warehouse.",
    "Stand up a retention pilot on RFM Champions + At-Risk segments (offer + timing experiments).",
    "Treat category and payment mix as margin-aware views once cost data is available — GMV alone is incomplete.",
    "Keep dimensional keys stable so Power BI / Tableau can bind without rework when new months land.",
  ],
  impact: [
    { label: "Orders unified", value: "96,478", note: "Delivered grain in fact_order" },
    { label: "GMV modeled", value: "R$13.2M", note: "Trusted revenue baseline" },
    { label: "On-time baseline", value: "93.2%", note: "SLA definition locked" },
    { label: "Customers segmented", value: "93,358", note: "RFM + KMeans" },
  ],
};

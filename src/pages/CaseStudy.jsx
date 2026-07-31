import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";
import { useReducedMotion } from "motion/react";
import Nav from "../components/Nav.jsx";
import Footer from "../components/Footer.jsx";
import Reveal from "../components/Reveal.jsx";
import ClusterScatter3D from "../components/ClusterScatter3D.jsx";
import { CASE_STUDY_COPY, VI_CASE_STUDY, useLanguage } from "../contexts/LanguageContext.jsx";
import { caseStudy } from "../data/portfolio.js";


function localizedCaseStudy(language) {
  return language === "vi" ? { ...caseStudy, ...VI_CASE_STUDY } : caseStudy;
}

const SEGMENT_COLORS = {
  Champions: "#2563eb",
  "Potential Loyalists": "#06b6d4",
  "At Risk / Hibernating": "#f59e0b",
};

function formatMoney(n) {
  if (n >= 1_000_000) return `R$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `R$${(n / 1_000).toFixed(1)}K`;
  return `R$${Math.round(n)}`;
}

function formatNum(n) {
  if (n == null || Number.isNaN(n)) return "-";
  if (Math.abs(n) >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-card">
      <div className="font-semibold text-navy">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="mt-0.5 text-muted">
          {p.name}:{" "}
          <span className="font-mono font-semibold text-primary">
            {typeof p.value === "number" ? formatNum(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function CaseStudy() {
  const { slug } = useParams();
  const { language } = useLanguage();
  const copy = CASE_STUDY_COPY[language] || CASE_STUDY_COPY.en;
  const [monthly, setMonthly] = useState([]);
  const [dash, setDash] = useState(null);
  const [ml, setMl] = useState(null);
  const reduce = useReducedMotion();
  const cs =
    slug === caseStudy.slug || slug === "olist-dw"
      ? localizedCaseStudy(language)
      : null;

  useEffect(() => {
    fetch("/assets/data/dashboard.json")
      .then((r) => r.json())
      .then((d) => {
        setDash(d);
        setMonthly(
          (d.sales_monthly || []).map((row) => ({
            month: row.year_month,
            gmv: row.gmv,
            orders: row.orders,
          }))
        );
      })
      .catch(() => {});

    fetch("/assets/data/ml_results.json")
      .then((r) => r.json())
      .then(setMl)
      .catch(() => {});
  }, []);

  const rfm = ml?.rfm_segmentation;
  const evaluation = rfm?.evaluation;
  const finalMetrics = evaluation?.final || {
    silhouette: rfm?.silhouette,
    davies_bouldin: rfm?.davies_bouldin,
    calinski_harabasz: rfm?.calinski_harabasz,
    inertia: rfm?.inertia,
    k: rfm?.k,
    n_samples: rfm?.n_customers,
  };

  const byK = evaluation?.by_k || [];
  const segments = rfm?.segments || [];
  const scatter = useMemo(() => {
    const sample = rfm?.scatter_sample || [];
    // Cap for canvas perf on low-end devices while keeping cluster shape
    if (sample.length <= 1200) return sample;
    const step = Math.ceil(sample.length / 1200);
    return sample.filter((_, i) => i % step === 0);
  }, [rfm]);

  const topCats = (dash?.top_categories || []).slice(0, 6).map((c) => ({
    name: (c.category || "").replaceAll("_", " "),
    gmv: c.gmv,
    orders: c.orders,
  }));

  const topStates = (dash?.top_states || []).slice(0, 6).map((s) => ({
    name: s.state,
    gmv: s.gmv,
    orders: s.orders,
  }));

  const tableStats = dash?.table_stats || [];
  const kpi = dash?.kpi;

  if (!cs) {
    return (
      <div className="min-h-[100dvh] bg-white">
        <Nav />
        <div className="container-page py-24 text-center">
          <h1 className="text-2xl font-bold text-navy">{copy.notFound}</h1>
          <Link to="/" className="mt-4 inline-block text-primary">
            {copy.backHome}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const sections = [
    { id: "context", label: copy.sections.context },
    { id: "source", label: copy.sections.source },
    { id: "eda", label: copy.sections.eda },
    { id: "warehouse", label: copy.sections.warehouse },
    { id: "method", label: copy.sections.method },
    { id: "clustering", label: copy.sections.clustering },
    { id: "findings", label: copy.sections.findings },
    { id: "recommend", label: copy.sections.recommend },
    { id: "impact", label: copy.sections.impact },
  ];

  const metricCards = [
    {
      key: "silhouette",
      label: "Silhouette",
      value: finalMetrics?.silhouette,
      better: "higher",
      note: cs.clustering.metricNotes.silhouette,
    },
    {
      key: "davies_bouldin",
      label: "Davies-Bouldin",
      value: finalMetrics?.davies_bouldin,
      better: "lower",
      note: cs.clustering.metricNotes.davies_bouldin,
    },
    {
      key: "calinski_harabasz",
      label: "Calinski-Harabasz",
      value: finalMetrics?.calinski_harabasz,
      better: "higher",
      note: cs.clustering.metricNotes.calinski_harabasz,
    },
    {
      key: "inertia",
      label: "Inertia (SSE)",
      value: finalMetrics?.inertia,
      better: "lower",
      note: cs.clustering.metricNotes.inertia,
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-white">
      <Nav />
      <main>
        <header className="border-b border-line bg-navy text-white">
          <div className="container-page py-14 md:py-20">
            <Link
              to="/#projects"
              className="text-sm font-medium text-cyan-soft hover:text-white"
            >
              {copy.backProjects}
            </Link>
            <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              {cs.title}
            </h1>
            <p className="mt-4 max-w-[60ch] text-base text-white/75 md:text-lg">
              {cs.subtitle}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["EDA", "DuckDB", "Kimball DW", "Medallion", "RFM / KMeans", "3D clusters"].map(
                (t) => (
                  <span
                    key={t}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80"
                  >
                    {t}
                  </span>
                )
              )}
            </div>
          </div>
        </header>

        <div className="container-page py-12 md:py-16">
          <nav className="mb-10 flex flex-wrap gap-2">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-navy transition hover:border-primary/30 hover:text-primary"
              >
                {s.label}
              </a>
            ))}
          </nav>

          <div className="space-y-16">
            {/* Context */}
            <Reveal as="section" id="context">
              <h2 className="text-2xl font-bold text-navy">{copy.sections.context}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="card p-4">
                  <div className="text-xs font-semibold uppercase text-muted">
                    {copy.labels.industry}
                  </div>
                  <div className="mt-1 text-sm font-medium text-navy">
                    {cs.context.industry}
                  </div>
                </div>
                <div className="card p-4">
                  <div className="text-xs font-semibold uppercase text-muted">
                    {copy.labels.period}
                  </div>
                  <div className="mt-1 font-mono text-sm font-medium text-primary">
                    {cs.context.period}
                  </div>
                </div>
                <div className="card p-4 sm:col-span-1">
                  <div className="text-xs font-semibold uppercase text-muted">
                    {copy.labels.goal}
                  </div>
                  <div className="mt-1 text-sm leading-relaxed text-navy">
                    {cs.context.goal}
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Data source */}
            <Reveal as="section" id="source">
              <h2 className="text-2xl font-bold text-navy">{copy.sections.source}</h2>
              <ul className="mt-4 space-y-2">
                {cs.dataSource.map((d) => (
                  <li
                    key={d}
                    className="flex gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted"
                  >
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cyan" />
                    {d}
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* EDA */}
            <Reveal as="section" id="eda">
              <h2 className="text-2xl font-bold text-navy">{cs.eda.title}</h2>
              <p className="mt-3 max-w-[65ch] text-sm leading-relaxed text-muted md:text-base">
                {cs.eda.summary}
              </p>

              <h3 className="mt-8 text-sm font-semibold text-navy">
                {copy.labels.questions}
              </h3>
              <ol className="mt-3 grid gap-2 md:grid-cols-2">
                {cs.eda.questions.map((q, i) => (
                  <li
                    key={q}
                    className="flex gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted"
                  >
                    <span className="font-mono text-xs font-bold text-primary">
                      Q{i + 1}
                    </span>
                    {q}
                  </li>
                ))}
              </ol>

              <h3 className="mt-8 text-sm font-semibold text-navy">
                {copy.labels.sourceProfile}
              </h3>
              <div className="mt-3 overflow-x-auto rounded-[12px] border border-line">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th className="px-4 py-3 font-semibold">{copy.labels.file}</th>
                      <th className="px-4 py-3 font-semibold">{copy.labels.rows}</th>
                      <th className="px-4 py-3 font-semibold">{copy.labels.grain}</th>
                      <th className="px-4 py-3 font-semibold">{copy.labels.role}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cs.eda.sourceTables.map((t, i) => (
                      <tr
                        key={t.file}
                        className={i % 2 === 0 ? "bg-white" : "bg-surface/60"}
                      >
                        <td className="px-4 py-2.5 font-mono text-xs text-navy">
                          {t.file}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-primary">
                          {t.rows}
                        </td>
                        <td className="px-4 py-2.5 text-muted">{t.grain}</td>
                        <td className="px-4 py-2.5 text-muted">{t.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {cs.eda.keyFindings.map((f) => (
                  <article key={f.title} className="card p-5">
                    <h3 className="font-semibold text-navy">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
                  </article>
                ))}
              </div>

              <h3 className="mt-8 text-sm font-semibold text-navy">
                {copy.labels.cleaning}
              </h3>
              <ul className="mt-3 space-y-2">
                {cs.eda.cleaningRules.map((r) => (
                  <li
                    key={r}
                    className="flex gap-3 text-sm leading-relaxed text-muted"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {r}
                  </li>
                ))}
              </ul>

              {kpi && (
                <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      label: copy.labels.deliveredOrders,
                      value: formatNum(kpi.delivered_orders),
                    },
                    { label: copy.labels.totalGmv, value: formatMoney(kpi.total_gmv) },
                    {
                      label: copy.labels.onTimeRate,
                      value: `${Number(kpi.on_time_rate_pct).toFixed(1)}%`,
                    },
                    {
                      label: copy.labels.repeatCustomers,
                      value: `${kpi.repeat_customer_pct}%`,
                    },
                  ].map((m) => (
                    <div key={m.label} className="card p-4 text-center">
                      <div className="metric-num text-xl font-bold md:text-2xl">
                        {m.value}
                      </div>
                      <div className="mt-1 text-xs font-medium text-muted">
                        {m.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="card p-4 md:p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-navy">
                      {copy.labels.topCategories}
                    </h3>
                    <span className="font-mono text-[11px] text-muted">EDA → gold</span>
                  </div>
                  <div className="h-64">
                    {topCats.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topCats} layout="vertical" margin={{ left: 8 }}>
                          <CartesianGrid stroke="#e2e8f0" horizontal={false} />
                          <XAxis
                            type="number"
                            tickFormatter={(v) => `${Math.round(v / 1e6)}M`}
                            tick={{ fill: "#64748b", fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={100}
                            tick={{ fill: "#64748b", fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            content={<ChartTip />}
                            formatter={(v) => formatMoney(v)}
                          />
                          <Bar
                            dataKey="gmv"
                            name="GMV"
                            fill="#2563eb"
                            radius={[0, 6, 6, 0]}
                            isAnimationActive={!reduce}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted">
                        {copy.labels.loadingCategory}
                      </div>
                    )}
                  </div>
                </div>

                <div className="card p-4 md:p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-navy">
                      {copy.labels.topStates}
                    </h3>
                    <span className="font-mono text-[11px] text-muted">geo join</span>
                  </div>
                  <div className="h-64">
                    {topStates.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topStates}>
                          <CartesianGrid stroke="#e2e8f0" vertical={false} />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: "#64748b", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tickFormatter={(v) => `${Math.round(v / 1e6)}M`}
                            tick={{ fill: "#64748b", fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            width={36}
                          />
                          <Tooltip content={<ChartTip />} />
                          <Bar
                            dataKey="gmv"
                            name="GMV"
                            fill="#06b6d4"
                            radius={[6, 6, 0, 0]}
                            isAnimationActive={!reduce}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted">
                        {copy.labels.loadingRegional}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Warehouse processing */}
            <Reveal as="section" id="warehouse">
              <h2 className="text-2xl font-bold text-navy">{cs.warehouse.title}</h2>
              <p className="mt-3 max-w-[65ch] text-sm leading-relaxed text-muted md:text-base">
                {cs.warehouse.architecture}
              </p>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {cs.warehouse.layers.map((layer, i) => (
                  <div key={layer.name} className="card flex gap-4 p-5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy font-mono text-xs font-bold text-white">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <h3 className="font-semibold text-navy">{layer.name}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted">
                        {layer.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="mt-8 text-sm font-semibold text-navy">
                {copy.labels.designPrinciples}
              </h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {cs.warehouse.designPrinciples.map((p) => (
                  <li
                    key={p}
                    className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted"
                  >
                    {p}
                  </li>
                ))}
              </ul>

              <h3 className="mt-8 text-sm font-semibold text-navy">
                {copy.labels.factGrains}
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {cs.warehouse.grains.map((g) => (
                  <div key={g.fact} className="card p-4">
                    <div className="font-mono text-xs font-bold text-primary">
                      {g.fact}
                    </div>
                    <div className="mt-1 text-sm text-navy">{g.grain}</div>
                    <div className="mt-1 text-xs text-muted">{g.rows} {copy.labels.rowsSuffix}</div>
                  </div>
                ))}
              </div>

              <h3 className="mt-8 text-sm font-semibold text-navy">
                {copy.labels.qualityChecks}
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {cs.warehouse.qualityChecks.map((q) => (
                  <div
                    key={q.name}
                    className="flex gap-3 rounded-xl border border-line px-4 py-3"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-600">
                      OK
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-navy">{q.name}</div>
                      <div className="text-xs text-muted">{q.rule}</div>
                    </div>
                  </div>
                ))}
              </div>

              {tableStats.length > 0 && (
                <>
                  <h3 className="mt-8 text-sm font-semibold text-navy">
                    {copy.labels.goldRows}
                  </h3>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {tableStats.map((t) => (
                      <div
                        key={t.name}
                        className="rounded-xl border border-line bg-surface px-3 py-3"
                      >
                        <div className="font-mono text-[11px] text-muted">{t.name}</div>
                        <div className="metric-num mt-1 text-lg font-bold">
                          {formatNum(t.rows)}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Reveal>

            {/* Methodology */}
            <Reveal as="section" id="method">
              <h2 className="text-2xl font-bold text-navy">{copy.labels.methodology}</h2>
              <ol className="mt-4 space-y-3">
                {cs.methodology.map((step, i) => (
                  <li key={step} className="card flex gap-4 p-4">
                    <span className="font-mono text-sm font-bold text-primary">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm leading-relaxed text-muted">{step}</span>
                  </li>
                ))}
              </ol>
            </Reveal>

            {/* Clustering 3D + metrics */}
            <Reveal as="section" id="clustering">
              <h2 className="text-2xl font-bold text-navy">{cs.clustering.title}</h2>
              <p className="mt-3 max-w-[65ch] text-sm leading-relaxed text-muted md:text-base">
                {copy.labels.method}: <span className="font-medium text-navy">{cs.clustering.method}</span>.
                {copy.labels.features}: {cs.clustering.features.join(", ")}. {copy.labels.customersScored}:{" "}
                <span className="font-mono text-primary">{cs.clustering.nCustomers}</span>.
                {copy.labels.selected} <span className="font-mono text-primary">k={cs.clustering.k}</span>{" "}
                {copy.labels.via} {cs.clustering.selectionRule}.
              </p>

              {(() => {
                const champs = segments.find((s) => s.segment === "Champions");
                if (!champs) return null;
                return (
                  <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm leading-relaxed text-navy">
                    <span className="font-semibold">{copy.labels.businessRead} </span>
                    {copy.businessRead(champs)}
                  </div>
                );
              })()}

              <div className="mt-6">
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                  <h3 className="text-sm font-semibold text-navy">
                    {copy.labels.clusterScatter}
                  </h3>
                  <span className="font-mono text-[11px] text-muted">
                    {scatter.length.toLocaleString()} {copy.labels.pointsFrom}
                  </span>
                </div>
                {scatter.length ? (
                  <ClusterScatter3D points={scatter} height={440} />
                ) : (
                  <div className="flex h-80 items-center justify-center rounded-[12px] border border-line bg-surface text-sm text-muted">
                    {copy.labels.loadingCluster}
                  </div>
                )}
                <p className="mt-2 text-xs text-muted">
                  {copy.labels.reducedMotion}
                </p>
              </div>

              <h3 className="mt-10 text-sm font-semibold text-navy">
                {copy.labels.evalMetrics}
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {metricCards.map((m) => (
                  <div key={m.key} className="card p-4">
                    <div className="text-xs font-semibold uppercase text-muted">
                      {m.label}
                    </div>
                    <div className="metric-num mt-1 text-2xl font-bold">
                      {m.value != null ? formatNum(m.value) : "…"}
                    </div>
                    <div className="mt-1 text-[11px] font-medium text-primary">
                      {m.better === "higher" ? copy.labels.higherBetter : copy.labels.lowerBetter}
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-muted">{m.note}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="card p-4 md:p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-navy">
                      {copy.labels.kSelection}
                    </h3>
                    <span className="font-mono text-[11px] text-muted">{copy.labels.sampleEval}</span>
                  </div>
                  <div className="h-56">
                    {byK.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={byK}>
                          <CartesianGrid stroke="#e2e8f0" vertical={false} />
                          <XAxis
                            dataKey="k"
                            tick={{ fill: "#64748b", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            label={{
                              value: "k",
                              position: "insideBottomRight",
                              offset: -4,
                              fill: "#94a3b8",
                              fontSize: 11,
                            }}
                          />
                          <YAxis
                            domain={["auto", "auto"]}
                            tick={{ fill: "#64748b", fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            width={40}
                          />
                          <Tooltip content={<ChartTip />} />
                          <Line
                            type="monotone"
                            dataKey="silhouette"
                            name="Silhouette"
                            stroke="#2563eb"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: "#2563eb" }}
                            isAnimationActive={!reduce}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted">
                        {copy.labels.loadingK}
                      </div>
                    )}
                  </div>
                </div>

                <div className="card p-4 md:p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-navy">
                      {copy.labels.elbow}
                    </h3>
                    <span className="font-mono text-[11px] text-muted">SSE</span>
                  </div>
                  <div className="h-56">
                    {byK.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={byK}>
                          <CartesianGrid stroke="#e2e8f0" vertical={false} />
                          <XAxis
                            dataKey="k"
                            tick={{ fill: "#64748b", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fill: "#64748b", fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            width={48}
                          />
                          <Tooltip content={<ChartTip />} />
                          <Line
                            type="monotone"
                            dataKey="inertia"
                            name="Inertia"
                            stroke="#06b6d4"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: "#06b6d4" }}
                            isAnimationActive={!reduce}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted">
                        {copy.labels.loadingElbow}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {byK.length > 0 && (
                <div className="card mt-4 overflow-x-auto p-0">
                  <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                    <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
                      <tr>
                        <th className="px-4 py-3 font-semibold">k</th>
                        <th className="px-4 py-3 font-semibold">Silhouette</th>
                        <th className="px-4 py-3 font-semibold">Davies-Bouldin</th>
                        <th className="px-4 py-3 font-semibold">Calinski-Harabasz</th>
                        <th className="px-4 py-3 font-semibold">Inertia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byK.map((row) => {
                        const selected = row.k === (finalMetrics?.k || rfm?.k || 3);
                        return (
                          <tr
                            key={row.k}
                            className={
                              selected
                                ? "bg-primary/5 font-medium text-navy"
                                : "text-muted"
                            }
                          >
                            <td className="px-4 py-2.5 font-mono">
                              {row.k}
                              {selected && (
                                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                  {copy.labels.selectedBadge}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 font-mono">{row.silhouette}</td>
                            <td className="px-4 py-2.5 font-mono">
                              {row.davies_bouldin}
                            </td>
                            <td className="px-4 py-2.5 font-mono">
                              {formatNum(row.calinski_harabasz)}
                            </td>
                            <td className="px-4 py-2.5 font-mono">
                              {formatNum(row.inertia)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <h3 className="mt-10 text-sm font-semibold text-navy">
                {copy.labels.segmentProfiles}
              </h3>
              <div className="mt-3 grid gap-4 md:grid-cols-3">
                {segments.map((seg) => (
                  <article key={seg.segment} className="card overflow-hidden">
                    <div
                      className="h-1.5"
                      style={{
                        background: SEGMENT_COLORS[seg.segment] || "#2563eb",
                      }}
                    />
                    <div className="p-5">
                      <h4 className="font-semibold text-navy">{copy.segmentNames[seg.segment] || seg.segment}</h4>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="tag">
                          {formatNum(seg.size)} {copy.labels.customersShort} ({seg.pct}%)
                        </span>
                        <span className="tag">{copy.labels.gmvShare} {seg.gmv_share_pct}%</span>
                      </div>
                      <dl className="mt-4 space-y-2 text-xs">
                        <div className="flex justify-between gap-2">
                          <dt className="text-muted">{copy.labels.recencyMean}</dt>
                          <dd className="font-mono font-semibold text-navy">
                            {formatNum(seg.recency_mean)} d
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-muted">{copy.labels.frequencyMean}</dt>
                          <dd className="font-mono font-semibold text-navy">
                            {formatNum(seg.frequency_mean)}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-muted">{copy.labels.monetaryMean}</dt>
                          <dd className="font-mono font-semibold text-navy">
                            {formatMoney(seg.monetary_mean)}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-muted">{copy.labels.silhouetteCluster}</dt>
                          <dd className="font-mono font-semibold text-primary">
                            {formatNum(seg.silhouette_mean)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </article>
                ))}
              </div>

              {segments.length > 0 && (
                <div className="card mt-6 p-4 md:p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-navy">
                      {copy.labels.segmentSize}
                    </h3>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={segments.map((s) => ({
                          name: (copy.segmentNames[s.segment] || s.segment).replace(" / Hibernating", ""),
                          customers_pct: s.pct,
                          gmv_share_pct: s.gmv_share_pct,
                          fill: SEGMENT_COLORS[s.segment],
                        }))}
                      >
                        <CartesianGrid stroke="#e2e8f0" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#64748b", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "#64748b", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          unit="%"
                          width={36}
                        />
                        <Tooltip content={<ChartTip />} />
                        <Legend />
                        <Bar
                          dataKey="customers_pct"
                          name={copy.labels.pctCustomers}
                          fill="#94a3b8"
                          radius={[4, 4, 0, 0]}
                          isAnimationActive={!reduce}
                        />
                        <Bar
                          dataKey="gmv_share_pct"
                          name={copy.labels.pctGmv}
                          radius={[4, 4, 0, 0]}
                          isAnimationActive={!reduce}
                        >
                          {segments.map((s) => (
                            <Cell
                              key={s.segment}
                              fill={SEGMENT_COLORS[s.segment] || "#2563eb"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </Reveal>

            {/* Findings */}
            <Reveal as="section" id="findings">
              <h2 className="text-2xl font-bold text-navy">{copy.labels.keyFindings}</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {cs.findings.map((f) => (
                  <article key={f.title} className="card p-5">
                    <h3 className="font-semibold text-navy">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
                  </article>
                ))}
              </div>

              <div className="card mt-6 p-4 md:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-navy">
                    {copy.labels.gmvOrders}
                  </h3>
                  <span className="font-mono text-[11px] text-muted">
                    {copy.labels.fromGold}
                  </span>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthly}>
                      <defs>
                        <linearGradient id="csGmv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: "#64748b", fontSize: 10 }}
                        interval="preserveStartEnd"
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(v) => `${Math.round(v / 1e6)}M`}
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={36}
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          name === "gmv" ? formatMoney(value) : value,
                          name === "gmv" ? "GMV" : copy.labels.orders,
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="gmv"
                        stroke="#2563EB"
                        strokeWidth={2}
                        fill="url(#csGmv)"
                        isAnimationActive={!reduce}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Reveal>

            {/* Recommendations */}
            <Reveal as="section" id="recommend">
              <h2 className="text-2xl font-bold text-navy">
                {copy.labels.recommendations}
              </h2>
              <ul className="mt-4 space-y-3">
                {cs.recommendations.map((r, i) => (
                  <li key={r} className="flex gap-3 text-sm leading-relaxed text-muted">
                    <span className="font-mono font-bold text-primary">R{i + 1}</span>
                    {r}
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* Impact */}
            <Reveal as="section" id="impact">
              <h2 className="text-2xl font-bold text-navy">{copy.labels.impact}</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {cs.impact.map((m) => (
                  <div key={m.label} className="card p-5 text-center">
                    <div className="metric-num text-2xl font-bold md:text-3xl">
                      {m.value}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-navy">
                      {m.label}
                    </div>
                    <div className="mt-1 text-xs text-muted">{m.note}</div>
                  </div>
                ))}
              </div>
            </Reveal>

            <div className="rounded-[12px] border border-primary/20 bg-primary/5 p-6 text-center">
              <p className="text-sm text-muted">
                {copy.labels.repoNote}{" "}
                <code className="font-mono text-primary">data-warehouse/</code>
                {" "}· {copy.labels.edaSourceNote}{" "}
                <code className="font-mono text-primary">EDA/</code>
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <Link
                  to="/#dashboards"
                  className="inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
                >
                  {copy.labels.dashboardCta}
                </Link>
                <a
                  href="#clustering"
                  className="inline-flex rounded-lg border border-line bg-white px-5 py-2.5 text-sm font-semibold text-navy hover:border-primary/30"
                >
                  {copy.labels.clusterCta}
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

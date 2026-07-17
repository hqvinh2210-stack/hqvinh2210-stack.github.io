import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useReducedMotion } from "motion/react";
import Nav from "../components/Nav.jsx";
import Footer from "../components/Footer.jsx";
import Reveal from "../components/Reveal.jsx";
import { caseStudy } from "../data/portfolio.js";

function formatMoney(n) {
  if (n >= 1_000_000) return `R$${(n / 1_000_000).toFixed(2)}M`;
  return `R$${Math.round(n).toLocaleString()}`;
}

export default function CaseStudy() {
  const { slug } = useParams();
  const [monthly, setMonthly] = useState([]);
  const reduce = useReducedMotion();
  const cs = slug === caseStudy.slug || slug === "olist-dw" ? caseStudy : null;

  useEffect(() => {
    fetch("/assets/data/dashboard.json")
      .then((r) => r.json())
      .then((d) => {
        setMonthly(
          (d.sales_monthly || []).map((row) => ({
            month: row.year_month,
            gmv: row.gmv,
            orders: row.orders,
          }))
        );
      })
      .catch(() => {});
  }, []);

  if (!cs) {
    return (
      <div className="min-h-[100dvh] bg-white">
        <Nav />
        <div className="container-page py-24 text-center">
          <h1 className="text-2xl font-bold text-navy">Case study not found</h1>
          <Link to="/" className="mt-4 inline-block text-primary">
            Back home
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const sections = [
    { id: "context", label: "Context" },
    { id: "source", label: "Data source" },
    { id: "method", label: "Methodology" },
    { id: "findings", label: "Key findings" },
    { id: "recommend", label: "Recommendations" },
    { id: "impact", label: "Impact" },
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
              ← Projects
            </Link>
            <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              {cs.title}
            </h1>
            <p className="mt-4 max-w-[60ch] text-base text-white/75 md:text-lg">
              {cs.subtitle}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["DuckDB", "Kimball DW", "Python", "RFM / KMeans", "Static BI"].map(
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

          <div className="space-y-14">
            <Reveal as="section" id="context">
              <h2 className="text-2xl font-bold text-navy">Context</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="card p-4">
                  <div className="text-xs font-semibold uppercase text-muted">
                    Industry
                  </div>
                  <div className="mt-1 text-sm font-medium text-navy">
                    {cs.context.industry}
                  </div>
                </div>
                <div className="card p-4">
                  <div className="text-xs font-semibold uppercase text-muted">
                    Period
                  </div>
                  <div className="mt-1 font-mono text-sm font-medium text-primary">
                    {cs.context.period}
                  </div>
                </div>
                <div className="card p-4 sm:col-span-1">
                  <div className="text-xs font-semibold uppercase text-muted">
                    Goal
                  </div>
                  <div className="mt-1 text-sm leading-relaxed text-navy">
                    {cs.context.goal}
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal as="section" id="source">
              <h2 className="text-2xl font-bold text-navy">Data source</h2>
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

            <Reveal as="section" id="method">
              <h2 className="text-2xl font-bold text-navy">Methodology</h2>
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

            <Reveal as="section" id="findings">
              <h2 className="text-2xl font-bold text-navy">Key findings</h2>
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
                    GMV & orders over time
                  </h3>
                  <span className="font-mono text-[11px] text-muted">
                    from gold export
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
                          name === "gmv" ? "GMV" : "Orders",
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

            <Reveal as="section" id="recommend">
              <h2 className="text-2xl font-bold text-navy">
                Business recommendations
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

            <Reveal as="section" id="impact">
              <h2 className="text-2xl font-bold text-navy">Impact / results</h2>
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
                Pipeline source lives in this repo under{" "}
                <code className="font-mono text-primary">data-warehouse/</code>
              </p>
              <Link
                to="/#dashboards"
                className="mt-4 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
              >
                View dashboard showcase
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

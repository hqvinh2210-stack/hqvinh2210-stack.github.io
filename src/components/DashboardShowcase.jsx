import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useReducedMotion } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import Reveal from "./Reveal.jsx";

function formatMoney(n) {
  if (n >= 1_000_000) return `R$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `R$${(n / 1_000).toFixed(0)}K`;
  return `R$${Math.round(n)}`;
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
            {typeof p.value === "number" && p.name?.includes("GMV")
              ? formatMoney(p.value)
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function Insight({ children, label }) {
  return (
    <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-muted md:text-sm">
      <span className="font-semibold text-navy">{label} </span>
      {children}
    </p>
  );
}

export default function DashboardShowcase() {
  const [dash, setDash] = useState(null);
  const [err, setErr] = useState(false);
  const reduce = useReducedMotion();
  const { language, t } = useLanguage();
  const isVi = language === "vi";

  useEffect(() => {
    fetch("/assets/data/dashboard.json")
      .then((r) => {
        if (!r.ok) throw new Error("fail");
        return r.json();
      })
      .then(setDash)
      .catch(() => setErr(true));
  }, []);

  const monthly =
    dash?.sales_monthly?.slice(-14).map((d) => ({
      month: d.year_month.slice(2),
      gmv: d.gmv,
      orders: d.orders,
    })) ?? [];

  const payments =
    dash?.payment_mix?.slice(0, 5).map((d) => ({
      name: (d.payment_type || "other").replaceAll("_", " "),
      value: d.payment_txns ?? d.payment_value ?? 0,
    })) ?? [];

  const kpi = dash?.kpi;

  const insights = useMemo(() => {
    const series = dash?.sales_monthly || [];
    let gmvInsight = t("dashboard.insights.gmv");
    if (series.length >= 2) {
      const last = series[series.length - 1];
      const prev = series[series.length - 2];
      if (prev?.gmv > 0) {
        const pct = (((last.gmv - prev.gmv) / prev.gmv) * 100).toFixed(0);
        const dir = last.gmv >= prev.gmv ? t("dashboard.directions.up") : t("dashboard.directions.down");
        gmvInsight = isVi
          ? `Tháng mới nhất ${last.year_month}: GMV ${formatMoney(last.gmv)}, ${dir} ${Math.abs(pct)}% so với tháng trước. Cần tính cả mùa vụ và đà tăng khi lập kế hoạch vận hành.`
          : `Latest month ${last.year_month}: GMV ${formatMoney(last.gmv)}, ${dir} ${Math.abs(pct)}% vs prior month. Seasonality and ramp both matter for ops planning.`;
      }
    }

    let ordersInsight = t("dashboard.insights.orders");
    if (series.length) {
      const peak = series.reduce((a, b) => (b.orders > a.orders ? b : a), series[0]);
      ordersInsight = isVi
        ? `Đỉnh đơn hàng trong giai đoạn này: ${peak.orders.toLocaleString()} vào ${peak.year_month}. Các đỉnh tăng là nơi đầu tiên cần kiểm tra tải SLA giao hàng.`
        : `Peak orders in this window: ${peak.orders.toLocaleString()} in ${peak.year_month}. Volume spikes are the first place to check delivery SLA load.`;
    }

    let payInsight = t("dashboard.insights.payments");
    if (payments.length) {
      const total = payments.reduce((s, p) => s + (p.value || 0), 0) || 1;
      const top = [...payments].sort((a, b) => b.value - a.value)[0];
      const share = ((top.value / total) * 100).toFixed(0);
      payInsight = isVi
        ? `${top.name} dẫn đầu cơ cấu thanh toán (~${share}% trong các loại top hiển thị). Chính sách dòng tiền và trả góp nên bám theo cơ cấu này thay vì dùng một mức trung bình phẳng.`
        : `${top.name} leads payment mix (~${share}% of top types shown). Cash-cycle and installment policies should follow this mix, not a flat average.`;
    }

    let kpiInsight = null;
    if (kpi) {
      kpiInsight = isVi
        ? `Grain đơn đã giao chốt GMV ở ${formatMoney(kpi.total_gmv)} với ${kpi.on_time_rate_pct}% đúng hạn và chỉ ${kpi.repeat_customer_pct}% khách mua lại. Độ tin cậy đang tốt; giữ chân khách hàng là đòn bẩy còn mở.`
        : `Delivered grain locks GMV at ${formatMoney(kpi.total_gmv)} with ${kpi.on_time_rate_pct}% on-time and only ${kpi.repeat_customer_pct}% repeat buyers. Reliability is strong; retention is the open lever.`;
    }

    return { gmvInsight, ordersInsight, payInsight, kpiInsight };
  }, [dash, payments, kpi, isVi, t]);

  return (
    <section id="dashboards" className="bg-surface py-20 md:py-28">
      <div className="container-page">
        <Reveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-kicker">{t("dashboard.kicker")}</p>
              <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-navy md:text-4xl">
                {t("dashboard.heading")}
              </h2>
              <p className="mt-3 max-w-[56ch] text-muted">
                {t("dashboard.description")}
              </p>
            </div>
            <Link
              to="/case-study/olist-dw"
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              {t("dashboard.link")}
            </Link>
          </div>
        </Reveal>

        {err && (
          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {t("dashboard.error")}
          </div>
        )}

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: t("dashboard.cards.delivered"),
              value: kpi ? kpi.delivered_orders.toLocaleString() : "-",
            },
            {
              label: t("dashboard.cards.gmv"),
              value: kpi ? formatMoney(kpi.total_gmv) : "-",
            },
            {
              label: t("dashboard.cards.aov"),
              value: kpi ? `R$${kpi.aov.toFixed(0)}` : "-",
            },
            {
              label: t("dashboard.cards.onTime"),
              value: kpi ? `${kpi.on_time_rate_pct}%` : "-",
            },
          ].map((k, i) => (
            <Reveal key={k.label} delay={i * 0.04}>
              <div className="card p-5">
                <div className="metric-num text-2xl font-bold md:text-3xl">
                  {k.value}
                </div>
                <div className="mt-1 text-sm text-muted">{k.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
        {insights.kpiInsight && (
          <Reveal>
            <p className="mt-3 max-w-[70ch] text-sm text-muted">
              <span className="font-semibold text-navy">{t("dashboard.kpiRead")} </span>
              {insights.kpiInsight}
            </p>
          </Reveal>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <Reveal className="card p-4 lg:col-span-3 md:p-5" delay={0.05}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-navy">{t("dashboard.charts.gmv")}</h3>
              <span className="font-mono text-[11px] text-muted">{t("dashboard.charts.hover")}</span>
            </div>
            <div className="h-64 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly}>
                  <defs>
                    <linearGradient id="dashGmv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#64748b", fontSize: 11 }}
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
                  <Tooltip content={<ChartTip />} />
                  <Area
                    type="monotone"
                    dataKey="gmv"
                    name="GMV"
                    stroke="#2563EB"
                    strokeWidth={2}
                    fill="url(#dashGmv)"
                    isAnimationActive={!reduce}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <Insight label={t("dashboard.insightLabel")}>{insights.gmvInsight}</Insight>
          </Reveal>

          <Reveal className="card p-4 lg:col-span-2 md:p-5" delay={0.1}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-navy">{t("dashboard.charts.orders")}</h3>
            </div>
            <div className="h-64 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip content={<ChartTip />} />
                  <Bar
                    dataKey="orders"
                    name="Orders"
                    fill="#06B6D4"
                    radius={[6, 6, 0, 0]}
                    isAnimationActive={!reduce}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <Insight label={t("dashboard.insightLabel")}>{insights.ordersInsight}</Insight>
          </Reveal>
        </div>

        {payments.length > 0 && (
          <Reveal className="card mt-6 p-4 md:p-5" delay={0.08}>
            <h3 className="mb-3 text-sm font-semibold text-navy">
              {t("dashboard.charts.payments")}
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={payments} layout="vertical" margin={{ left: 24 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={88}
                    tick={{ fill: "#0A1F44", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTip />} />
                  <Bar
                    dataKey="value"
                    name="Volume"
                    fill="#2563EB"
                    radius={[0, 8, 8, 0]}
                    isAnimationActive={!reduce}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <Insight label={t("dashboard.insightLabel")}>{insights.payInsight}</Insight>
          </Reveal>
        )}

        <Reveal className="mt-8 text-center">
          <Link
            to="/case-study/olist-dw#findings"
            className="inline-flex rounded-lg border border-line bg-white px-5 py-2.5 text-sm font-semibold text-navy transition hover:border-primary/30 hover:text-primary"
          >
            {t("dashboard.findingsLink")}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

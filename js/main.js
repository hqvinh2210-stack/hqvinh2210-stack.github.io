/**
 * Olist DW Dashboard — loads assets/data/dashboard.json and renders Chart.js
 */

const DATA_URL = "assets/data/dashboard.json";

const COLORS = {
    cyan: "#00d4ff",
    blue: "#3b82f6",
    purple: "#8b5cf6",
    pink: "#ec4899",
    red: "#ff6b6b",
    green: "#51cf66",
    yellow: "#fcc419",
    palette: [
        "#00d4ff",
        "#8b5cf6",
        "#51cf66",
        "#fcc419",
        "#ff6b6b",
        "#3b82f6",
        "#ec4899",
        "#14b8a6",
        "#f97316",
        "#a78bfa",
        "#22d3ee",
        "#84cc16",
    ],
};

const TOOLTIP = {
    backgroundColor: "#1a2332",
    titleColor: "#f1f5f9",
    bodyColor: "#94a3b8",
    borderColor: "rgba(0, 212, 255, 0.15)",
    borderWidth: 1,
    padding: 12,
    cornerRadius: 8,
};

function fmtMoneyBRL(n) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
    }).format(n || 0);
}

function fmtCompact(n) {
    return new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(n || 0);
}

function animateCounters() {
    const counters = document.querySelectorAll(".kpi-value");
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                const target = parseFloat(el.dataset.target);
                const format = el.dataset.format || "int";
                if (Number.isNaN(target)) return;

                const duration = 1800;
                const start = performance.now();

                function tick(now) {
                    const p = Math.min((now - start) / duration, 1);
                    const eased = 1 - Math.pow(1 - p, 3);
                    const val = target * eased;
                    el.textContent = formatValue(val, format);
                    if (p < 1) requestAnimationFrame(tick);
                    else el.textContent = formatValue(target, format);
                }
                requestAnimationFrame(tick);
                observer.unobserve(el);
            });
        },
        { threshold: 0.25 }
    );
    counters.forEach((c) => observer.observe(c));
}

function formatValue(val, format) {
    switch (format) {
        case "moneyM":
            return (val / 1e6).toFixed(2);
        case "decimal1":
            return val.toFixed(1);
        case "decimal2":
            return val.toFixed(2);
        default:
            return Math.round(val).toLocaleString("en-US");
    }
}

function applyKpis(kpi) {
    const map = {
        delivered_orders: kpi.delivered_orders,
        total_gmv: kpi.total_gmv,
        aov: kpi.aov,
        avg_review_score: kpi.avg_review_score,
        on_time_rate_pct: kpi.on_time_rate_pct,
        repeat_customer_pct: kpi.repeat_customer_pct,
    };
    Object.entries(map).forEach(([key, value]) => {
        const el = document.querySelector(`.kpi-value[data-kpi="${key}"]`);
        if (!el) return;
        el.dataset.target = String(value ?? 0);
    });
}

function setHeroMeta(data) {
    const el = document.getElementById("heroMeta");
    if (!el) return;
    const k = data.kpi;
    el.textContent = `${fmtCompact(k.delivered_orders)} orders · ${fmtMoneyBRL(k.total_gmv)} GMV · ${data.meta.period}`;
}

function setFooter(meta) {
    const el = document.getElementById("footerGenerated");
    if (el && meta.generated_at) {
        el.textContent = `Generated ${meta.generated_at}`;
    }
}

function renderTableStats(stats) {
    const ul = document.getElementById("tableStats");
    if (!ul || !stats?.length) return;
    ul.innerHTML = stats
        .map(
            (s) =>
                `<li><code>${s.name}</code> <span class="stat-n">${Number(s.rows).toLocaleString()}</span></li>`
        )
        .join("");
}

function baseChartOptions(aspect = 1.8) {
    return {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: aspect,
        plugins: {
            legend: {
                position: "top",
                align: "start",
                labels: {
                    boxWidth: 12,
                    boxHeight: 12,
                    usePointStyle: true,
                    padding: 14,
                    font: { size: 11, weight: "500" },
                },
            },
            tooltip: { ...TOOLTIP },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { size: 10 }, maxRotation: 45 },
            },
            y: {
                beginAtZero: true,
                grid: { color: "rgba(255,255,255,0.04)" },
                ticks: { font: { size: 10 } },
            },
        },
    };
}

function renderCharts(data) {
    Chart.defaults.color = "#94a3b8";
    Chart.defaults.borderColor = "rgba(255, 255, 255, 0.06)";
    Chart.defaults.font.family = "'Inter', sans-serif";

    // 1. Sales trend
    const sales = data.sales_monthly || [];
    const salesCtx = document.getElementById("salesTrendChart");
    if (salesCtx && sales.length) {
        new Chart(salesCtx, {
            type: "bar",
            data: {
                labels: sales.map((r) => r.year_month),
                datasets: [
                    {
                        label: "GMV (BRL)",
                        data: sales.map((r) => r.gmv),
                        backgroundColor: "rgba(0, 212, 255, 0.55)",
                        borderColor: COLORS.cyan,
                        borderWidth: 1,
                        borderRadius: 4,
                        yAxisID: "y",
                        order: 2,
                    },
                    {
                        type: "line",
                        label: "Orders",
                        data: sales.map((r) => r.orders),
                        borderColor: COLORS.red,
                        backgroundColor: "rgba(255, 107, 107, 0.1)",
                        tension: 0.35,
                        pointRadius: 2,
                        borderWidth: 2.5,
                        yAxisID: "y1",
                        order: 1,
                    },
                ],
            },
            options: {
                ...baseChartOptions(2.6),
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 9 }, maxRotation: 45 },
                    },
                    y: {
                        position: "left",
                        beginAtZero: true,
                        grid: { color: "rgba(255,255,255,0.04)" },
                        ticks: {
                            font: { size: 10 },
                            callback: (v) => fmtCompact(v),
                        },
                        title: { display: true, text: "GMV", color: "#64748b", font: { size: 11 } },
                    },
                    y1: {
                        position: "right",
                        beginAtZero: true,
                        grid: { drawOnChartArea: false },
                        ticks: { font: { size: 10 }, callback: (v) => fmtCompact(v) },
                        title: { display: true, text: "Orders", color: "#64748b", font: { size: 11 } },
                    },
                },
                plugins: {
                    ...baseChartOptions().plugins,
                    tooltip: {
                        ...TOOLTIP,
                        callbacks: {
                            label(ctx) {
                                if (ctx.dataset.label.includes("GMV")) {
                                    return `GMV: ${fmtMoneyBRL(ctx.parsed.y)}`;
                                }
                                return `Orders: ${ctx.parsed.y.toLocaleString()}`;
                            },
                        },
                    },
                },
            },
        });
    }

    // 2. Categories (horizontal bar)
    const cats = data.top_categories || [];
    const catCtx = document.getElementById("categoryChart");
    if (catCtx && cats.length) {
        const labels = cats.map((c) => String(c.category).replace(/_/g, " "));
        new Chart(catCtx, {
            type: "bar",
            data: {
                labels,
                datasets: [
                    {
                        label: "GMV",
                        data: cats.map((c) => c.gmv),
                        backgroundColor: COLORS.palette.map((c) => c + "cc"),
                        borderRadius: 4,
                    },
                ],
            },
            options: {
                indexAxis: "y",
                ...baseChartOptions(1.35),
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        ...TOOLTIP,
                        callbacks: {
                            label: (ctx) => fmtMoneyBRL(ctx.parsed.x),
                        },
                    },
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { color: "rgba(255,255,255,0.04)" },
                        ticks: { font: { size: 10 }, callback: (v) => fmtCompact(v) },
                    },
                    y: {
                        grid: { display: false },
                        ticks: { font: { size: 10 } },
                    },
                },
            },
        });
    }

    // 3. Payment doughnut
    const pays = data.payment_mix || [];
    const payCtx = document.getElementById("paymentChart");
    if (payCtx && pays.length) {
        new Chart(payCtx, {
            type: "doughnut",
            data: {
                labels: pays.map((p) => p.payment_type),
                datasets: [
                    {
                        data: pays.map((p) => p.payment_value),
                        backgroundColor: COLORS.palette.slice(0, pays.length),
                        borderColor: "transparent",
                        hoverOffset: 6,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.35,
                cutout: "62%",
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            boxWidth: 10,
                            usePointStyle: true,
                            padding: 12,
                            font: { size: 11 },
                        },
                    },
                    tooltip: {
                        ...TOOLTIP,
                        callbacks: {
                            label(ctx) {
                                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                const pct = total ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                                return `${ctx.label}: ${fmtMoneyBRL(ctx.parsed)} (${pct}%)`;
                            },
                        },
                    },
                },
            },
        });
    }

    // 4. States
    const states = data.top_states || [];
    const stateCtx = document.getElementById("stateChart");
    if (stateCtx && states.length) {
        new Chart(stateCtx, {
            type: "bar",
            data: {
                labels: states.map((s) => s.state),
                datasets: [
                    {
                        label: "GMV",
                        data: states.map((s) => s.gmv),
                        backgroundColor: "rgba(139, 92, 246, 0.7)",
                        borderRadius: 4,
                    },
                ],
            },
            options: {
                ...baseChartOptions(1.35),
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        ...TOOLTIP,
                        callbacks: {
                            label: (ctx) => fmtMoneyBRL(ctx.parsed.y),
                        },
                    },
                },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                    y: {
                        beginAtZero: true,
                        grid: { color: "rgba(255,255,255,0.04)" },
                        ticks: { font: { size: 10 }, callback: (v) => fmtCompact(v) },
                    },
                },
            },
        });
    }

    // 5. Region pie
    const regions = (data.region_mix || []).filter((r) => r.region && r.region !== "Unknown");
    const regionCtx = document.getElementById("regionChart");
    if (regionCtx && regions.length) {
        new Chart(regionCtx, {
            type: "doughnut",
            data: {
                labels: regions.map((r) => r.region),
                datasets: [
                    {
                        data: regions.map((r) => r.gmv),
                        backgroundColor: COLORS.palette.slice(0, regions.length),
                        borderColor: "transparent",
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.35,
                cutout: "55%",
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: { usePointStyle: true, boxWidth: 10, font: { size: 11 } },
                    },
                    tooltip: {
                        ...TOOLTIP,
                        callbacks: {
                            label: (ctx) => `${ctx.label}: ${fmtMoneyBRL(ctx.parsed)}`,
                        },
                    },
                },
            },
        });
    }

    // 6. Review score
    const reviews = data.review_monthly || [];
    const reviewCtx = document.getElementById("reviewChart");
    if (reviewCtx && reviews.length) {
        new Chart(reviewCtx, {
            type: "line",
            data: {
                labels: reviews.map((r) => r.year_month),
                datasets: [
                    {
                        label: "Avg score",
                        data: reviews.map((r) => r.avg_score),
                        borderColor: COLORS.yellow,
                        backgroundColor: "rgba(252, 196, 25, 0.12)",
                        fill: true,
                        tension: 0.35,
                        pointRadius: 2,
                        borderWidth: 2.5,
                    },
                ],
            },
            options: {
                ...baseChartOptions(1.35),
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 9 }, maxRotation: 45 },
                    },
                    y: {
                        min: 1,
                        max: 5,
                        grid: { color: "rgba(255,255,255,0.04)" },
                        ticks: { font: { size: 10 } },
                    },
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { ...TOOLTIP },
                },
            },
        });
    }

    // 7. Delivery SLA
    const del = data.delivery_monthly || [];
    const delCtx = document.getElementById("deliveryChart");
    if (delCtx && del.length) {
        new Chart(delCtx, {
            type: "line",
            data: {
                labels: del.map((r) => r.year_month),
                datasets: [
                    {
                        label: "On-time %",
                        data: del.map((r) => r.on_time_rate_pct),
                        borderColor: COLORS.green,
                        backgroundColor: "rgba(81, 207, 102, 0.1)",
                        fill: true,
                        tension: 0.35,
                        pointRadius: 2,
                        borderWidth: 2.5,
                        yAxisID: "y",
                    },
                    {
                        label: "Avg delivery days",
                        data: del.map((r) => r.avg_delivery_days),
                        borderColor: COLORS.purple,
                        tension: 0.35,
                        pointRadius: 2,
                        borderWidth: 2,
                        yAxisID: "y1",
                    },
                ],
            },
            options: {
                ...baseChartOptions(1.35),
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 9 }, maxRotation: 45 },
                    },
                    y: {
                        position: "left",
                        min: 0,
                        max: 100,
                        grid: { color: "rgba(255,255,255,0.04)" },
                        ticks: { font: { size: 10 }, callback: (v) => v + "%" },
                    },
                    y1: {
                        position: "right",
                        beginAtZero: true,
                        grid: { drawOnChartArea: false },
                        ticks: { font: { size: 10 } },
                    },
                },
            },
        });
    }
}

async function init() {
    try {
        const res = await fetch(DATA_URL, { cache: "no-cache" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        applyKpis(data.kpi || {});
        setHeroMeta(data);
        setFooter(data.meta || {});
        renderTableStats(data.table_stats || []);
        renderCharts(data);
        animateCounters();
    } catch (err) {
        console.error("Dashboard load failed:", err);
        const box = document.getElementById("loadError");
        if (box) box.hidden = false;
        const meta = document.getElementById("heroMeta");
        if (meta) meta.textContent = "Dashboard data unavailable";
    }
}

document.addEventListener("DOMContentLoaded", init);

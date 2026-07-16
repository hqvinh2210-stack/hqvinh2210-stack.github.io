/**
 * Olist DW Dashboard
 * Data: window.__OLIST_DASHBOARD__ (dashboard-data.js) with fetch fallback
 */

const DATA_URLS = [
    "assets/data/dashboard.json",
    "/assets/data/dashboard.json",
];

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

function animateCounters() {
    const counters = document.querySelectorAll(".kpi-value");
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                if (el.dataset.animated === "1") return;
                el.dataset.animated = "1";

                const target = parseFloat(el.dataset.target);
                const format = el.dataset.format || "int";
                if (Number.isNaN(target)) return;

                const duration = 1600;
                const start = performance.now();
                const from = 0;

                function tick(now) {
                    const p = Math.min((now - start) / duration, 1);
                    const eased = 1 - Math.pow(1 - p, 3);
                    const val = from + (target - from) * eased;
                    el.textContent = formatValue(val, format);
                    if (p < 1) requestAnimationFrame(tick);
                    else el.textContent = formatValue(target, format);
                }
                requestAnimationFrame(tick);
                observer.unobserve(el);
            });
        },
        { threshold: 0.15, rootMargin: "40px" }
    );
    counters.forEach((c) => observer.observe(c));
}

/** Set KPI numbers immediately (do not wait for scroll animation). */
function applyKpis(kpi) {
    const map = {
        delivered_orders: kpi.delivered_orders,
        total_gmv: kpi.total_gmv,
        aov: kpi.aov,
        avg_review_score: kpi.avg_review_score,
        on_time_rate_pct: kpi.on_time_rate_pct,
        repeat_customer_pct: kpi.repeat_customer_pct,
    };
    Object.keys(map).forEach((key) => {
        const el = document.querySelector('.kpi-value[data-kpi="' + key + '"]');
        if (!el) return;
        const value = map[key] == null ? 0 : map[key];
        const format = el.dataset.format || "int";
        el.dataset.target = String(value);
        // Show final value immediately (do not depend on scroll animation)
        el.textContent = formatValue(Number(value), format);
        el.dataset.animated = "1";
    });
}

function setHeroMeta(data) {
    const el = document.getElementById("heroMeta");
    if (!el || !data || !data.kpi) return;
    const k = data.kpi;
    const period = (data.meta && data.meta.period) || "";
    el.textContent =
        fmtCompact(k.delivered_orders) +
        " orders · " +
        fmtMoneyBRL(k.total_gmv) +
        " GMV · " +
        period;
}

function setFooter(meta) {
    const el = document.getElementById("footerGenerated");
    if (el && meta && meta.generated_at) {
        el.textContent = "Generated " + meta.generated_at;
    }
}

function renderTableStats(stats) {
    const ul = document.getElementById("tableStats");
    if (!ul || !stats || !stats.length) return;
    ul.innerHTML = stats
        .map(function (s) {
            return (
                "<li><code>" +
                s.name +
                '</code> <span class="stat-n">' +
                Number(s.rows).toLocaleString() +
                "</span></li>"
            );
        })
        .join("");
}

function baseChartOptions(aspect) {
    aspect = aspect == null ? 1.8 : aspect;
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
            tooltip: Object.assign({}, TOOLTIP),
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

function chartAvailable() {
    return typeof window.Chart === "function";
}

function renderCharts(data) {
    if (!chartAvailable()) {
        console.warn("Chart.js not loaded — KPIs still shown, charts skipped");
        showChartFallback();
        return;
    }

    Chart.defaults.color = "#94a3b8";
    Chart.defaults.borderColor = "rgba(255, 255, 255, 0.06)";
    Chart.defaults.font.family = "'Inter', sans-serif";

    try {
        renderSalesChart(data.sales_monthly || []);
        renderCategoryChart(data.top_categories || []);
        renderPaymentChart(data.payment_mix || []);
        renderStateChart(data.top_states || []);
        renderRegionChart(data.region_mix || []);
        renderReviewChart(data.review_monthly || []);
        renderDeliveryChart(data.delivery_monthly || []);
    } catch (err) {
        console.error("Chart render error:", err);
        showChartFallback();
    }
}

function showChartFallback() {
    document.querySelectorAll(".chart-body").forEach(function (el) {
        if (el.querySelector("canvas") && !el.querySelector(".chart-fallback")) {
            const note = document.createElement("p");
            note.className = "chart-fallback";
            note.textContent = "Chart library unavailable. KPI numbers above are still live from the warehouse export.";
            el.appendChild(note);
        }
    });
}

function renderSalesChart(sales) {
    const salesCtx = document.getElementById("salesTrendChart");
    if (!salesCtx || !sales.length) return;
    new Chart(salesCtx, {
        type: "bar",
        data: {
            labels: sales.map(function (r) {
                return r.year_month;
            }),
            datasets: [
                {
                    label: "GMV (BRL)",
                    data: sales.map(function (r) {
                        return r.gmv;
                    }),
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
                    data: sales.map(function (r) {
                        return r.orders;
                    }),
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
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.6,
            plugins: {
                legend: {
                    position: "top",
                    align: "start",
                    labels: {
                        boxWidth: 12,
                        usePointStyle: true,
                        padding: 14,
                        font: { size: 11 },
                    },
                },
                tooltip: Object.assign({}, TOOLTIP, {
                    callbacks: {
                        label: function (ctx) {
                            if (ctx.dataset.label.indexOf("GMV") !== -1) {
                                return "GMV: " + fmtMoneyBRL(ctx.parsed.y);
                            }
                            return "Orders: " + Number(ctx.parsed.y).toLocaleString();
                        },
                    },
                }),
            },
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
                        callback: function (v) {
                            return fmtCompact(v);
                        },
                    },
                },
                y1: {
                    position: "right",
                    beginAtZero: true,
                    grid: { drawOnChartArea: false },
                    ticks: {
                        font: { size: 10 },
                        callback: function (v) {
                            return fmtCompact(v);
                        },
                    },
                },
            },
        },
    });
}

function renderCategoryChart(cats) {
    const catCtx = document.getElementById("categoryChart");
    if (!catCtx || !cats.length) return;
    const labels = cats.map(function (c) {
        return String(c.category).replace(/_/g, " ");
    });
    new Chart(catCtx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "GMV",
                    data: cats.map(function (c) {
                        return c.gmv;
                    }),
                    backgroundColor: COLORS.palette.map(function (c) {
                        return c + "cc";
                    }),
                    borderRadius: 4,
                },
            ],
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.35,
            plugins: {
                legend: { display: false },
                tooltip: Object.assign({}, TOOLTIP, {
                    callbacks: {
                        label: function (ctx) {
                            return fmtMoneyBRL(ctx.parsed.x);
                        },
                    },
                }),
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: "rgba(255,255,255,0.04)" },
                    ticks: {
                        font: { size: 10 },
                        callback: function (v) {
                            return fmtCompact(v);
                        },
                    },
                },
                y: {
                    grid: { display: false },
                    ticks: { font: { size: 10 } },
                },
            },
        },
    });
}

function renderPaymentChart(pays) {
    const payCtx = document.getElementById("paymentChart");
    if (!payCtx || !pays.length) return;
    new Chart(payCtx, {
        type: "doughnut",
        data: {
            labels: pays.map(function (p) {
                return p.payment_type;
            }),
            datasets: [
                {
                    data: pays.map(function (p) {
                        return p.payment_value;
                    }),
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
                tooltip: Object.assign({}, TOOLTIP, {
                    callbacks: {
                        label: function (ctx) {
                            const total = ctx.dataset.data.reduce(function (a, b) {
                                return a + b;
                            }, 0);
                            const pct = total ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                            return ctx.label + ": " + fmtMoneyBRL(ctx.parsed) + " (" + pct + "%)";
                        },
                    },
                }),
            },
        },
    });
}

function renderStateChart(states) {
    const stateCtx = document.getElementById("stateChart");
    if (!stateCtx || !states.length) return;
    new Chart(stateCtx, {
        type: "bar",
        data: {
            labels: states.map(function (s) {
                return s.state;
            }),
            datasets: [
                {
                    label: "GMV",
                    data: states.map(function (s) {
                        return s.gmv;
                    }),
                    backgroundColor: "rgba(139, 92, 246, 0.7)",
                    borderRadius: 4,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.35,
            plugins: {
                legend: { display: false },
                tooltip: Object.assign({}, TOOLTIP, {
                    callbacks: {
                        label: function (ctx) {
                            return fmtMoneyBRL(ctx.parsed.y);
                        },
                    },
                }),
            },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                y: {
                    beginAtZero: true,
                    grid: { color: "rgba(255,255,255,0.04)" },
                    ticks: {
                        font: { size: 10 },
                        callback: function (v) {
                            return fmtCompact(v);
                        },
                    },
                },
            },
        },
    });
}

function renderRegionChart(regionMix) {
    const regions = (regionMix || []).filter(function (r) {
        return r.region && r.region !== "Unknown";
    });
    const regionCtx = document.getElementById("regionChart");
    if (!regionCtx || !regions.length) return;
    new Chart(regionCtx, {
        type: "doughnut",
        data: {
            labels: regions.map(function (r) {
                return r.region;
            }),
            datasets: [
                {
                    data: regions.map(function (r) {
                        return r.gmv;
                    }),
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
                tooltip: Object.assign({}, TOOLTIP, {
                    callbacks: {
                        label: function (ctx) {
                            return ctx.label + ": " + fmtMoneyBRL(ctx.parsed);
                        },
                    },
                }),
            },
        },
    });
}

function renderReviewChart(reviews) {
    const reviewCtx = document.getElementById("reviewChart");
    if (!reviewCtx || !reviews.length) return;
    new Chart(reviewCtx, {
        type: "line",
        data: {
            labels: reviews.map(function (r) {
                return r.year_month;
            }),
            datasets: [
                {
                    label: "Avg score",
                    data: reviews.map(function (r) {
                        return r.avg_score;
                    }),
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
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.35,
            plugins: {
                legend: { display: false },
                tooltip: Object.assign({}, TOOLTIP),
            },
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
        },
    });
}

function renderDeliveryChart(del) {
    const delCtx = document.getElementById("deliveryChart");
    if (!delCtx || !del.length) return;
    new Chart(delCtx, {
        type: "line",
        data: {
            labels: del.map(function (r) {
                return r.year_month;
            }),
            datasets: [
                {
                    label: "On-time %",
                    data: del.map(function (r) {
                        return r.on_time_rate_pct;
                    }),
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
                    data: del.map(function (r) {
                        return r.avg_delivery_days;
                    }),
                    borderColor: COLORS.purple,
                    tension: 0.35,
                    pointRadius: 2,
                    borderWidth: 2,
                    yAxisID: "y1",
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.35,
            plugins: {
                legend: {
                    position: "top",
                    align: "start",
                    labels: {
                        boxWidth: 12,
                        usePointStyle: true,
                        padding: 12,
                        font: { size: 11 },
                    },
                },
                tooltip: Object.assign({}, TOOLTIP),
            },
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
                    ticks: {
                        font: { size: 10 },
                        callback: function (v) {
                            return v + "%";
                        },
                    },
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

async function loadDashboardData() {
    if (window.__OLIST_DASHBOARD__ && window.__OLIST_DASHBOARD__.kpi) {
        return window.__OLIST_DASHBOARD__;
    }

    let lastErr = null;
    for (let i = 0; i < DATA_URLS.length; i++) {
        try {
            const res = await fetch(DATA_URLS[i], { cache: "no-store" });
            if (!res.ok) throw new Error("HTTP " + res.status + " for " + DATA_URLS[i]);
            return await res.json();
        } catch (err) {
            lastErr = err;
        }
    }
    throw lastErr || new Error("No data source");
}

function paintDashboard(data) {
    applyKpis(data.kpi || {});
    setHeroMeta(data);
    setFooter(data.meta || {});
    renderTableStats(data.table_stats || []);
    renderCharts(data);
}

async function init() {
    try {
        const data = await loadDashboardData();
        paintDashboard(data);
    } catch (err) {
        console.error("Dashboard load failed:", err);
        const box = document.getElementById("loadError");
        if (box) box.hidden = false;
        const meta = document.getElementById("heroMeta");
        if (meta) meta.textContent = "Dashboard data unavailable — hard refresh (Ctrl+F5)";
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}

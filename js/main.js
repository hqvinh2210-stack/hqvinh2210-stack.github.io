/**
 * Olist DW Dashboard
 * Data: window.__OLIST_DASHBOARD__ (dashboard-data.js) with fetch fallback
 */

const DATA_URLS = [
    "js/dashboard.json",
    "assets/data/dashboard.json",
    "/js/dashboard.json",
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

async function loadMlData() {
    if (window.__OLIST_ML__ && window.__OLIST_ML__.rfm_segmentation) {
        return window.__OLIST_ML__;
    }
    const urls = ["js/ml_results.json", "/js/ml_results.json", "assets/data/ml_results.json"];
    let lastErr = null;
    for (let i = 0; i < urls.length; i++) {
        try {
            const res = await fetch(urls[i], { cache: "no-store" });
            if (!res.ok) throw new Error("HTTP " + res.status);
            return await res.json();
        } catch (err) {
            lastErr = err;
        }
    }
    throw lastErr || new Error("No ML data");
}

function paintDashboard(data) {
    applyKpis(data.kpi || {});
    setHeroMeta(data);
    setFooter(data.meta || {});
    renderTableStats(data.table_stats || []);
    renderCharts(data);
}

function paintMl(payload) {
    const rfm = payload.rfm_segmentation;
    if (!rfm) return;

    const evalFinal = (rfm.evaluation && rfm.evaluation.final) || {
        silhouette: rfm.silhouette,
        davies_bouldin: rfm.davies_bouldin,
        calinski_harabasz: rfm.calinski_harabasz,
        inertia: rfm.inertia,
        k: rfm.k,
    };

    const elC = document.getElementById("mlCustomers");
    const elK = document.getElementById("mlK");
    const elS = document.getElementById("mlSilhouette");
    const elDbi = document.getElementById("mlDbi");
    const elChi = document.getElementById("mlChi");
    const elIn = document.getElementById("mlInertia");
    if (elC) elC.textContent = Number(rfm.n_customers).toLocaleString("en-US");
    if (elK) elK.textContent = String(rfm.k);
    if (elS) elS.textContent = Number(evalFinal.silhouette ?? rfm.silhouette).toFixed(3);
    if (elDbi && evalFinal.davies_bouldin != null)
        elDbi.textContent = Number(evalFinal.davies_bouldin).toFixed(3);
    if (elChi && evalFinal.calinski_harabasz != null)
        elChi.textContent = Number(evalFinal.calinski_harabasz).toLocaleString("en-US", {
            maximumFractionDigits: 0,
        });
    if (elIn && evalFinal.inertia != null)
        elIn.textContent = Number(evalFinal.inertia).toLocaleString("en-US", {
            maximumFractionDigits: 0,
        });

    // Evaluation metrics table
    const evalBody = document.querySelector("#mlEvalTable tbody");
    if (evalBody) {
        const notes = (evalFinal.metric_notes) || {
            silhouette: "[-1, 1] higher better — separation vs cohesion",
            davies_bouldin: "≥0 lower better — avg similarity of clusters",
            calinski_harabasz: "higher better — between/within dispersion",
            inertia: "SSE to centroids — lower better; use elbow vs k",
        };
        const rows = [
            ["Silhouette", evalFinal.silhouette, "↑ higher better", notes.silhouette],
            ["Davies–Bouldin", evalFinal.davies_bouldin, "↓ lower better", notes.davies_bouldin],
            ["Calinski–Harabasz", evalFinal.calinski_harabasz, "↑ higher better", notes.calinski_harabasz],
            ["Inertia (SSE)", evalFinal.inertia, "↓ lower better", notes.inertia],
        ];
        evalBody.innerHTML = rows
            .map(function (r) {
                const val =
                    r[1] == null
                        ? "—"
                        : typeof r[1] === "number"
                          ? r[0].indexOf("Silhouette") === 0 || r[0].indexOf("Davies") === 0
                              ? Number(r[1]).toFixed(4)
                              : Number(r[1]).toLocaleString("en-US", { maximumFractionDigits: 1 })
                          : r[1];
                return (
                    "<tr><td>" +
                    r[0] +
                    "</td><td>" +
                    val +
                    "</td><td>" +
                    r[2] +
                    '</td><td style="font-family:var(--font-sans);font-size:0.8rem">' +
                    r[3] +
                    "</td></tr>"
                );
            })
            .join("");
    }

    // Metrics by k table
    const byK = (rfm.evaluation && rfm.evaluation.by_k) || [];
    const byKBody = document.querySelector("#mlByKTable tbody");
    if (byKBody && byK.length) {
        byKBody.innerHTML = byK
            .map(function (row) {
                const sel = Number(row.k) === Number(rfm.k);
                return (
                    '<tr class="' +
                    (sel ? "selected-k" : "") +
                    '"><td>' +
                    row.k +
                    "</td><td>" +
                    Number(row.silhouette).toFixed(4) +
                    "</td><td>" +
                    Number(row.davies_bouldin).toFixed(4) +
                    "</td><td>" +
                    Number(row.calinski_harabasz).toLocaleString("en-US", { maximumFractionDigits: 1 }) +
                    "</td><td>" +
                    Number(row.inertia).toLocaleString("en-US", { maximumFractionDigits: 0 }) +
                    "</td><td>" +
                    (sel ? "✓" : "") +
                    "</td></tr>"
                );
            })
            .join("");
    }

    const segs = rfm.segments || [];
    const tbody = document.querySelector("#mlSegmentTable tbody");
    if (tbody && segs.length) {
        tbody.innerHTML = segs
            .map(function (s) {
                const sil =
                    s.silhouette_mean == null ? "—" : Number(s.silhouette_mean).toFixed(3);
                return (
                    "<tr>" +
                    "<td>" +
                    s.segment +
                    "</td>" +
                    "<td>" +
                    Number(s.size).toLocaleString() +
                    "</td>" +
                    "<td>" +
                    s.pct +
                    "%</td>" +
                    "<td>" +
                    s.recency_mean +
                    "</td>" +
                    "<td>" +
                    s.frequency_mean +
                    "</td>" +
                    "<td>" +
                    Number(s.monetary_mean).toLocaleString() +
                    "</td>" +
                    "<td>" +
                    s.gmv_share_pct +
                    "%</td>" +
                    "<td>" +
                    sil +
                    "</td>" +
                    "</tr>"
                );
            })
            .join("");
    }

    if (!chartAvailable()) return;

    // Silhouette vs k + Elbow
    if (byK.length) {
        const ks = byK.map(function (r) {
            return "k=" + r.k;
        });
        const silCtx = document.getElementById("mlSilhouetteByKChart");
        if (silCtx) {
            new Chart(silCtx, {
                type: "line",
                data: {
                    labels: ks,
                    datasets: [
                        {
                            label: "Silhouette",
                            data: byK.map(function (r) {
                                return r.silhouette;
                            }),
                            borderColor: COLORS.green,
                            backgroundColor: "rgba(81, 207, 102, 0.12)",
                            fill: true,
                            tension: 0.3,
                            pointRadius: 5,
                            borderWidth: 2.5,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: 1.5,
                    plugins: {
                        legend: { display: false },
                        tooltip: Object.assign({}, TOOLTIP),
                    },
                    scales: {
                        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                        y: {
                            grid: { color: "rgba(255,255,255,0.04)" },
                            ticks: { font: { size: 10 } },
                        },
                    },
                },
            });
        }
        const elbowCtx = document.getElementById("mlElbowChart");
        if (elbowCtx) {
            new Chart(elbowCtx, {
                type: "line",
                data: {
                    labels: ks,
                    datasets: [
                        {
                            label: "Inertia (SSE)",
                            data: byK.map(function (r) {
                                return r.inertia;
                            }),
                            borderColor: COLORS.pink,
                            backgroundColor: "rgba(236, 72, 153, 0.1)",
                            fill: true,
                            tension: 0.3,
                            pointRadius: 5,
                            borderWidth: 2.5,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: 1.5,
                    plugins: {
                        legend: { display: false },
                        tooltip: Object.assign({}, TOOLTIP),
                    },
                    scales: {
                        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                        y: {
                            beginAtZero: false,
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
    }

    const labels = segs.map(function (s) {
        return s.segment;
    });
    const colors = COLORS.palette.slice(0, segs.length);

    const sizeCtx = document.getElementById("mlSegmentSizeChart");
    if (sizeCtx && segs.length) {
        new Chart(sizeCtx, {
            type: "doughnut",
            data: {
                labels: labels,
                datasets: [
                    {
                        data: segs.map(function (s) {
                            return s.size;
                        }),
                        backgroundColor: colors,
                        borderColor: "transparent",
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.4,
                cutout: "58%",
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: { usePointStyle: true, boxWidth: 10, font: { size: 11 } },
                    },
                    tooltip: Object.assign({}, TOOLTIP),
                },
            },
        });
    }

    const gmvCtx = document.getElementById("mlGmvShareChart");
    if (gmvCtx && segs.length) {
        new Chart(gmvCtx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "GMV share %",
                        data: segs.map(function (s) {
                            return s.gmv_share_pct;
                        }),
                        backgroundColor: colors.map(function (c) {
                            return c + "cc";
                        }),
                        borderRadius: 4,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.4,
                plugins: {
                    legend: { display: false },
                    tooltip: Object.assign({}, TOOLTIP, {
                        callbacks: {
                            label: function (ctx) {
                                return ctx.parsed.y + "% of GMV";
                            },
                        },
                    }),
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 10 }, maxRotation: 30 },
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: "rgba(255,255,255,0.04)" },
                        ticks: {
                            font: { size: 10 },
                            callback: function (v) {
                                return v + "%";
                            },
                        },
                    },
                },
            },
        });
    }

    const profCtx = document.getElementById("mlRfmProfileChart");
    if (profCtx && segs.length) {
        new Chart(profCtx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Avg Recency (days)",
                        data: segs.map(function (s) {
                            return s.recency_mean;
                        }),
                        backgroundColor: "rgba(0, 212, 255, 0.65)",
                        borderRadius: 4,
                    },
                    {
                        label: "Avg Frequency",
                        data: segs.map(function (s) {
                            return s.frequency_mean;
                        }),
                        backgroundColor: "rgba(139, 92, 246, 0.65)",
                        borderRadius: 4,
                    },
                    {
                        label: "Avg Monetary (BRL / 10)",
                        data: segs.map(function (s) {
                            return Math.round(s.monetary_mean / 10);
                        }),
                        backgroundColor: "rgba(81, 207, 102, 0.65)",
                        borderRadius: 4,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2.2,
                plugins: {
                    legend: {
                        position: "top",
                        align: "start",
                        labels: { usePointStyle: true, boxWidth: 10, font: { size: 11 } },
                    },
                    tooltip: Object.assign({}, TOOLTIP),
                },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                    y: {
                        beginAtZero: true,
                        grid: { color: "rgba(255,255,255,0.04)" },
                        ticks: { font: { size: 10 } },
                    },
                },
            },
        });
    }

    renderRfmScatter3d(rfm.scatter_sample || []);
}

/**
 * Interactive 3D RFM scatter (Plotly) — drag to rotate, scroll to zoom.
 * Axes: X=Recency (days), Y=Frequency, Z=Monetary (BRL)
 */
function renderRfmScatter3d(scatter) {
    const el = document.getElementById("mlScatter3d");
    if (!el || !scatter.length) return;

    if (typeof Plotly === "undefined") {
        el.innerHTML =
            '<p class="chart-fallback">Plotly.js failed to load — 3D chart unavailable.</p>';
        return;
    }

    const bySeg = {};
    scatter.forEach(function (p) {
        const seg = p.segment || "Unknown";
        if (!bySeg[seg]) bySeg[seg] = { r: [], f: [], m: [] };
        bySeg[seg].r.push(p.r);
        bySeg[seg].f.push(p.f != null ? p.f : 1);
        bySeg[seg].m.push(p.m);
    });

    const segNames = Object.keys(bySeg);
    const traces = segNames.map(function (name, i) {
        const c = COLORS.palette[i % COLORS.palette.length] || "#00d4ff";
        return {
            type: "scatter3d",
            mode: "markers",
            name: name,
            x: bySeg[name].r,
            y: bySeg[name].f,
            z: bySeg[name].m,
            text: bySeg[name].r.map(function (_, j) {
                return (
                    name +
                    "<br>R: " +
                    bySeg[name].r[j] +
                    " days<br>F: " +
                    bySeg[name].f[j] +
                    "<br>M: R$ " +
                    Number(bySeg[name].m[j]).toLocaleString("en-US")
                );
            }),
            hoverinfo: "text",
            marker: {
                size: 3.5,
                color: c,
                opacity: 0.75,
                line: { width: 0 },
            },
        };
    });

    const layout = {
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: { color: "#94a3b8", family: "Inter, sans-serif", size: 11 },
        margin: { l: 0, r: 0, t: 8, b: 0 },
        showlegend: true,
        legend: {
            orientation: "h",
            y: 1.08,
            x: 0,
            font: { size: 11, color: "#94a3b8" },
            bgcolor: "rgba(0,0,0,0)",
        },
        scene: {
            bgcolor: "rgba(26, 35, 50, 0.6)",
            xaxis: {
                title: { text: "Recency (days)", font: { size: 12, color: "#00d4ff" } },
                gridcolor: "rgba(255,255,255,0.08)",
                zerolinecolor: "rgba(255,255,255,0.15)",
                color: "#94a3b8",
                backgroundcolor: "rgba(10, 14, 26, 0.4)",
                showbackground: true,
            },
            yaxis: {
                title: { text: "Frequency", font: { size: 12, color: "#8b5cf6" } },
                gridcolor: "rgba(255,255,255,0.08)",
                zerolinecolor: "rgba(255,255,255,0.15)",
                color: "#94a3b8",
                backgroundcolor: "rgba(10, 14, 26, 0.4)",
                showbackground: true,
            },
            zaxis: {
                title: { text: "Monetary (BRL)", font: { size: 12, color: "#51cf66" } },
                gridcolor: "rgba(255,255,255,0.08)",
                zerolinecolor: "rgba(255,255,255,0.15)",
                color: "#94a3b8",
                backgroundcolor: "rgba(10, 14, 26, 0.4)",
                showbackground: true,
            },
            camera: {
                eye: { x: 1.55, y: 1.45, z: 1.15 },
            },
            aspectmode: "cube",
            dragmode: "orbit",
        },
        hovermode: "closest",
    };

    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ["toImage", "sendDataToCloud", "lasso2d", "select2d"],
        scrollZoom: true,
    };

    Plotly.newPlot(el, traces, layout, config);

    // Keep aspect on resize
    window.addEventListener(
        "resize",
        function () {
            Plotly.Plots.resize(el);
        },
        { passive: true }
    );
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

    try {
        const ml = await loadMlData();
        paintMl(ml);
    } catch (err) {
        console.error("ML load failed:", err);
        const box = document.getElementById("mlLoadError");
        if (box) box.hidden = false;
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}

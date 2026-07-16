// ===== KPI ANIMATED COUNTER =====
function animateCounters() {
    const counters = document.querySelectorAll('.kpi-value');

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseFloat(el.dataset.target);
                    const duration = 2000; // ms
                    const startTime = performance.now();

                    function update(currentTime) {
                        const elapsed = currentTime - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        // Ease out cubic
                        const eased = 1 - Math.pow(1 - progress, 3);
                        const current = target * eased;

                        if (Number.isInteger(target)) {
                            el.textContent = Math.floor(current).toLocaleString();
                        } else {
                            el.textContent = current.toFixed(1);
                        }

                        if (progress < 1) {
                            requestAnimationFrame(update);
                        } else {
                            el.textContent = Number.isInteger(target)
                                ? target.toLocaleString()
                                : target.toFixed(1);
                        }
                    }

                    requestAnimationFrame(update);
                    observer.unobserve(el);
                }
            });
        },
        { threshold: 0.3 }
    );

    counters.forEach((counter) => observer.observe(counter));
}

// ===== CHARTS =====
// Chart.js global defaults for dark theme
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.06)';
Chart.defaults.font.family = "'Inter', sans-serif";

/**
 * 1. Price Trend (Line Chart)
 */
const priceTrendCtx = document.getElementById('priceTrendChart');
if (priceTrendCtx) {
    new Chart(priceTrendCtx, {
        type: 'line',
        data: {
            labels: ['Q1 2021', 'Q2 2021', 'Q3 2021', 'Q4 2021', 'Q1 2022', 'Q2 2022', 'Q3 2022', 'Q4 2022', 'Q1 2023', 'Q2 2023', 'Q3 2023', 'Q4 2023', 'Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'],
            datasets: [
                {
                    label: 'Luxury',
                    data: [85, 88, 92, 95, 98, 102, 105, 110, 115, 118, 120, 125, 130, 135, 138, 142],
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.08)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    borderWidth: 2.5,
                },
                {
                    label: 'Mid-End',
                    data: [42, 44, 45, 47, 49, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70],
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.08)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    borderWidth: 2.5,
                },
                {
                    label: 'Affordable',
                    data: [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33],
                    borderColor: '#51cf66',
                    backgroundColor: 'rgba(81, 207, 102, 0.08)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    borderWidth: 2.5,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.2,
            plugins: {
                legend: {
                    position: 'top',
                    align: 'start',
                    labels: {
                        boxWidth: 12,
                        boxHeight: 12,
                        usePointStyle: true,
                        padding: 16,
                        font: { size: 11, weight: '500' },
                    },
                },
                tooltip: {
                    backgroundColor: '#1a2332',
                    titleColor: '#f1f5f9',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(0, 212, 255, 0.15)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} M VND/m²`,
                    },
                },
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        maxRotation: 45,
                        font: { size: 10 },
                    },
                },
                y: {
                    beginAtZero: false,
                    grid: { color: 'rgba(255, 255, 255, 0.04)' },
                    ticks: {
                        font: { size: 10 },
                        callback: (val) => val + ' M',
                    },
                },
            },
        },
    });
}

/**
 * 2. Supply by Segment (Doughnut Chart)
 */
const segmentCtx = document.getElementById('segmentChart');
if (segmentCtx) {
    new Chart(segmentCtx, {
        type: 'doughnut',
        data: {
            labels: ['Luxury', 'Mid-End', 'Affordable', 'Social Housing'],
            datasets: [
                {
                    data: [18, 42, 28, 12],
                    backgroundColor: ['#00d4ff', '#8b5cf6', '#51cf66', '#fcc419'],
                    borderColor: 'transparent',
                    hoverOffset: 8,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.6,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        boxHeight: 12,
                        usePointStyle: true,
                        padding: 16,
                        font: { size: 11, weight: '500' },
                    },
                },
                tooltip: {
                    backgroundColor: '#1a2332',
                    titleColor: '#f1f5f9',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(0, 212, 255, 0.15)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: (ctx) => `${ctx.label}: ${ctx.parsed}% of total supply`,
                    },
                },
            },
        },
    });
}

/**
 * 3. Regional Price Comparison (Bar Chart)
 */
const regionalCtx = document.getElementById('regionalChart');
if (regionalCtx) {
    new Chart(regionalCtx, {
        type: 'bar',
        data: {
            labels: ['HCMC', 'Hanoi', 'Da Nang', 'Hai Phong', 'Can Tho', 'Binh Duong', 'Dong Nai', 'Ba Ria-VT', 'Quang Ninh', 'Da Lat'],
            datasets: [
                {
                    label: 'Avg Price (M VND/m²)',
                    data: [78, 65, 42, 35, 28, 32, 30, 45, 38, 25],
                    backgroundColor: [
                        'rgba(0, 212, 255, 0.7)',
                        'rgba(59, 130, 246, 0.7)',
                        'rgba(139, 92, 246, 0.7)',
                        'rgba(236, 72, 153, 0.7)',
                        'rgba(81, 207, 102, 0.7)',
                        'rgba(252, 196, 25, 0.7)',
                        'rgba(255, 107, 107, 0.7)',
                        'rgba(0, 212, 255, 0.5)',
                        'rgba(139, 92, 246, 0.5)',
                        'rgba(81, 207, 102, 0.5)',
                    ],
                    borderColor: 'transparent',
                    borderRadius: 4,
                    borderSkipped: false,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1a2332',
                    titleColor: '#f1f5f9',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(0, 212, 255, 0.15)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: (ctx) => `${ctx.parsed.y} M VND/m²`,
                    },
                },
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 10 } },
                },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.04)' },
                    ticks: {
                        font: { size: 10 },
                        callback: (val) => val + ' M',
                    },
                },
            },
        },
    });
}

/**
 * 4. Monthly Transactions (Mixed Bar + Line)
 */
const transactionsCtx = document.getElementById('transactionsChart');
if (transactionsCtx) {
    new Chart(transactionsCtx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [
                {
                    label: 'Transaction Volume',
                    data: [320, 280, 410, 380, 450, 520, 490, 470, 510, 560, 530, 580],
                    backgroundColor: 'rgba(0, 212, 255, 0.6)',
                    borderColor: 'rgba(0, 212, 255, 0.8)',
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false,
                    order: 2,
                },
                {
                    label: 'Total Value (B VND)',
                    data: [8.2, 7.1, 10.5, 9.8, 11.6, 13.4, 12.7, 12.1, 13.2, 14.5, 13.8, 15.1],
                    type: 'line',
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#ff6b6b',
                    borderWidth: 2.5,
                    order: 1,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5,
            plugins: {
                legend: {
                    position: 'top',
                    align: 'start',
                    labels: {
                        boxWidth: 12,
                        boxHeight: 12,
                        usePointStyle: true,
                        padding: 16,
                        font: { size: 11, weight: '500' },
                    },
                },
                tooltip: {
                    backgroundColor: '#1a2332',
                    titleColor: '#f1f5f9',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(0, 212, 255, 0.15)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: (ctx) => {
                            if (ctx.dataset.label === 'Transaction Volume') {
                                return `${ctx.dataset.label}: ${ctx.parsed.y} units`;
                            }
                            return `${ctx.dataset.label}: ${ctx.parsed.y} B VND`;
                        },
                    },
                },
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 10 } },
                },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.04)' },
                    ticks: {
                        font: { size: 10 },
                        callback: (val) => val + (this?.chart?.scales?.y?.max > 100 ? '' : 'B'),
                    },
                },
            },
        },
    });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    animateCounters();
});
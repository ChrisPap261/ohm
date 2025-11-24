let yieldBySeasonChart = null;

function loadAnalytics() {
    const content = `
        <div class="page-header">
            <div>
                <h1>Analytics</h1>
                <p class="page-description">Συγκριτικά στατιστικά απόδοσης για όλες τις περιόδους.</p>
            </div>
        </div>
        <div class="card">
            <div class="card-header">
                <div>
                    <h2>Απόδοση λαδιού ανά περίοδο</h2>
                    <p class="text-muted">Μέσο ποσοστό κιλών λαδιού ανά κιλό ελιάς (σύνολο ανά περίοδο).</p>
                </div>
            </div>
            <div class="card-content">
                <div id="yield-chart-loading" class="loading-state">
                    Φόρτωση δεδομένων...
                </div>
                <div id="yield-chart-empty" class="empty-state" style="display:none;">
                    Δεν βρέθηκαν δεδομένα από ελαιοτριβεία. Καταχωρίστε επεξεργασίες για να εμφανιστεί το γράφημα.
                </div>
                <div id="yield-chart-wrapper" style="height:320px; display:none;">
                    <canvas id="yield-by-season-chart" aria-label="Διάγραμμα απόδοσης λαδιού"></canvas>
                </div>
            </div>
        </div>
    `;

    $('#page-content').html(content);
    fetchYieldBySeason();
}

function fetchYieldBySeason() {
    $.ajax({
        url: 'api/stats.php?action=oil_yield_by_season',
        method: 'GET',
        success: function(response) {
            $('#yield-chart-loading').hide();

            if (!response.success) {
                showAlert(response.error || 'Αποτυχία φόρτωσης δεδομένων', 'danger');
                $('#yield-chart-empty').show();
                return;
            }

            renderYieldChart(response.data || []);
        },
        error: function() {
            $('#yield-chart-loading').hide();
            $('#yield-chart-empty').show();
            showAlert('Αποτυχία φόρτωσης δεδομένων', 'danger');
        }
    });
}

function renderYieldChart(rows) {
    const emptyState = $('#yield-chart-empty');
    const wrapper = $('#yield-chart-wrapper');

    const filteredRows = rows.filter(row => row.totalOlivesKg > 0 && row.totalOilKg > 0);

    if (!filteredRows.length) {
        emptyState.show();
        wrapper.hide();
        return;
    }

    const labels = filteredRows.map(row => row.seasonName || `Περίοδος ${row.seasonId}`);
    const values = filteredRows.map(row => row.yieldPercent);
    const ratios = filteredRows.map(row => formatYieldRatio(row.totalOlivesKg, row.totalOilKg));

    wrapper.show();
    emptyState.hide();

    const ctx = document.getElementById('yield-by-season-chart').getContext('2d');

    if (yieldBySeasonChart) {
        yieldBySeasonChart.destroy();
    }

    yieldBySeasonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Απόδοση (%)',
                data: values,
                yieldRatios: ratios,
                backgroundColor: 'rgba(138, 170, 82, 0.65)',
                borderColor: '#6a843f',
                borderWidth: 2,
                borderRadius: 10,
                hoverBackgroundColor: 'rgba(138, 170, 82, 0.85)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(106, 132, 63, 0.15)'
                    },
                    ticks: {
                        color: '#6b6b6b',
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Ποσοστό απόδοσης',
                        color: '#5a5a5a',
                        font: {
                            size: 12
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#6b6b6b'
                    },
                    title: {
                        display: true,
                        text: 'Περίοδοι',
                        color: '#5a5a5a',
                        font: {
                            size: 12
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const ratio = context.dataset.yieldRatios?.[context.dataIndex] || '';
                            return `${context.formattedValue}% μέσος όρος (${ratio})`;
                        }
                    }
                },
                datalabels: {
                    anchor: 'end',
                    align: 'end',
                    color: '#4b4b4b',
                    font: {
                        weight: '600'
                    },
                    offset: -6,
                    formatter: function(value, context) {
                        const ratio = context.dataset.yieldRatios?.[context.dataIndex];
                        return value ? `${value}%\n${ratio || ''}` : '';
                    }
                }
            }
        }
    });
}

function formatYieldRatio(olivesKg, oilKg) {
    if (!oilKg) {
        return '—';
    }
    const ratio = olivesKg / oilKg;
    return `${ratio.toFixed(1)}:1`;
}


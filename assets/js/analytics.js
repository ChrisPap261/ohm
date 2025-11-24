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
                backgroundColor: 'rgba(72, 149, 239, 0.3)',
                borderColor: 'rgba(72, 149, 239, 1)',
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Ποσοστό απόδοσης',
                        color: '#6c757d',
                        font: {
                            size: 12
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Περίοδοι',
                        color: '#6c757d',
                        font: {
                            size: 12
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.formattedValue}% μέσος όρος`;
                        }
                    }
                },
                datalabels: {
                    anchor: 'end',
                    align: 'start',
                    formatter: function(value) {
                        return value ? `${value}%` : '';
                    }
                }
            }
        }
    });
}


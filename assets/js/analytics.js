let yieldBySeasonChart = null;
let fieldYieldChart = null;
let fieldYieldDataset = {
    records: [],
    fields: [],
    seasons: []
};

function loadAnalytics() {
    const content = `
        <div class="page-header">
            <div>
                <h1 class="analytics-title">Analytics</h1>
                <p class="analytics-description">Συγκριτικά στατιστικά απόδοσης για όλες τις περιόδους.</p>
            </div>
        </div>
        <div class="analytics-grid">
            <div class="card analytics-card">
                <div class="card-header analytics-card-header">
                    <div>
                        <h2 class="analytics-card-title">Απόδοση λαδιού ανά περίοδο</h2>
                        <p class="analytics-card-subtitle">Μέσο ποσοστό κιλών λαδιού ανά κιλό ελιάς (σύνολο ανά περίοδο).</p>
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
            <div class="card analytics-card">
                <div class="card-header analytics-card-header analytics-card-header--with-controls">
                    <div>
                        <h2 class="analytics-card-title">Παραγωγή σε κιλά ανά περίοδο</h2>
                        <p class="analytics-card-subtitle">Σύνολο κιλών ελιάς ανά χρονιά, ανά αγροτεμάχιο ή συνολικά.</p>
                    </div>
                    <div class="analytics-card-controls">
                        <label for="field-yield-filter">Αγροτεμάχιο</label>
                        <select id="field-yield-filter">
                            <option value="all">Όλα</option>
                        </select>
                    </div>
                </div>
                <div class="card-content">
                    <div id="field-yield-chart-loading" class="loading-state">
                        Φόρτωση δεδομένων...
                    </div>
                    <div id="field-yield-chart-empty" class="empty-state" style="display:none;">
                        Δεν βρέθηκαν συγκομιδές για να εμφανιστούν δεδομένα.
                    </div>
                    <div id="field-yield-chart-wrapper" style="height:320px; display:none;">
                        <canvas id="field-yield-chart" aria-label="Διάγραμμα τελάρων ανά περίοδο"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;

    $('#page-content').html(content);
    fetchYieldBySeason();
    fetchFieldYieldBySeason();
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
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Απόδοση (%)',
                data: values,
                yieldRatios: ratios,
                borderColor: '#5f7631',
                backgroundColor: 'rgba(139, 169, 82, 0.2)',
                tension: 0.35,
                fill: true,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#5f7631',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 6
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
                    align: 'top',
                    anchor: 'end',
                    color: '#4b4b4b',
                    font: {
                        weight: '600'
                    },
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

function fetchFieldYieldBySeason() {
    $.ajax({
        url: 'api/stats.php?action=field_crates_by_season',
        method: 'GET',
        success: function(response) {
            $('#field-yield-chart-loading').hide();

            if (!response.success) {
                showAlert(response.error || 'Αποτυχία φόρτωσης δεδομένων', 'danger');
                $('#field-yield-chart-empty').show();
                return;
            }

            fieldYieldDataset = response.data || { records: [], fields: [], seasons: [] };
            populateFieldDropdown();
            renderFieldYieldChart('all');
        },
        error: function() {
            $('#field-yield-chart-loading').hide();
            $('#field-yield-chart-empty').show();
            showAlert('Αποτυχία φόρτωσης δεδομένων', 'danger');
        }
    });
}

function populateFieldDropdown() {
    const select = $('#field-yield-filter');
    select.empty();
    select.append('<option value="all">Όλα</option>');

    (fieldYieldDataset.fields || []).forEach(function(field) {
        select.append(`<option value="${field.id}">${field.name}</option>`);
    });

    select.on('change', function() {
        renderFieldYieldChart($(this).val());
    });
}

function renderFieldYieldChart(selectedField) {
    const emptyState = $('#field-yield-chart-empty');
    const wrapper = $('#field-yield-chart-wrapper');
    const { records = [], seasons = [] } = fieldYieldDataset;

    if (!records.length || !seasons.length) {
        emptyState.show();
        wrapper.hide();
        return;
    }

    const labels = seasons.map(season => season.name);
    const kgValues = [];
    const crateValues = [];

    seasons.forEach(season => {
        const seasonId = season.id;
        const seasonRecords = records.filter(record => record.seasonId === seasonId);

        if (selectedField === 'all') {
            const totalKg = seasonRecords.reduce((sum, record) => sum + (record.totalOlivesKg || 0), 0);
            const totalCrates = seasonRecords.reduce((sum, record) => sum + (record.totalCrates || 0), 0);
            kgValues.push(totalKg);
            crateValues.push(totalCrates);
            return;
        }

        const matched = seasonRecords.find(record => String(record.fieldId) === String(selectedField));
        kgValues.push(matched ? (matched.totalOlivesKg || 0) : 0);
        crateValues.push(matched ? (matched.totalCrates || 0) : 0);
    });

    const hasData = kgValues.some(value => value > 0);

    if (!hasData) {
        emptyState.show();
        wrapper.hide();
        return;
    }

    wrapper.show();
    emptyState.hide();

    const ctx = document.getElementById('field-yield-chart').getContext('2d');

    if (fieldYieldChart) {
        fieldYieldChart.destroy();
    }

    const selectedFieldName = selectedField === 'all'
        ? 'Όλα τα αγροτεμάχια'
        : (fieldYieldDataset.fields.find(field => String(field.id) === String(selectedField))?.name || '');

    fieldYieldChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: selectedFieldName,
                data: kgValues,
                harvestCrates: crateValues,
                borderColor: '#5f7631',
                backgroundColor: 'rgba(139, 169, 82, 0.25)',
                tension: 0.35,
                fill: true,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#5f7631',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#4b4b4b'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const crates = context.dataset.harvestCrates?.[context.dataIndex] ?? 0;
                            return `${context.formattedValue} kg (${crates} τελάρα)`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(95, 118, 49, 0.15)'
                    },
                    ticks: {
                        color: '#6b6b6b',
                        callback: function(value) {
                            return value + ' kg';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Κιλά',
                        color: '#5a5a5a'
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
                        color: '#5a5a5a'
                    }
                }
            }
        }
    });
}


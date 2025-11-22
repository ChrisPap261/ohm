// Dashboard Page

let harvestsChart = null;
let transactionsChart = null;

function loadDashboard() {
    const seasonId = getSeasonId();
    
    if (!seasonId) {
        $('#page-content').html(`
            <div class="page-header">
                <h1 class="page-title">Επισκόπηση</h1>
                <p class="page-description">Δεν υπάρχει ενεργή περίοδος</p>
            </div>
            <div class="card">
                <p>Παρακαλώ δημιουργήστε μια περίοδο από τη σελίδα "Περίοδοι".</p>
            </div>
        `);
        return;
    }
    
    $('#page-content').html(`
        <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
                <h1 class="page-title">Επισκόπηση</h1>
                <p class="page-description" id="dashboard-season-name">Στατιστικά για την περίοδο ${activeSeason.name}</p>
            </div>
            <select id="dashboard-season-select" class="form-control" autocomplete="off" style="width: auto; min-width: 200px;">
                <!-- Seasons will be loaded here -->
            </select>
        </div>
        
        <div class="stats-grid" id="stats-grid">
            <!-- Stats will be loaded here -->
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Απόδοση ανά Αγροτεμάχιο</h3>
                    <p class="card-description">Συνολική παραγωγή σε kg ελιών</p>
                </div>
                <div class="chart-container" style="position: relative; height: 300px; width: 100%;">
                    <canvas id="harvests-chart"></canvas>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Έσοδα vs Έξοδα</h3>
                    <p class="card-description">Οικονομική επισκόπηση</p>
                </div>
                <div class="chart-container" style="position: relative; height: 300px; width: 100%;">
                    <canvas id="transactions-chart"></canvas>
                </div>
            </div>
        </div>
    `);
    
    loadSeasonsDropdown();
    loadDashboardStats();
}

function loadDashboardStats() {
    const seasonId = getSeasonId();
    
    // Load stats
    $.ajax({
        url: `api/stats.php?action=dashboard&season_id=${seasonId}`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                displayStats(response.data);
            }
        }
    });
    
    // Load harvests by field
    $.ajax({
        url: `api/stats.php?action=harvests_by_field&season_id=${seasonId}`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                displayHarvestsChart(response.data);
            }
        }
    });
}

function displayStats(data) {
    const stats = `
        <div class="stat-card">
            <div class="stat-header">
                <span class="stat-label">Συνολική Συγκομιδή</span>
                <span class="stat-icon">🫒</span>
            </div>
            <div class="stat-value">${data.harvests.totalOlivesKg}kg</div>
            <div class="stat-subtitle">${data.harvests.totalCrates} τελάρα</div>
        </div>
        
        <div class="stat-card">
            <div class="stat-header">
                <span class="stat-label">Παραγωγή Λαδιού</span>
                <span class="stat-icon">🏭</span>
            </div>
            <div class="stat-value">${data.mill.totalOilKg}kg (${(data.mill.totalOilKg * 1.1).toFixed(0)}L)</div>
            <div class="stat-subtitle">Κόστος: ${formatCurrency(data.mill.totalExpenses)}</div>
        </div>
        
        <div class="stat-card">
            <div class="stat-header">
                <span class="stat-label">Πωλήσεις Λαδιού</span>
                <span class="stat-icon">🛢️</span>
            </div>
            <div class="stat-value">${data.oil.totalSold}L (${(data.oil.totalSold / 1.1).toFixed(0)}kg)</div>
            <div class="stat-subtitle">Έσοδα: ${formatCurrency(data.oil.totalRevenue)}</div>
        </div>
        
        <div class="stat-card" style="background: #89a54f; color: #ffffff;">
            <div class="stat-header">
                <span class="stat-label" style="color: #ffffff;">Συν. Υπ. Λαδιού</span>
                <span class="stat-icon">📦</span>
            </div>
            <div class="stat-value" style="color: #ffffff;">${data.oil.remaining}kg (${(data.oil.remaining * 1.1).toFixed(0)}L)</div>
            <div class="stat-subtitle" style="color: #ffffff;">Προηγ.: ${data.oil.previousInventory} κγ.</div>
        </div>
        

    `;
    
    $('#stats-grid').html(stats);
}

function displayHarvestsChart(data) {
    if (harvestsChart) {
        harvestsChart.destroy();
    }
    
    const ctx = document.getElementById('harvests-chart').getContext('2d');
    harvestsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.name),
            datasets: [{
                label: 'Κιλά Ελιών',
                data: data.map(d => d.totalOlivesKg),
                backgroundColor: 'rgba(107, 142, 35, 0.8)',
                borderColor: 'rgba(107, 142, 35, 1)',
                borderWidth: 1,
                // Store crates data for display
                crates: data.map(d => d.totalCrates)
            }]
        },
        options: {
            indexAxis: 'y', // Horizontal bar chart
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const index = context.dataIndex;
                            const crates = context.dataset.crates[index];
                            const kg = context.parsed.x; // Changed from parsed.y to parsed.x for horizontal
                            return `${kg}kg (${crates} τελάρα)`;
                        }
                    }
                },
                datalabels: {
                    display: false // Hide labels, show only on hover
                }
            },
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Load transaction stats for pie chart
    const seasonId = getSeasonId();
    $.ajax({
        url: `api/stats.php?action=dashboard&season_id=${seasonId}`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                displayTransactionsChart(response.data.transactions);
            }
        }
    });
}

function displayTransactionsChart(data) {
    if (transactionsChart) {
        transactionsChart.destroy();
    }
    
    const ctx = document.getElementById('transactions-chart').getContext('2d');
    transactionsChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Έσοδα', 'Έξοδα', 'Δωρεές'],
            datasets: [{
                data: [
                    data.totalIncome / 100,
                    data.totalExpenses / 100,
                    data.totalDonations / 100
                ],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(59, 130, 246, 0.8)'
                ],
                borderColor: [
                    'rgba(34, 197, 94, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(59, 130, 246, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function displayFieldsTable(data) {
    const mobileConfig = {
        getHeader: (field) => field.name,
        fields: [
            { label: 'Συγκομιδές', getValue: (f) => f.harvestCount },
            { label: 'Τελάρα', getValue: (f) => f.totalCrates },
            { label: 'Κιλά Ελιών', getValue: (f) => f.totalOlivesKg + 'kg' }
        ]
    };
    
    updateTableDisplay('#fields-details-table', data, displayFieldsTableDesktop, mobileConfig);
}

function displayFieldsTableDesktop(data) {
    if (data.length === 0) {
        $('#fields-details-table tbody').html('<tr><td colspan="4" class="text-center">Δεν υπάρχουν δεδομένα</td></tr>');
        return;
    }
    
    const rows = data.map(field => `
        <tr>
            <td><strong>${field.name}</strong></td>
            <td>${field.harvestCount}</td>
            <td>${field.totalCrates}</td>
            <td>${field.totalOlivesKg}kg</td>
        </tr>
    `).join('');
    
    $('#fields-details-table tbody').html(rows);
}

function loadSeasonsDropdown() {
    $.ajax({
        url: 'api/seasons.php?action=list',
        method: 'GET',
        success: function(response) {
            if (response.success) {
                const currentSeasonId = getSeasonId();
                const seasons = response.data;
                const options = seasons.map(season => 
                    `<option value="${season.id}" ${season.id == currentSeasonId ? 'selected' : ''}>${season.name}</option>`
                ).join('');
                
                // Load to main dashboard dropdown
                $('#dashboard-season-select').html(options);
                
                // Add change event listener for global update
                $('#dashboard-season-select').on('change', function() {
                    const selectedSeasonId = $(this).val();
                    const selectedSeason = seasons.find(s => s.id == selectedSeasonId);
                    
                    // Update season name in header
                    if (selectedSeason) {
                        $('#dashboard-season-name').text(`Στατιστικά για την περίοδο ${selectedSeason.name}`);
                    }
                    
                    // Reload all dashboard data
                    loadAllDashboardData(selectedSeasonId);
                });
            }
        }
    });
}

function loadAllDashboardData(seasonId) {
    // Load stats (4 stat cards)
    $.ajax({
        url: `api/stats.php?action=dashboard&season_id=${seasonId}`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                displayStats(response.data);
                displayTransactionsChart(response.data.transactions);
            }
        }
    });
    
    // Load harvests by field (bar chart)
    $.ajax({
        url: `api/stats.php?action=harvests_by_field&season_id=${seasonId}`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                displayHarvestsChart(response.data);
            }
        }
    });
}



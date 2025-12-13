// Fields Management

function loadFields() {
    $('#page-content').html(`
        <div class="page-header">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h1 class="page-title">Αγροτεμάχια</h1>
                    <p class="page-description">Διαχείριση αγροτεμαχίων</p>
                </div>
                <button class="btn btn-primary" onclick="showFieldModal()">
                    ➕ Νέο Αγροτεμάχιο
                </button>
            </div>
        </div>
        
        <div class="card">
            <div class="table-responsive">
                <table class="table" id="fields-table">
                    <thead>
                        <tr>
                            <th>Όνομα</th>
                            <th>Τοποθεσία</th>
                            <th>Έκταση (τ.μ.)</th>
                            <th>Δέντρα</th>
                            <th>Ενέργειες</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Data will be loaded here -->
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Modal -->
        <div id="field-modal" class="modal">
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3 class="modal-title" id="field-modal-title">Νέο Αγροτεμάχιο</h3>
                    <button class="modal-close" onclick="closeFieldModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="field-form" autocomplete="off">
                        <input type="hidden" id="field-id">
                        <div class="form-group">
                            <label class="form-label" for="field-name">Όνομα *</label>
                            <input type="text" id="field-name" class="form-control" autocomplete="off" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="field-location">Τοποθεσία</label>
                            <input type="text" id="field-location" class="form-control" autocomplete="off">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="field-area">Έκταση (τ.μ.)</label>
                            <input type="number" id="field-area" class="form-control" autocomplete="off">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="field-tree-count">Αριθμός Δέντρων</label>
                            <input type="number" id="field-tree-count" class="form-control" autocomplete="off">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeFieldModal()">Ακύρωση</button>
                    <button class="btn btn-primary" onclick="saveField()">Αποθήκευση</button>
                </div>
            </div>
        </div>
    `);
    
    loadFieldsData();
}

function loadFieldsData() {
    $.ajax({
        url: 'api/fields.php?action=list',
        method: 'GET',
        success: function(response) {
            if (response.success) {
                displayFields(response.data);
            }
        }
    });
}

function displayFields(fields) {
    const mobileConfig = {
        getHeader: (field) => field.name,
        fields: [
            { label: 'Τοποθεσία', getValue: (f) => f.location || '-' },
            { label: 'Έκταση', getValue: (f) => f.area ? f.area + ' τ.μ.' : '-' },
            { label: 'Δέντρα', getValue: (f) => f.tree_count || '-' }
        ],
        actions: [
            {
                label: '🌾 Καρτέλα',
                className: 'btn-primary btn-sm',
                getOnClick: (f) => `viewFieldCard(${f.id})`
            },
            {
                label: '✏️ Επεξεργασία',
                className: 'btn-secondary btn-sm',
                getOnClick: (f) => `editField(${JSON.stringify(f).replace(/"/g, '&quot;')})`
            },
            {
                label: '🗑️ Διαγραφή',
                className: 'btn-secondary btn-sm',
                getOnClick: (f) => `deleteField(${f.id})`
            }
        ]
    };
    
    updateTableDisplay('#fields-table', fields, displayFieldsTable, mobileConfig);
}

function displayFieldsTable(fields) {
    if (fields.length === 0) {
        $('#fields-table tbody').html('<tr><td colspan="5" class="text-center">Δεν υπάρχουν αγροτεμάχια</td></tr>');
        return;
    }
    
    const rows = fields.map(field => `
        <tr>
            <td><strong>${field.name}</strong></td>
            <td>${field.location || '-'}</td>
            <td>${field.area ? field.area + ' τ.μ.' : '-'}</td>
            <td>${field.tree_count || '-'}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="viewFieldCard(${field.id})">
                    🌾 Καρτέλα
                </button>
                <button class="btn btn-secondary btn-sm" onclick='editField(${JSON.stringify(field)})'>
                    ✏️
                </button>
                <button class="btn btn-secondary btn-sm" onclick="deleteField(${field.id})">
                    🗑️
                </button>
            </td>
        </tr>
    `).join('');
    
    $('#fields-table tbody').html(rows);
}

function showFieldModal(field = null) {
    if (field) {
        $('#field-modal-title').text('Επεξεργασία Αγροτεμαχίου');
        $('#field-id').val(field.id);
        $('#field-name').val(field.name);
        $('#field-location').val(field.location || '');
        $('#field-area').val(field.area || '');
        $('#field-tree-count').val(field.tree_count || '');
    } else{
        $('#field-modal-title').text('Νέο Αγροτεμάχιο');
        $('#field-form')[0].reset();
        $('#field-id').val('');
    }
    
    $('#field-modal').addClass('show');
}

function closeFieldModal() {
    $('#field-modal').removeClass('show');
}

function editField(field) {
    showFieldModal(field);
}

function saveField() {
    const id = $('#field-id').val();
    const data = {
        name: $('#field-name').val(),
        location: $('#field-location').val(),
        area: $('#field-area').val() ? parseInt($('#field-area').val()) : null,
        tree_count: $('#field-tree-count').val() ? parseInt($('#field-tree-count').val()) : null
    };
    
    if (id) {
        data.id = parseInt(id);
    }
    
    const action = id ? 'update' : 'create';
    
    $.ajax({
        url: `api/fields.php?action=${action}`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(response) {
            if (response.success) {
                showAlert('Το αγροτεμάχιο αποθηκεύτηκε επιτυχώς', 'success');
                closeFieldModal();
                loadFieldsData();
            } else {
                showAlert(response.error || 'Σφάλμα αποθήκευσης', 'danger');
            }
        }
    });
}

function deleteField(id) {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το αγροτεμάχιο;')) {
        return;
    }
    
    $.ajax({
        url: `api/fields.php?action=delete&id=${id}`,
        method: 'POST',
        success: function(response) {
            if (response.success) {
                showAlert('Το αγροτεμάχιο διαγράφηκε επιτυχώς', 'success');
                loadFieldsData();
            } else {
                showAlert(response.error || 'Σφάλμα διαγραφής', 'danger');
            }
        }
    });
}

let currentFieldId = null;
let currentSeasonFilter = null;

function viewFieldCard(fieldId) {
    currentFieldId = fieldId;
    // Get seasons list to find the latest one
    $.ajax({
        url: 'api/seasons.php?action=list',
        method: 'GET',
        success: function(seasonsResponse) {
            if (seasonsResponse.success && seasonsResponse.data.length > 0) {
                const seasons = seasonsResponse.data;
                const latestSeasonId = seasons[0].id; // First one is latest (ordered by start_date DESC)
                loadFieldCardData(fieldId, latestSeasonId.toString());
            } else {
                // No seasons, load all data
                loadFieldCardData(fieldId, 'all');
            }
        },
        error: function() {
            // On error, load all data
            loadFieldCardData(fieldId, 'all');
        }
    });
}

function loadFieldCardData(fieldId, seasonFilter) {
    currentSeasonFilter = seasonFilter;
    const url = `api/fields.php?action=get&id=${fieldId}&season=${seasonFilter}`;
    
    $.ajax({
        url: url,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                displayFieldCard(response.data, seasonFilter);
            } else {
                showAlert('Σφάλμα κατά τη φόρτωση καρτέλας αγροτεμαχίου', 'danger');
            }
        },
        error: function() {
            showAlert('Σφάλμα κατά τη φόρτωση καρτέλας αγροτεμαχίου', 'danger');
        }
    });
}

function displayFieldCard(field, seasonFilter = 'latest') {
    const harvests = field.harvests || [];
    const stats = field.stats || {};
    const area = field.area || 0;
    const treeCount = field.tree_count || 0;
    
    // Calculate statistics
    let totalHarvests = stats.totalHarvests || 0;
    let totalCrates = stats.totalCrates || 0;
    let totalOlivesKg = stats.totalOlivesKg || 0;
    const avgKgPerCrate = stats.avgKgPerCrate || 22.5;
    
    // For average mode, show decimal values
    const isAverageMode = seasonFilter === 'average';
    const isTotalMode = seasonFilter === 'all';
    
    // Average yield per stremma (kg per stremma)
    const avgYieldPerStremma = area > 0 && totalHarvests > 0 
        ? (totalOlivesKg / area).toFixed(isAverageMode ? 2 : 0) 
        : '-';
    
    // Average yield per tree (kg per tree)
    const avgYieldPerTree = treeCount > 0 && totalHarvests > 0 
        ? (totalOlivesKg / treeCount).toFixed(isAverageMode ? 2 : 0) 
        : '-';
    
    // Average crates per stremma
    const avgCratesPerStremma = area > 0 && totalHarvests > 0 
        ? (totalCrates / area).toFixed(isAverageMode ? 2 : 0) 
        : '-';
    
    // Format values based on mode
    const formatValue = (val) => {
        if (val === 0 || val === '-') return val;
        return isAverageMode ? parseFloat(val).toFixed(2) : Math.round(val);
    };
    
    totalHarvests = formatValue(totalHarvests);
    totalCrates = formatValue(totalCrates);
    totalOlivesKg = formatValue(totalOlivesKg);
    
    // Load seasons for dropdown
    $.ajax({
        url: 'api/seasons.php?action=list',
        method: 'GET',
        success: function(response) {
            if (response.success) {
                const seasons = response.data;
                const latestSeason = seasons.length > 0 ? seasons[0] : null;
                
                // Determine which option should be selected
                let selectedValue = seasonFilter;
                if (seasonFilter === 'latest' && latestSeason) {
                    selectedValue = latestSeason.id.toString();
                }
                
                const seasonOptions = `
                    <option value="all" ${selectedValue === 'all' ? 'selected' : ''}>Συνολικά</option>
                    <option value="average" ${selectedValue === 'average' ? 'selected' : ''}>Μέσος όρος</option>
                    ${seasons.map(s => 
                        `<option value="${s.id}" ${selectedValue === s.id.toString() ? 'selected' : ''}>${s.name}</option>`
                    ).join('')}
                `;
                
                $('#page-content').html(`
        <div class="page-header">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h1 class="page-title">Καρτέλα Αγροτεμαχίου</h1>
                    <p class="page-description">${field.name}</p>
                </div>
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <select id="field-card-season-select" class="form-control" autocomplete="off" style="width: auto; min-width: 150px;">
                        ${seasonOptions}
                    </select>
                    <button class="btn btn-secondary" onclick="loadFields()">
                        ← Πίσω
                    </button>
                </div>
            </div>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">Όνομα</span>
                    <span class="stat-icon">🌾</span>
                </div>
                <div class="stat-value">${field.name}</div>
                <div class="stat-subtitle">${field.location || 'Χωρίς τοποθεσία'}</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">${isAverageMode ? 'Μέσες' : 'Συνολικές'} Συγκομιδές</span>
                    <span class="stat-icon">🫒</span>
                </div>
                <div class="stat-value">${totalHarvests}</div>
                <div class="stat-subtitle">${totalCrates} τελάρα, ${totalOlivesKg} kg</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">Μέση Απόδοση ανά Τελάρο</span>
                    <span class="stat-icon">📦</span>
                </div>
                <div class="stat-value">${avgKgPerCrate} kg</div>
                <div class="stat-subtitle">Μέσος όρος κιλά/τελάρο</div>
            </div>
        </div>
        
        ${(area > 0 || treeCount > 0) ? `
        <div class="stats-grid mt-3">
            ${area > 0 ? `
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">Απόδοση ανά Τελάρο (τ.μ.)</span>
                    <span class="stat-icon">📐</span>
                </div>
                <div class="stat-value">${avgYieldPerStremma !== '-' ? avgYieldPerStremma + ' kg' : '-'}</div>
                <div class="stat-subtitle">${area} τ.μ. συνολικά</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">Τελάρα ανά Τελάρο (τ.μ.)</span>
                    <span class="stat-icon">📊</span>
                </div>
                <div class="stat-value">${avgCratesPerStremma !== '-' ? avgCratesPerStremma : '-'}</div>
                <div class="stat-subtitle">Μέσος όρος τελάρα/τ.μ.</div>
            </div>
            ` : ''}
            
            ${treeCount > 0 ? `
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">Απόδοση ανά Δέντρο</span>
                    <span class="stat-icon">🌳</span>
                </div>
                <div class="stat-value">${avgYieldPerTree !== '-' ? avgYieldPerTree + ' kg' : '-'}</div>
                <div class="stat-subtitle">${treeCount} δέντρα συνολικά</div>
            </div>
            ` : ''}
        </div>
        ` : ''}
        
        <div class="card mt-3">
            <div class="card-header">
                <h3 class="card-title">Στοιχεία Αγροτεμαχίου</h3>
                <p class="card-description">Βασικές πληροφορίες</p>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Όνομα:</strong> ${field.name}</p>
                        <p><strong>Τοποθεσία:</strong> ${field.location || '-'}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Έκταση:</strong> ${area > 0 ? area + ' τ.μ.' : '-'}</p>
                        <p><strong>Αριθμός Δέντρων:</strong> ${treeCount > 0 ? treeCount : '-'}</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card mt-3">
            <div class="card-header">
                <h3 class="card-title">Ιστορικό Συγκομιδών</h3>
                <p class="card-description">${isAverageMode ? 'Όλες οι συγκομιδές (για υπολογισμό μέσου όρου)' : isTotalMode ? 'Όλες οι συγκομιδές από όλες τις περιόδους' : 'Συγκομιδές της επιλεγμένης περιόδου'}</p>
            </div>
            <div class="table-responsive">
                <table class="table" id="field-harvests-table">
                    <thead>
                        <tr>
                            <th>Ημερομηνία</th>
                            <th>Περίοδος</th>
                            <th>Τελάρα</th>
                            <th>Κιλά Ελιών</th>
                            <th>Kg/Τελάρο</th>
                            <th>Σημειώσεις</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${harvests.length === 0 ? 
                            '<tr><td colspan="6" class="text-center">Δεν υπάρχουν συγκομιδές</td></tr>' :
                            harvests.map(h => {
                                const kgPerCrate = h.crates > 0 ? (h.olives_kg / h.crates).toFixed(2) : '-';
                                return `
                                    <tr>
                                        <td>${formatDate(h.harvest_date)}</td>
                                        <td>${h.season_name || '-'}</td>
                                        <td><strong>${h.crates}</strong></td>
                                        <td><strong>${h.olives_kg} kg</strong></td>
                                        <td>${kgPerCrate} kg</td>
                                        <td>${h.notes || '-'}</td>
                                    </tr>
                                `;
                            }).join('')
                        }
                    </tbody>
                </table>
            </div>
        </div>
    `);
                
                // Add event listener for dropdown change
                $('#field-card-season-select').off('change').on('change', function() {
                    const selectedValue = $(this).val();
                    loadFieldCardData(currentFieldId, selectedValue);
                });
            }
        }
    });
}

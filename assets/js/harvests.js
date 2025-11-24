// Harvests Management

let fieldsCache = [];

function loadHarvests() {
    $('#page-content').html(`
        <div class="page-header">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h1 class="page-title">Συγκομιδές</h1>
                    <p class="page-description">Καταχώρηση και διαχείριση συγκομιδών</p>
                </div>
                <button class="btn btn-primary" onclick="showHarvestModal()">
                    ➕ Νέα Συγκομιδή
                </button>
            </div>
        </div>
        
        <div class="card">
            <div class="table-responsive">
                <table class="table" id="harvests-table">
                    <thead>
                        <tr>
                            <th>Ημερομηνία</th>
                            <th>Αγροτεμάχιο</th>
                            <th>Τελάρα</th>
                            <th>Κιλά Ελιών</th>
                            <th>Σημειώσεις</th>
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
        <div id="harvest-modal" class="modal">
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3 class="modal-title" id="harvest-modal-title">Νέα Συγκομιδή</h3>
                    <button class="modal-close" onclick="closeHarvestModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="harvest-form" autocomplete="off">
                        <input type="hidden" id="harvest-id">
                        <div class="form-group">
                            <label class="form-label" for="harvest-field">Αγροτεμάχιο *</label>
                            <select id="harvest-field" class="form-select" autocomplete="off" required>
                                <option value="">Επιλέξτε αγροτεμάχιο</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="harvest-date">Ημερομηνία *</label>
                            <input type="date" id="harvest-date" class="form-control" autocomplete="off" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="harvest-crates">Τελάρα *</label>
                            <input type="number" id="harvest-crates" class="form-control" autocomplete="off" required min="0">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="harvest-kg">Κιλά Ελιών *</label>
                            <input type="number" id="harvest-kg" class="form-control" autocomplete="off" required min="0">
                            <small class="form-text text-muted">Προσυμπληρώνεται αυτόματα (Τελάρα × 22.5), μπορείτε να το αλλάξετε</small>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="harvest-notes">Σημειώσεις</label>
                            <textarea id="harvest-notes" class="form-control" rows="3" autocomplete="off"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeHarvestModal()">Ακύρωση</button>
                    <button class="btn btn-primary" onclick="saveHarvest()">Αποθήκευση</button>
                </div>
            </div>
        </div>
    `);
    
    loadFieldsForSelect();
    loadHarvestsData();
    
    // Auto-calculate olives kg when crates change
    $(document).on('input', '#harvest-crates', function() {
        const crates = parseFloat($(this).val()) || 0;
        const kg = Math.round(crates * 22.5);
        $('#harvest-kg').val(kg);
    });
}

function loadFieldsForSelect() {
    $.ajax({
        url: 'api/fields.php?action=list',
        method: 'GET',
        success: function(response) {
            if (response.success) {
                fieldsCache = response.data;
                const options = response.data.map(field => 
                    `<option value="${field.id}">${field.name}</option>`
                ).join('');
                $('#harvest-field').append(options);
            }
        }
    });
}

function loadHarvestsData() {
    const seasonId = getSeasonId();
    if (!seasonId) {
        $('#harvests-table tbody').html('<tr><td colspan="6" class="text-center">Δεν υπάρχει ενεργή περίοδος</td></tr>');
        return;
    }
    
    $.ajax({
        url: `api/harvests.php?action=list&season_id=${seasonId}`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                displayHarvests(response.data);
            }
        }
    });
}

function displayHarvests(harvests) {
    const mobileConfig = {
        getHeader: (h) => formatDate(h.harvest_date),
        fields: [
            { label: 'Αγροτεμάχιο', getValue: (h) => h.field_name },
            { label: 'Τελάρα', getValue: (h) => h.crates },
            { label: 'Κιλά Ελιών', getValue: (h) => h.olives_kg + 'kg' },
            { label: 'Σημειώσεις', getValue: (h) => h.notes || '-' }
        ],
        actions: [
            {
                label: '✏️ Επεξεργασία',
                className: 'btn-secondary btn-sm',
                getOnClick: (h) => `editHarvest(${JSON.stringify(h).replace(/"/g, '&quot;')})`
            },
            {
                label: '🗑️ Διαγραφή',
                className: 'btn-secondary btn-sm',
                getOnClick: (h) => `deleteHarvest(${h.id})`
            }
        ]
    };
    
    updateTableDisplay('#harvests-table', harvests, displayHarvestsTable, mobileConfig);
}

function displayHarvestsTable(harvests) {
    if (harvests.length === 0) {
        $('#harvests-table tbody').html('<tr><td colspan="6" class="text-center">Δεν υπάρχουν συγκομιδές</td></tr>');
        return;
    }
    
    const rows = harvests.map(harvest => `
        <tr>
            <td>${formatDate(harvest.harvest_date)}</td>
            <td><strong>${harvest.field_name}</strong></td>
            <td>${harvest.crates}</td>
            <td>${harvest.olives_kg}kg</td>
            <td>${harvest.notes || '-'}</td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick='editHarvest(${JSON.stringify(harvest)})'>
                    ✏️
                </button>
                <button class="btn btn-secondary btn-sm" onclick="deleteHarvest(${harvest.id})">
                    🗑️
                </button>
            </td>
        </tr>
    `).join('');
    
    $('#harvests-table tbody').html(rows);
}

function showHarvestModal(harvest = null) {
    if (harvest) {
        $('#harvest-modal-title').text('Επεξεργασία Συγκομιδής');
        $('#harvest-id').val(harvest.id);
        $('#harvest-field').val(harvest.field_id);
        $('#harvest-date').val(harvest.harvest_date);
        $('#harvest-crates').val(harvest.crates);
        $('#harvest-kg').val(harvest.olives_kg);
        $('#harvest-notes').val(harvest.notes || '');
    } else {
        $('#harvest-modal-title').text('Νέα Συγκομιδή');
        $('#harvest-form')[0].reset();
        $('#harvest-id').val('');
        $('#harvest-date').val(new Date().toISOString().split('T')[0]);
    }
    
    $('#harvest-modal').addClass('show');
}

function closeHarvestModal() {
    $('#harvest-modal').removeClass('show');
}

function editHarvest(harvest) {
    showHarvestModal(harvest);
}

function saveHarvest() {
    const seasonId = getSeasonId();
    if (!seasonId) {
        showAlert('Δεν υπάρχει ενεργή περίοδος', 'danger');
        return;
    }
    
    const id = $('#harvest-id').val();
    const data = {
        field_id: parseInt($('#harvest-field').val()),
        season_id: seasonId,
        harvest_date: $('#harvest-date').val(),
        crates: parseInt($('#harvest-crates').val()),
        olives_kg: parseInt($('#harvest-kg').val()),
        notes: $('#harvest-notes').val()
    };
    
    if (id) {
        data.id = parseInt(id);
    }
    
    const action = id ? 'update' : 'create';
    
    $.ajax({
        url: `api/harvests.php?action=${action}`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(response) {
            if (response.success) {
                showAlert('Η συγκομιδή αποθηκεύτηκε επιτυχώς', 'success');
                closeHarvestModal();
                loadHarvestsData();
            } else {
                showAlert(response.error || 'Σφάλμα αποθήκευσης', 'danger');
            }
        }
    });
}

function deleteHarvest(id) {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή τη συγκομιδή;')) {
        return;
    }
    
    $.ajax({
        url: `api/harvests.php?action=delete&id=${id}`,
        method: 'POST',
        success: function(response) {
            if (response.success) {
                showAlert('Η συγκομιδή διαγράφηκε επιτυχώς', 'success');
                loadHarvestsData();
            } else {
                showAlert(response.error || 'Σφάλμα διαγραφής', 'danger');
            }
        }
    });
}

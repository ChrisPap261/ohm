// Mill Processing Management

function loadMill() {
    $('#page-content').html(`
        <div class="page-header">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h1 class="page-title">Ελαιοτριβείο</h1>
                    <p class="page-description">Καταχώρηση επεξεργασίας στο ελαιοτριβείο</p>
                </div>
                <button class="btn btn-primary" onclick="showMillModal()">
                    ➕ Νέα Επεξεργασία
                </button>
            </div>
        </div>
        
        <div class="card">
            <div class="table-responsive">
                <table class="table" id="mill-table">
                    <thead>
                        <tr>
                            <th>Ημερομηνία</th>
                            <th>Τελάρα</th>
                            <th>Κιλά Ελιών</th>
                            <th>Κιλά Λαδιού</th>
                            <th>Κόστος</th>
                            <th>Απόδοση</th>
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
        <div id="mill-modal" class="modal">
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3 class="modal-title" id="mill-modal-title">Νέα Επεξεργασία</h3>
                    <button class="modal-close" onclick="closeMillModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="mill-form" autocomplete="off">
                        <input type="hidden" id="mill-id">
                        <div class="form-group">
                            <label class="form-label" for="mill-date">Ημερομηνία *</label>
                            <input type="date" id="mill-date" class="form-control" autocomplete="off" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="mill-crates">Τελάρα</label>
                            <input type="number" id="mill-crates" class="form-control" autocomplete="off" min="0">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="mill-olives-kg">Κιλά Ελιών *</label>
                            <input type="number" id="mill-olives-kg" class="form-control" autocomplete="off" required min="0">
                            <small class="form-text text-muted">Προσυμπληρώνεται αυτόματα (Τελάρα × 22.5), μπορείτε να το αλλάξετε</small>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="mill-oil-kg">Κιλά Λαδιού *</label>
                            <input type="number" id="mill-oil-kg" class="form-control" autocomplete="off" required min="0">
                            <small class="form-text text-muted">Λίτρα = Κιλά × 1.1</small>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="mill-expenses">Κόστος (€) *</label>
                            <input type="number" id="mill-expenses" class="form-control" autocomplete="off" required min="0" step="0.01">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="mill-notes">Σημειώσεις</label>
                            <textarea id="mill-notes" class="form-control" rows="3" autocomplete="off"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeMillModal()">Ακύρωση</button>
                    <button class="btn btn-primary" onclick="saveMill()">Αποθήκευση</button>
                </div>
            </div>
        </div>
    `);
    
    loadMillData();
}

function loadMillData() {
    const seasonId = getSeasonId();
    if (!seasonId) {
        $('#mill-table tbody').html('<tr><td colspan="7" class="text-center">Δεν υπάρχει ενεργή περίοδος</td></tr>');
        return;
    }
    
    $.ajax({
        url: `api/mill.php?action=list&season_id=${seasonId}`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                displayMill(response.data);
            }
        }
    });
}

function displayMill(records) {
    const mobileConfig = {
        getHeader: (r) => formatDate(r.processing_date),
        fields: [
            { label: 'Τελάρα', getValue: (r) => r.crates || '-' },
            { label: 'Κιλά Ελιών', getValue: (r) => r.olives_kg + 'kg' },
            { label: 'Κιλά Λαδιού', getValue: (r) => r.oil_kg + 'kg (' + (r.oil_kg * 1.1).toFixed(0) + 'L)' },
            { label: 'Κόστος', getValue: (r) => formatCurrency(r.expenses) },
            { label: 'Απόδοση', getValue: (r) => {
                const ratio = r.oil_kg > 0 ? (r.olives_kg / r.oil_kg).toFixed(1) : 0;
                return ratio + ':1';
            }},
            { label: 'Σημειώσεις', getValue: (r) => r.notes || '-' }
        ],
        actions: [
            {
                label: '✏️ Επεξεργασία',
                className: 'btn-secondary btn-sm',
                getOnClick: (r) => `editMill(${JSON.stringify(r).replace(/"/g, '&quot;')})`
            },
            {
                label: '🗑️ Διαγραφή',
                className: 'btn-danger btn-sm',
                getOnClick: (r) => `deleteMill(${r.id})`
            }
        ]
    };
    
    updateTableDisplay('#mill-table', records, displayMillTable, mobileConfig);
}

function displayMillTable(records) {
    if (records.length === 0) {
        $('#mill-table tbody').html('<tr><td colspan="8" class="text-center">Δεν υπάρχουν καταχωρήσεις</td></tr>');
        return;
    }
    
    const rows = records.map(record => {
        const ratio = record.oil_kg > 0 ? (record.olives_kg / record.oil_kg).toFixed(1) : 0;
        const liters = (record.oil_kg * 1.1).toFixed(0);
        return `
            <tr>
                <td>${formatDate(record.processing_date)}</td>
                <td>${record.crates || '-'}</td>
                <td>${record.olives_kg}kg</td>
                <td><strong>${record.oil_kg}kg</strong> (${liters}L)</td>
                <td>${formatCurrency(record.expenses)}</td>
                <td>${ratio}:1</td>
                <td>${record.notes || '-'}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick='editMill(${JSON.stringify(record)})'>
                        ✏️
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteMill(${record.id})">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    $('#mill-table tbody').html(rows);
}

function showMillModal(record = null) {
    if (record) {
        $('#mill-modal-title').text('Επεξεργασία Επεξεργασίας');
        $('#mill-id').val(record.id);
        $('#mill-date').val(record.processing_date);
        $('#mill-crates').val(record.crates || '');
        $('#mill-olives-kg').val(record.olives_kg);
        $('#mill-oil-kg').val(record.oil_kg);
        $('#mill-expenses').val(record.expenses / 100);
        $('#mill-notes').val(record.notes || '');
    } else {
        $('#mill-modal-title').text('Νέα Επεξεργασία');
        $('#mill-form')[0].reset();
        $('#mill-id').val('');
        $('#mill-date').val(new Date().toISOString().split('T')[0]);
    }
    
    // Auto-calculation: Crates × 22.5 = Olives kg
    $('#mill-crates').off('input').on('input', function() {
        const crates = parseInt($(this).val()) || 0;
        if (crates > 0) {
            $('#mill-olives-kg').val(crates * 22.5);
        }
    });
    
    $('#mill-modal').addClass('show');
}

function closeMillModal() {
    $('#mill-modal').removeClass('show');
}

function editMill(record) {
    showMillModal(record);
}

function saveMill() {
    const seasonId = getSeasonId();
    if (!seasonId) {
        showAlert('Δεν υπάρχει ενεργή περίοδος', 'danger');
        return;
    }
    
    const id = $('#mill-id').val();
    const crates = $('#mill-crates').val();
    const data = {
        season_id: seasonId,
        processing_date: $('#mill-date').val(),
        crates: crates ? parseInt(crates) : null,
        olives_kg: parseInt($('#mill-olives-kg').val()),
        oil_kg: parseInt($('#mill-oil-kg').val()),
        expenses: Math.round(parseFloat($('#mill-expenses').val()) * 100),
        notes: $('#mill-notes').val()
    };
    
    if (id) {
        data.id = parseInt(id);
    }
    
    const action = id ? 'update' : 'create';
    
    $.ajax({
        url: `api/mill.php?action=${action}`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(response) {
            if (response.success) {
                showAlert('Η επεξεργασία αποθηκεύτηκε επιτυχώς', 'success');
                closeMillModal();
                loadMillData();
            } else {
                showAlert(response.error || 'Σφάλμα αποθήκευσης', 'danger');
            }
        }
    });
}

function deleteMill(id) {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την επεξεργασία;')) {
        return;
    }
    
    $.ajax({
        url: `api/mill.php?action=delete&id=${id}`,
        method: 'POST',
        success: function(response) {
            if (response.success) {
                showAlert('Η επεξεργασία διαγράφηκε επιτυχώς', 'success');
                loadMillData();
            } else {
                showAlert(response.error || 'Σφάλμα διαγραφής', 'danger');
            }
        }
    });
}

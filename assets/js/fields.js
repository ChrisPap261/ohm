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
                    <form id="field-form">
                        <input type="hidden" id="field-id">
                        <div class="form-group">
                            <label class="form-label" for="field-name">Όνομα *</label>
                            <input type="text" id="field-name" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="field-location">Τοποθεσία</label>
                            <input type="text" id="field-location" class="form-control">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="field-area">Έκταση (τ.μ.)</label>
                            <input type="number" id="field-area" class="form-control">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="field-tree-count">Αριθμός Δέντρων</label>
                            <input type="number" id="field-tree-count" class="form-control">
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
                label: '✏️ Επεξεργασία',
                className: 'btn-secondary btn-sm',
                getOnClick: (f) => `editField(${JSON.stringify(f).replace(/"/g, '&quot;')})`
            },
            {
                label: '🗑️ Διαγραφή',
                className: 'btn-danger btn-sm',
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
                <button class="btn btn-secondary btn-sm" onclick='editField(${JSON.stringify(field)})'>
                    ✏️ Επεξεργασία
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteField(${field.id})">
                    🗑️ Διαγραφή
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

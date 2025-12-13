// Olive Sales Management

function loadOliveSales() {
    $('#page-content').html(`
        <div class="page-header">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h1 class="page-title">Πωλήσεις Ελιών</h1>
                    <p class="page-description">Διαχείριση πωλήσεων ελιών</p>
                </div>
                <button class="btn btn-primary" onclick="showOliveSaleModal()">
                    ➕ Νέα Πώληση
                </button>
            

        <style>
            .status-toggle {
                display: inline-flex;
                align-items: center;
                gap: 0.35rem;
                font-size: 0.85rem;
                white-space: nowrap;
            }
            .status-toggle .switch {
                position: relative;
                display: inline-block;
                width: 36px;
                height: 20px;
            }
            .status-toggle .switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            .status-toggle .slider {
                position: absolute;
                cursor: pointer;
                inset: 0;
                background-color: #ccc;
                border-radius: 34px;
                transition: .2s;
            }
            .status-toggle .slider:before {
                position: absolute;
                content: "";
                height: 14px;
                width: 14px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                border-radius: 50%;
                transition: .2s;
            }
            .status-toggle input:checked + .slider {
                background-color: var(--success, #28a745);
            }
            .status-toggle input:checked + .slider:before {
                transform: translateX(16px);
            }
            .status-toggle .slider.round {
                border-radius: 34px;
            }
        </style>
</div>
        </div>
        
        <div class="card">
            <div class="table-responsive">
                <table class="table" id="olive-sales-table">
                    <thead>
                        <tr>
                            <th>Ημερομηνία</th>
                            <th>Κιλά Ελιών</th>
                            <th>Τιμή</th>
                            <th>Σύνολο</th>
                            <th>Αγοραστής</th>
                            <th>Σημειώσεις</th>
                            <th>Παραδόθηκε</th>
                            <th>Πληρώθηκε</th>
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
        <div id="olive-sale-modal" class="modal">
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3 class="modal-title" id="olive-sale-modal-title">Νέα Πώληση Ελιών</h3>
                    <button class="modal-close" onclick="closeOliveSaleModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="olive-sale-form" autocomplete="off">
                        <input type="hidden" id="olive-sale-id">
                        <div class="form-group">
                            <label class="form-label" for="olive-sale-date">Ημερομηνία *</label>
                            <input type="date" id="olive-sale-date" class="form-control" autocomplete="off" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="olive-sale-kg">Κιλά Ελιών *</label>
                            <input type="number" id="olive-sale-kg" class="form-control" autocomplete="off" required min="0">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="olive-sale-price">Τιμή ανά Κιλό (€) *</label>
                            <input type="number" id="olive-sale-price" class="form-control" autocomplete="off" required min="0" step="0.01">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="olive-sale-customer">Αγοραστής</label>
                            <input type="hidden" id="olive-sale-customer-id">
                            <input type="text" id="olive-sale-customer" class="form-control" placeholder="Πληκτρολογήστε για αναζήτηση..." autocomplete="off">
                            <div id="olive-customer-dropdown" class="autocomplete-dropdown" style="display: none;"></div>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="olive-sale-notes">Σημειώσεις</label>
                            <textarea id="olive-sale-notes" class="form-control" rows="3" autocomplete="off"></textarea>
                        </div>
                    
                        <div class="form-group">
                            <label class="form-label">Κατάσταση</label>
                            <div class="d-flex" style="gap: 1.5rem; flex-wrap: wrap;">
                                <label class="status-toggle">
                                    <span>Παραδόθηκε</span>
                                    <span>
                                        <label class="switch">
                                            <input type="checkbox" id="olive-sale-delivered">
                                            <span class="slider round"></span>
                                        </label>
                                    </span>
                                </label>
                                <label class="status-toggle">
                                    <span>Πληρώθηκε</span>
                                    <span>
                                        <label class="switch">
                                            <input type="checkbox" id="olive-sale-paid">
                                            <span class="slider round"></span>
                                        </label>
                                    </span>
                                </label>
                            </div>
                        </div>
</form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeOliveSaleModal()">Ακύρωση</button>
                    <button class="btn btn-primary" onclick="saveOliveSale()">Αποθήκευση</button>
                </div>
            </div>
        </div>
    `);
    
    loadOliveSalesData();
}

function loadOliveSalesData() {
    const seasonId = getSeasonId();
    if (!seasonId) {
        $('#olive-sales-table tbody').html('<tr><td colspan="9" class="text-center">Δεν υπάρχει ενεργή περίοδος</td></tr>');
        return;
    }
    
    $.ajax({
        url: `api/olive_sales.php?action=list&season_id=${seasonId}`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                displayOliveSales(response.data);
            }
        }
    });
}

function displayOliveSales(sales) {
    const mobileConfig = {
        getHeader: (s) => formatDate(s.sale_date),
        fields: [
            { label: 'Κιλά Ελιών', getValue: (s) => s.olives_kg + ' kg' },
            { label: 'Τιμή/Κιλό', getValue: (s) => formatCurrency(s.price_per_kg) },
            { label: 'Σύνολο', getValue: (s) => formatCurrency(s.total_amount) },
            { label: 'Αγοραστής', getValue: (s) => s.customer_name || s.buyer || '-' },
            { label: 'Παραδόθηκε', getValue: (s) => s.delivered ? 'Ναι' : 'Όχι' },
            { label: 'Πληρώθηκε', getValue: (s) => s.paid ? 'Ναι' : 'Όχι' },
            { label: 'Σημειώσεις', getValue: (s) => s.notes || '-' }
        ],
        actions: [
            {
                label: '✏️ Επεξεργασία',
                className: 'btn-secondary btn-sm',
                getOnClick: (s) => `editOliveSale(${JSON.stringify(s).replace(/"/g, '&quot;')})`
            },
            {
                label: '🗑️ Διαγραφή',
                className: 'btn-secondary btn-sm',
                getOnClick: (s) => `deleteOliveSale(${s.id})`
            }
        ]
    };
    
    updateTableDisplay('#olive-sales-table', sales, displayOliveSalesTable, mobileConfig);
}


function getOliveSaleStatusToggle(sale, field, label) {
    const checked = sale[field] ? 'checked' : '';
    const id = `olive-sale-${field}-${sale.id}`;
    return `
        <div class="status-toggle">
            <label class="switch">
                <input type="checkbox" id="${id}" ${checked} onchange="toggleOliveSaleStatus(${sale.id}, '${field}', this.checked)">
                <span class="slider round"></span>
            </label>
            <span>${label}</span>
        </div>
    `;
}

function toggleOliveSaleStatus(id, field, checked) {
    const validFields = ['delivered', 'paid'];
    if (!validFields.includes(field)) {
        return;
    }
    $.ajax({
        url: 'api/olive_sales.php?action=update_status',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            id: id,
            field: field,
            value: checked ? 1 : 0
        }),
        success: function(response) {
            if (!response.success) {
                showAlert(response.error || 'Σφάλμα ενημέρωσης κατάστασης', 'danger');
                // Reload data to revert UI
                loadOliveSalesData();
            }
        },
        error: function() {
            showAlert('Σφάλμα ενημέρωσης κατάστασης', 'danger');
            loadOliveSalesData();
        }
    });
}

function displayOliveSalesTable(sales) {
    if (sales.length === 0) {
        $('#olive-sales-table tbody').html('<tr><td colspan="9" class="text-center">Δεν υπάρχουν πωλήσεις</td></tr>');
        return;
    }
    
    const rows = sales.map(sale => {
        const deliveredToggle = getOliveSaleStatusToggle(sale, 'delivered', 'Παραδόθηκε');
        const paidToggle = getOliveSaleStatusToggle(sale, 'paid', 'Πληρώθηκε');
        return `
        <tr>
            <td>${formatDate(sale.sale_date)}</td>
            <td><strong>${sale.olives_kg} kg</strong></td>
            <td>${formatCurrency(sale.price_per_kg)}/κιλό</td>
            <td style="color: var(--success); font-weight: 600;">${formatCurrency(sale.total_amount)}</td>
            <td>${sale.customer_name || sale.buyer || '-'}</td>
            <td>${sale.notes || '-'}</td>
            <td>${deliveredToggle}</td>
            <td>${paidToggle}</td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick='editOliveSale(${JSON.stringify(sale)})'>
                    ✏️
                </button>
                <button class="btn btn-secondary btn-sm" onclick="deleteOliveSale(${sale.id})">
                    🗑️
                </button>
            </td>
        </tr>
    `;
    }).join('');
    
    $('#olive-sales-table tbody').html(rows);
}

let allOliveCustomers = [];

function showOliveSaleModal(sale = null) {
    // Load customers for autocomplete
    $.ajax({
        url: 'api/customers.php?action=list',
        method: 'GET',
        success: function(response) {
            if (response.success) {
                allOliveCustomers = response.data;
            }
        }
    });
    
    if (sale) {
        $('#olive-sale-modal-title').text('Επεξεργασία Πώλησης');
        $('#olive-sale-id').val(sale.id);
        $('#olive-sale-date').val(sale.sale_date);
        $('#olive-sale-kg').val(sale.olives_kg);
        $('#olive-sale-price').val(sale.price_per_kg / 100);
        $('#olive-sale-customer-id').val(sale.customer_id || '');
        $('#olive-sale-customer').val(sale.customer_name || sale.buyer || '');
        $('#olive-sale-notes').val(sale.notes || '');
        $('#olive-sale-delivered').prop('checked', !!sale.delivered);
        $('#olive-sale-paid').prop('checked', !!sale.paid);
    } else {
        $('#olive-sale-modal-title').text('Νέα Πώληση Ελιών');
        $('#olive-sale-form')[0].reset();
        $('#olive-sale-id').val('');
        $('#olive-sale-customer-id').val('');
        $('#olive-sale-date').val(new Date().toISOString().split('T')[0]);
        $('#olive-sale-delivered').prop('checked', false);
        $('#olive-sale-paid').prop('checked', false);
    }
    
    // Setup autocomplete
    setupOliveCustomerAutocomplete();
    
    $('#olive-sale-modal').addClass('show');
}

function setupOliveCustomerAutocomplete() {
    $('#olive-sale-customer').off('input').on('input', function() {
        const query = $(this).val().toLowerCase();
        
        if (query.length < 1) {
            $('#olive-customer-dropdown').hide();
            return;
        }
        
        const filtered = allOliveCustomers.filter(c => 
            c.name.toLowerCase().includes(query)
        );
        
        if (filtered.length === 0) {
            $('#olive-customer-dropdown').hide();
            return;
        }
        
        const items = filtered.map(c => `
            <div class="autocomplete-item" data-id="${c.id}" data-name="${c.name}">
                <strong>${c.name}</strong>
                ${c.phone ? '<br><small>' + c.phone + '</small>' : ''}
            </div>
        `).join('');
        
        $('#olive-customer-dropdown').html(items).show();
        
        $('.autocomplete-item').off('click').on('click', function() {
            const id = $(this).data('id');
            const name = $(this).data('name');
            $('#olive-sale-customer-id').val(id);
            $('#olive-sale-customer').val(name);
            $('#olive-customer-dropdown').hide();
        });
    });
    
    // Hide dropdown when clicking outside
    $(document).off('click.olive-customer-autocomplete').on('click.olive-customer-autocomplete', function(e) {
        if (!$(e.target).closest('#olive-sale-customer, #olive-customer-dropdown').length) {
            $('#olive-customer-dropdown').hide();
        }
    });
}

function closeOliveSaleModal() {
    $('#olive-sale-modal').removeClass('show');
}

function editOliveSale(sale) {
    showOliveSaleModal(sale);
}

function saveOliveSale() {
    const seasonId = getSeasonId();
    if (!seasonId) {
        showAlert('Δεν υπάρχει ενεργή περίοδος', 'danger');
        return;
    }
    
    const id = $('#olive-sale-id').val();
    const customerId = $('#olive-sale-customer-id').val();
    const data = {
        season_id: seasonId,
        sale_date: $('#olive-sale-date').val(),
        olives_kg: parseInt($('#olive-sale-kg').val()),
        price_per_kg: Math.round(parseFloat($('#olive-sale-price').val()) * 100),
        customer_id: customerId ? parseInt(customerId) : null,
        buyer: $('#olive-sale-customer').val(),
        notes: $('#olive-sale-notes').val(),
        delivered: $('#olive-sale-delivered').is(':checked') ? 1 : 0,
        paid: $('#olive-sale-paid').is(':checked') ? 1 : 0
    };
    
    if (id) {
        data.id = parseInt(id);
    }
    
    const action = id ? 'update' : 'create';
    
    $.ajax({
        url: `api/olive_sales.php?action=${action}`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(response) {
            if (response.success) {
                showAlert('Η πώληση αποθηκεύτηκε επιτυχώς', 'success');
                closeOliveSaleModal();
                loadOliveSalesData();
            } else {
                showAlert(response.error || 'Σφάλμα αποθήκευσης', 'danger');
            }
        }
    });
}

function deleteOliveSale(id) {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την πώληση;')) {
        return;
    }
    
    $.ajax({
        url: `api/olive_sales.php?action=delete&id=${id}`,
        method: 'POST',
        success: function(response) {
            if (response.success) {
                showAlert('Η πώληση διαγράφηκε επιτυχώς', 'success');
                loadOliveSalesData();
            } else {
                showAlert(response.error || 'Σφάλμα διαγραφής', 'danger');
            }
        }
    });
}

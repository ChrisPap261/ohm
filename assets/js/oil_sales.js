// Oil Sales Management

function loadOilSales() {
    $('#page-content').html(`
        <div class="page-header">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h1 class="page-title">Πωλήσεις Λαδιού</h1>
                    <p class="page-description">Διαχείριση πωλήσεων λαδιού</p>
                </div>
                <button class="btn btn-primary" onclick="showOilSaleModal()">
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
                <table class="table" id="oil-sales-table">
                    <thead>
                        <tr>
                            <th>Ημερομηνία</th>
                            <th>Λίτρα</th>
                            <th>Τιμή/Λίτρο</th>
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
        <div id="oil-sale-modal" class="modal">
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3 class="modal-title" id="oil-sale-modal-title">Νέα Πώληση Λαδιού</h3>
                    <button class="modal-close" onclick="closeOilSaleModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="oil-sale-form" autocomplete="off">
                        <input type="hidden" id="oil-sale-id">
                        <div class="form-group">
                            <label class="form-label" for="oil-sale-date">Ημερομηνία *</label>
                            <input type="date" id="oil-sale-date" class="form-control" autocomplete="off" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="oil-sale-liters">Λίτρα Λαδιού *</label>
                            <input type="number" id="oil-sale-liters" class="form-control" autocomplete="off" required min="0">
                            <small class="form-text text-muted">Κιλά = Λίτρα ÷ 1.1</small>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="oil-sale-price">Τιμή ανά Λίτρο (€) *</label>
                            <input type="number" id="oil-sale-price" class="form-control" autocomplete="off" required min="0" step="0.01">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="oil-sale-customer">Αγοραστής</label>
                            <input type="hidden" id="oil-sale-customer-id">
                            <input type="text" id="oil-sale-customer" class="form-control" placeholder="Πληκτρολογήστε για αναζήτηση..." autocomplete="off">
                            <div id="customer-dropdown" class="autocomplete-dropdown" style="display: none;"></div>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="oil-sale-notes">Σημειώσεις</label>
                            <textarea id="oil-sale-notes" class="form-control" rows="3" autocomplete="off"></textarea>
                        </div>
                    
                        <div class="form-group">
                            <label class="form-label">Κατάσταση</label>
                            <div class="d-flex" style="gap: 1.5rem; flex-wrap: wrap;">
                                <label class="status-toggle">
                                    <span>Παραδόθηκε</span>
                                    <span>
                                        <label class="switch">
                                            <input type="checkbox" id="oil-sale-delivered">
                                            <span class="slider round"></span>
                                        </label>
                                    </span>
                                </label>
                                <label class="status-toggle">
                                    <span>Πληρώθηκε</span>
                                    <span>
                                        <label class="switch">
                                            <input type="checkbox" id="oil-sale-paid">
                                            <span class="slider round"></span>
                                        </label>
                                    </span>
                                </label>
                            </div>
                        </div>
</form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeOilSaleModal()">Ακύρωση</button>
                    <button class="btn btn-primary" onclick="saveOilSale()">Αποθήκευση</button>
                </div>
            </div>
        </div>
    `);
    
    loadOilSalesData();
}

function loadOilSalesData() {
    const seasonId = getSeasonId();
    if (!seasonId) {
        $('#oil-sales-table tbody').html('<tr><td colspan="9" class="text-center">Δεν υπάρχει ενεργή περίοδος</td></tr>');
        return;
    }
    
    $.ajax({
        url: `api/oil_sales.php?action=list&season_id=${seasonId}`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                displayOilSales(response.data);
            }
        }
    });
}

function displayOilSales(sales) {
    const mobileConfig = {
        getHeader: (s) => formatDate(s.sale_date),
        fields: [
            { label: 'Λίτρα Λαδιού', getValue: (s) => s.oil_liters + 'L (' + (s.oil_liters / 1.1).toFixed(0) + 'kg)' },
            { label: 'Τιμή/Λίτρο', getValue: (s) => formatCurrency(s.price_per_liter) },
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
                getOnClick: (s) => `editOilSale(${JSON.stringify(s).replace(/"/g, '&quot;')})`
            },
            {
                label: '🗑️ Διαγραφή',
                className: 'btn-danger btn-sm',
                getOnClick: (s) => `deleteOilSale(${s.id})`
            }
        ]
    };
    
    updateTableDisplay('#oil-sales-table', sales, displayOilSalesTable, mobileConfig);
}


function getOilSaleStatusToggle(sale, field, label) {
    const checked = sale[field] ? 'checked' : '';
    const id = `oil-sale-${field}-${sale.id}`;
    return `
        <div class="status-toggle">
            <label class="switch">
                <input type="checkbox" id="${id}" ${checked} onchange="toggleOilSaleStatus(${sale.id}, '${field}', this.checked)">
                <span class="slider round"></span>
            </label>
            <span>${label}</span>
        </div>
    `;
}

function toggleOilSaleStatus(id, field, checked) {
    const validFields = ['delivered', 'paid'];
    if (!validFields.includes(field)) {
        return;
    }
    $.ajax({
        url: 'api/oil_sales.php?action=update_status',
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
                loadOilSalesData();
            }
        },
        error: function() {
            showAlert('Σφάλμα ενημέρωσης κατάστασης', 'danger');
            loadOilSalesData();
        }
    });
}

function displayOilSalesTable(sales) {
    if (sales.length === 0) {
        $('#oil-sales-table tbody').html('<tr><td colspan="9" class="text-center">Δεν υπάρχουν πωλήσεις</td></tr>');
        return;
    }
    
    const rows = sales.map(sale => {
        const kg = (sale.oil_liters / 1.1).toFixed(0);
        const deliveredToggle = getOilSaleStatusToggle(sale, 'delivered', 'Παραδόθηκε');
        const paidToggle = getOilSaleStatusToggle(sale, 'paid', 'Πληρώθηκε');
        return `
        <tr>
            <td>${formatDate(sale.sale_date)}</td>
            <td><strong>${sale.oil_liters}L</strong> (${kg}kg)</td>
            <td>${formatCurrency(sale.price_per_liter)}/λίτρο</td>
            <td style="color: var(--success); font-weight: 600;">${formatCurrency(sale.total_amount)}</td>
            <td>${sale.customer_name || sale.buyer || '-'}</td>
            <td>${sale.notes || '-'}</td>
            <td>${deliveredToggle}</td>
            <td>${paidToggle}</td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick='editOilSale(${JSON.stringify(sale)})'>
                    ✏️
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteOilSale(${sale.id})">
                    🗑️
                </button>
            </td>
        </tr>
    `;
    }).join('');
    
    $('#oil-sales-table tbody').html(rows);
}

let allCustomers = [];

function showOilSaleModal(sale = null) {
    // Load customers for autocomplete
    $.ajax({
        url: 'api/customers.php?action=list',
        method: 'GET',
        success: function(response) {
            if (response.success) {
                allCustomers = response.data;
            }
        }
    });
    
    if (sale) {
        $('#oil-sale-modal-title').text('Επεξεργασία Πώλησης');
        $('#oil-sale-id').val(sale.id);
        $('#oil-sale-date').val(sale.sale_date);
        $('#oil-sale-liters').val(sale.oil_liters);
        $('#oil-sale-price').val(sale.price_per_liter / 100);
        $('#oil-sale-customer-id').val(sale.customer_id || '');
        $('#oil-sale-customer').val(sale.customer_name || sale.buyer || '');
        $('#oil-sale-notes').val(sale.notes || '');
        $('#oil-sale-delivered').prop('checked', !!sale.delivered);
        $('#oil-sale-paid').prop('checked', !!sale.paid);
    } else {
        $('#oil-sale-modal-title').text('Νέα Πώληση Λαδιού');
        $('#oil-sale-form')[0].reset();
        $('#oil-sale-id').val('');
        $('#oil-sale-customer-id').val('');
        $('#oil-sale-date').val(new Date().toISOString().split('T')[0]);
        $('#oil-sale-delivered').prop('checked', false);
        $('#oil-sale-paid').prop('checked', false);
    }
    
    // Setup autocomplete
    setupCustomerAutocomplete();
    
    $('#oil-sale-modal').addClass('show');
}

function setupCustomerAutocomplete() {
    $('#oil-sale-customer').off('input').on('input', function() {
        const query = $(this).val().toLowerCase();
        
        if (query.length < 1) {
            $('#customer-dropdown').hide();
            return;
        }
        
        const filtered = allCustomers.filter(c => 
            c.name.toLowerCase().includes(query)
        );
        
        if (filtered.length === 0) {
            $('#customer-dropdown').hide();
            return;
        }
        
        const items = filtered.map(c => `
            <div class="autocomplete-item" data-id="${c.id}" data-name="${c.name}">
                <strong>${c.name}</strong>
                ${c.phone ? '<br><small>' + c.phone + '</small>' : ''}
            </div>
        `).join('');
        
        $('#customer-dropdown').html(items).show();
        
        $('.autocomplete-item').off('click').on('click', function() {
            const id = $(this).data('id');
            const name = $(this).data('name');
            $('#oil-sale-customer-id').val(id);
            $('#oil-sale-customer').val(name);
            $('#customer-dropdown').hide();
        });
    });
    
    // Hide dropdown when clicking outside
    $(document).off('click.customer-autocomplete').on('click.customer-autocomplete', function(e) {
        if (!$(e.target).closest('#oil-sale-customer, #customer-dropdown').length) {
            $('#customer-dropdown').hide();
        }
    });
}

function closeOilSaleModal() {
    $('#oil-sale-modal').removeClass('show');
}

function editOilSale(sale) {
    showOilSaleModal(sale);
}

function saveOilSale() {
    const seasonId = getSeasonId();
    if (!seasonId) {
        showAlert('Δεν υπάρχει ενεργή περίοδος', 'danger');
        return;
    }
    
    const id = $('#oil-sale-id').val();
    const customerId = $('#oil-sale-customer-id').val();
    const data = {
        season_id: seasonId,
        sale_date: $('#oil-sale-date').val(),
        oil_liters: parseInt($('#oil-sale-liters').val()),
        price_per_liter: Math.round(parseFloat($('#oil-sale-price').val()) * 100),
        customer_id: customerId ? parseInt(customerId) : null,
        buyer: $('#oil-sale-customer').val(),
        notes: $('#oil-sale-notes').val(),
        delivered: $('#oil-sale-delivered').is(':checked') ? 1 : 0,
        paid: $('#oil-sale-paid').is(':checked') ? 1 : 0
    };
    
    if (id) {
        data.id = parseInt(id);
    }
    
    const action = id ? 'update' : 'create';
    
    $.ajax({
        url: `api/oil_sales.php?action=${action}`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(response) {
            if (response.success) {
                showAlert('Η πώληση αποθηκεύτηκε επιτυχώς', 'success');
                closeOilSaleModal();
                loadOilSalesData();
            } else {
                showAlert(response.error || 'Σφάλμα αποθήκευσης', 'danger');
            }
        }
    });
}

function deleteOilSale(id) {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την πώληση;')) {
        return;
    }
    
    $.ajax({
        url: `api/oil_sales.php?action=delete&id=${id}`,
        method: 'POST',
        success: function(response) {
            if (response.success) {
                showAlert('Η πώληση διαγράφηκε επιτυχώς', 'success');
                loadOilSalesData();
            } else {
                showAlert(response.error || 'Σφάλμα διαγραφής', 'danger');
            }
        }
    });
}

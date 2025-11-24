// Customers Management

function loadCustomers() {
    $('#page-content').html(`
        <div class="page-header">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h1 class="page-title">Πελάτες</h1>
                    <p class="page-description">Διαχείριση πελατών</p>
                </div>
                <button class="btn btn-primary" onclick="showCustomerModal()">
                    ➕ Νέος Πελάτης
                </button>
            </div>
        </div>
        
        <div class="card">
            <div class="table-responsive">
                <table class="table" id="customers-table">
                    <thead>
                        <tr>
                            <th>Ονοματεπώνυμο</th>
                            <th>Τηλέφωνο</th>
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
        <div id="customer-modal" class="modal">
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3 class="modal-title" id="customer-modal-title">Νέος Πελάτης</h3>
                    <button class="modal-close" onclick="closeCustomerModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="customer-form" autocomplete="off">
                        <input type="hidden" id="customer-id">
                        <div class="form-group">
                            <label class="form-label" for="customer-name">Ονοματεπώνυμο *</label>
                            <input type="text" id="customer-name" class="form-control" autocomplete="off" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="customer-phone">Τηλέφωνο</label>
                            <input type="tel" id="customer-phone" class="form-control" autocomplete="off">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeCustomerModal()">Ακύρωση</button>
                    <button class="btn btn-primary" onclick="saveCustomer()">Αποθήκευση</button>
                </div>
            </div>
        </div>
    `);
    
    loadCustomersData();
}

function loadCustomersData() {
    $.ajax({
        url: 'api/customers.php?action=list',
        method: 'GET',
        success: function(response) {
            if (response.success) {
                displayCustomers(response.data);
            }
        },
        error: function() {
            showAlert('Σφάλμα κατά τη φόρτωση πελατών', 'danger');
        }
    });
}

function displayCustomers(customers) {
    const mobileConfig = {
        getHeader: (c) => c.name,
        fields: [
            { label: 'Τηλέφωνο', getValue: (c) => c.phone || '-' }
        ],
        actions: [
            {
                label: '👤 Καρτέλα',
                className: 'btn-primary btn-sm',
                getOnClick: (c) => `viewCustomerCard(${c.id})`
            },
            {
                label: '✏️ Επεξεργασία',
                className: 'btn-secondary btn-sm',
                getOnClick: (c) => `editCustomer(${JSON.stringify(c).replace(/"/g, '&quot;')})`
            },
            {
                label: '🗑️ Διαγραφή',
                className: 'btn-secondary btn-sm',
                getOnClick: (c) => `deleteCustomer(${c.id})`
            }
        ]
    };
    
    updateTableDisplay('#customers-table', customers, displayCustomersTable, mobileConfig);
}

function displayCustomersTable(customers) {
    if (customers.length === 0) {
        $('#customers-table tbody').html('<tr><td colspan="3" class="text-center">Δεν υπάρχουν πελάτες</td></tr>');
        return;
    }
    
    const rows = customers.map(customer => `
        <tr>
            <td><strong>${customer.name}</strong></td>
            <td>${customer.phone || '-'}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="viewCustomerCard(${customer.id})">
                    👤 Καρτέλα
                </button>
                <button class="btn btn-secondary btn-sm" onclick='editCustomer(${JSON.stringify(customer)})'>
                    ✏️
                </button>
                <button class="btn btn-secondary btn-sm" onclick="deleteCustomer(${customer.id})">
                    🗑️
                </button>
            </td>
        </tr>
    `).join('');
    
    $('#customers-table tbody').html(rows);
}

function showCustomerModal(customer = null) {
    if (customer) {
        $('#customer-modal-title').text('Επεξεργασία Πελάτη');
        $('#customer-id').val(customer.id);
        $('#customer-name').val(customer.name);
        $('#customer-phone').val(customer.phone || '');
    } else {
        $('#customer-modal-title').text('Νέος Πελάτης');
        $('#customer-form')[0].reset();
        $('#customer-id').val('');
    }
    
    $('#customer-modal').addClass('show');
}

function closeCustomerModal() {
    $('#customer-modal').removeClass('show');
}

function editCustomer(customer) {
    showCustomerModal(customer);
}

function saveCustomer() {
    const id = $('#customer-id').val();
    const data = {
        name: $('#customer-name').val(),
        phone: $('#customer-phone').val()
    };
    
    if (id) {
        data.id = parseInt(id);
    }
    
    const action = id ? 'update' : 'create';
    
    $.ajax({
        url: `api/customers.php?action=${action}`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(response) {
            if (response.success) {
                showAlert('Ο πελάτης αποθηκεύτηκε επιτυχώς', 'success');
                closeCustomerModal();
                loadCustomersData();
            } else {
                showAlert(response.error || 'Σφάλμα κατά την αποθήκευση', 'danger');
            }
        },
        error: function() {
            showAlert('Σφάλμα κατά την αποθήκευση', 'danger');
        }
    });
}

function deleteCustomer(id) {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτόν τον πελάτη;')) {
        return;
    }
    
    $.ajax({
        url: `api/customers.php?action=delete&id=${id}`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                showAlert('Ο πελάτης διαγράφηκε επιτυχώς', 'success');
                loadCustomersData();
            } else {
                showAlert(response.error || 'Σφάλμα κατά τη διαγραφή', 'danger');
            }
        },
        error: function() {
            showAlert('Σφάλμα κατά τη διαγραφή', 'danger');
        }
    });
}

function viewCustomerCard(customerId) {
    $.ajax({
        url: `api/customers.php?action=get&id=${customerId}`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                displayCustomerCard(response.data);
            } else {
                showAlert('Σφάλμα κατά τη φόρτωση καρτέλας πελάτη', 'danger');
            }
        },
        error: function() {
            showAlert('Σφάλμα κατά τη φόρτωση καρτέλας πελάτη', 'danger');
        }
    });
}

function displayCustomerCard(customer) {
    const purchases = customer.purchases || [];
    const totalPurchases = purchases.length;
    const totalAmount = purchases.reduce((sum, p) => sum + p.total_amount, 0);
    const totalLiters = purchases.reduce((sum, p) => sum + p.oil_liters, 0);
    
    $('#page-content').html(`
        <div class="page-header">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h1 class="page-title">Καρτέλα Πελάτη</h1>
                    <p class="page-description">${customer.name}</p>
                </div>
                <button class="btn btn-secondary" onclick="loadCustomers()">
                    ← Πίσω
                </button>
            </div>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">Ονοματεπώνυμο</span>
                    <span class="stat-icon">👤</span>
                </div>
                <div class="stat-value">${customer.name}</div>
                <div class="stat-subtitle">Τηλέφωνο: ${customer.phone || '-'}</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">Συνολικές Αγορές</span>
                    <span class="stat-icon">📦</span>
                </div>
                <div class="stat-value">${totalPurchases}</div>
                <div class="stat-subtitle">${totalLiters}L</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">Συνολικό Ποσό</span>
                    <span class="stat-icon">💰</span>
                </div>
                <div class="stat-value">${formatCurrency(totalAmount)}</div>
                <div class="stat-subtitle">Όλες οι περίοδοι</div>
            </div>
        </div>
        
        <div class="card mt-3">
            <div class="card-header">
                <h3 class="card-title">Ιστορικό Αγορών</h3>
                <p class="card-description">Όλες οι αγορές του πελάτη</p>
            </div>
            <div class="table-responsive">
                <table class="table" id="customer-purchases-table">
                    <thead>
                        <tr>
                            <th>Ημερομηνία</th>
                            <th>Περίοδος</th>
                            <th>Λίτρα</th>
                            <th>Τιμή/Λίτρο</th>
                            <th>Σύνολο</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${purchases.length === 0 ? 
                            '<tr><td colspan="5" class="text-center">Δεν υπάρχουν αγορές</td></tr>' :
                            purchases.map(p => `
                                <tr>
                                    <td>${formatDate(p.sale_date)}</td>
                                    <td>${p.season_name || '-'}</td>
                                    <td><strong>${p.oil_liters}L</strong> (${(p.oil_liters / 1.1).toFixed(0)}kg)</td>
                                    <td>${formatCurrency(p.price_per_liter)}/λίτρο</td>
                                    <td style="color: var(--success); font-weight: 600;">${formatCurrency(p.total_amount)}</td>
                                </tr>
                            `).join('')
                        }
                    </tbody>
                </table>
            </div>
        </div>
    `);
}

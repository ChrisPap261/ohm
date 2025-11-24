// Transactions Management

function loadTransactions() {
    $('#page-content').html(`
        <div class="page-header">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h1 class="page-title">Έσοδα/Έξοδα</h1>
                    <p class="page-description">Διαχείριση οικονομικών συναλλαγών</p>
                </div>
                <button class="btn btn-primary" onclick="showTransactionModal()">
                    ➕ Νέα Συναλλαγή
                </button>
            </div>
        </div>
        
        <div class="card">
            <div class="table-responsive">
                <table class="table" id="transactions-table">
                    <thead>
                        <tr>
                            <th>Ημερομηνία</th>
                            <th>Τύπος</th>
                            <th>Περιγραφή</th>
                            <th>Ποσό</th>
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
        <div id="transaction-modal" class="modal">
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3 class="modal-title" id="transaction-modal-title">Νέα Συναλλαγή</h3>
                    <button class="modal-close" onclick="closeTransactionModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="transaction-form" autocomplete="off">
                        <input type="hidden" id="transaction-id">
                        <div class="form-group">
                            <label class="form-label" for="transaction-type">Τύπος *</label>
                            <select id="transaction-type" class="form-select" autocomplete="off" required>
                                <option value="">Επιλέξτε τύπο</option>
                                <option value="income">Έσοδο</option>
                                <option value="expense">Έξοδο</option>
                                <option value="donation">Δωρεά</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="transaction-date">Ημερομηνία *</label>
                            <input type="date" id="transaction-date" class="form-control" autocomplete="off" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="transaction-description">Περιγραφή *</label>
                            <input type="text" id="transaction-description" class="form-control" autocomplete="off" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="transaction-amount">Ποσό (€) *</label>
                            <input type="number" id="transaction-amount" class="form-control" autocomplete="off" required min="0" step="0.01">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="transaction-notes">Σημειώσεις</label>
                            <textarea id="transaction-notes" class="form-control" rows="3" autocomplete="off"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeTransactionModal()">Ακύρωση</button>
                    <button class="btn btn-primary" onclick="saveTransaction()">Αποθήκευση</button>
                </div>
            </div>
        </div>
    `);
    
    loadTransactionsData();
}

function loadTransactionsData() {
    const seasonId = getSeasonId();
    if (!seasonId) {
        $('#transactions-table tbody').html('<tr><td colspan="6" class="text-center">Δεν υπάρχει ενεργή περίοδος</td></tr>');
        return;
    }
    
    $.ajax({
        url: `api/transactions.php?action=list&season_id=${seasonId}`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                displayTransactions(response.data);
            }
        }
    });
}

function displayTransactions(transactions) {
    const typeLabels = {
        income: 'Έσοδο',
        expense: 'Έξοδο',
        donation: 'Δωρεά'
    };
    
    const typeColors = {
        income: 'color: var(--success)',
        expense: 'color: var(--danger)',
        donation: 'color: var(--info)'
    };
    
    const mobileConfig = {
        getHeader: (t) => formatDate(t.transaction_date),
        fields: [
            { label: 'Τύπος', getValue: (t) => typeLabels[t.type] },
            { label: 'Περιγραφή', getValue: (t) => t.description },
            { label: 'Ποσό', getValue: (t) => formatCurrency(t.amount) },
            { label: 'Σημειώσεις', getValue: (t) => t.notes || '-' }
        ],
        actions: [
            {
                label: '✏️ Επεξεργασία',
                className: 'btn-secondary btn-sm',
                getOnClick: (t) => `editTransaction(${JSON.stringify(t).replace(/"/g, '&quot;')})`
            },
            {
                label: '🗑️ Διαγραφή',
                className: 'btn-secondary btn-sm',
                getOnClick: (t) => `deleteTransaction(${t.id})`
            }
        ]
    };
    
    updateTableDisplay('#transactions-table', transactions, displayTransactionsTable, mobileConfig);
}

function displayTransactionsTable(transactions) {
    if (transactions.length === 0) {
        $('#transactions-table tbody').html('<tr><td colspan="6" class="text-center">Δεν υπάρχουν συναλλαγές</td></tr>');
        return;
    }
    
    const typeLabels = {
        income: 'Έσοδο',
        expense: 'Έξοδο',
        donation: 'Δωρεά'
    };
    
    const typeColors = {
        income: 'color: var(--success)',
        expense: 'color: var(--danger)',
        donation: 'color: var(--info)'
    };
    
    const rows = transactions.map(transaction => `
        <tr>
            <td>${formatDate(transaction.transaction_date)}</td>
            <td><span style="${typeColors[transaction.type]}">${typeLabels[transaction.type]}</span></td>
            <td><strong>${transaction.description}</strong></td>
            <td style="${typeColors[transaction.type]}">${formatCurrency(transaction.amount)}</td>
            <td>${transaction.notes || '-'}</td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick='editTransaction(${JSON.stringify(transaction)})'>
                    ✏️
                </button>
                <button class="btn btn-secondary btn-sm" onclick="deleteTransaction(${transaction.id})">
                    🗑️
                </button>
            </td>
        </tr>
    `).join('');
    
    $('#transactions-table tbody').html(rows);
}

function showTransactionModal(transaction = null) {
    if (transaction) {
        $('#transaction-modal-title').text('Επεξεργασία Συναλλαγής');
        $('#transaction-id').val(transaction.id);
        $('#transaction-type').val(transaction.type);
        $('#transaction-date').val(transaction.transaction_date);
        $('#transaction-description').val(transaction.description);
        $('#transaction-amount').val(transaction.amount / 100);
        $('#transaction-notes').val(transaction.notes || '');
    } else {
        $('#transaction-modal-title').text('Νέα Συναλλαγή');
        $('#transaction-form')[0].reset();
        $('#transaction-id').val('');
        $('#transaction-date').val(new Date().toISOString().split('T')[0]);
    }
    
    $('#transaction-modal').addClass('show');
}

function closeTransactionModal() {
    $('#transaction-modal').removeClass('show');
}

function editTransaction(transaction) {
    showTransactionModal(transaction);
}

function saveTransaction() {
    const seasonId = getSeasonId();
    if (!seasonId) {
        showAlert('Δεν υπάρχει ενεργή περίοδος', 'danger');
        return;
    }
    
    const id = $('#transaction-id').val();
    const data = {
        season_id: seasonId,
        type: $('#transaction-type').val(),
        transaction_date: $('#transaction-date').val(),
        description: $('#transaction-description').val(),
        amount: Math.round(parseFloat($('#transaction-amount').val()) * 100),
        notes: $('#transaction-notes').val()
    };
    
    if (id) {
        data.id = parseInt(id);
    }
    
    const action = id ? 'update' : 'create';
    
    $.ajax({
        url: `api/transactions.php?action=${action}`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(response) {
            if (response.success) {
                showAlert('Η συναλλαγή αποθηκεύτηκε επιτυχώς', 'success');
                closeTransactionModal();
                loadTransactionsData();
            } else {
                showAlert(response.error || 'Σφάλμα αποθήκευσης', 'danger');
            }
        }
    });
}

function deleteTransaction(id) {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή τη συναλλαγή;')) {
        return;
    }
    
    $.ajax({
        url: `api/transactions.php?action=delete&id=${id}`,
        method: 'POST',
        success: function(response) {
            if (response.success) {
                showAlert('Η συναλλαγή διαγράφηκε επιτυχώς', 'success');
                loadTransactionsData();
            } else {
                showAlert(response.error || 'Σφάλμα διαγραφής', 'danger');
            }
        }
    });
}

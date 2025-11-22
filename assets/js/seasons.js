// Seasons Management

function loadSeasons() {
    $('#page-content').html(`
        <div class="page-header">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h1 class="page-title">Περίοδοι</h1>
                    <p class="page-description">Διαχείριση περιόδων συγκομιδής</p>
                </div>
                <button class="btn btn-primary" onclick="showSeasonModal()">
                    ➕ Νέα Περίοδος
                </button>
            </div>
        </div>
        
        <div class="card">
            <div class="table-responsive">
                <table class="table" id="seasons-table">
                    <thead>
                        <tr>
                            <th>Όνομα</th>
                            <th>Ημερομηνία Έναρξης</th>
                            <th>Ημερομηνία Λήξης</th>
                            <th>Κατάσταση</th>
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
        <div id="season-modal" class="modal">
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3 class="modal-title" id="season-modal-title">Νέα Περίοδος</h3>
                    <button class="modal-close" onclick="closeSeasonModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="season-form" autocomplete="off">
                        <input type="hidden" id="season-id">
                        <div class="form-group">
                            <label class="form-label" for="season-name">Όνομα *</label>
                            <input type="text" id="season-name" class="form-control" autocomplete="off" required placeholder="π.χ. 2025-26">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="season-start">Ημερομηνία Έναρξης *</label>
                            <input type="date" id="season-start" class="form-control" autocomplete="off" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="season-end">Ημερομηνία Λήξης *</label>
                            <input type="date" id="season-end" class="form-control" autocomplete="off" required>
                        </div>
                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" id="season-active">
                                <span>Ενεργή Περίοδος</span>
                            </label>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeSeasonModal()">Ακύρωση</button>
                    <button class="btn btn-primary" onclick="saveSeason()">Αποθήκευση</button>
                </div>
            </div>
        </div>
    `);
    
    loadSeasonsData();
}

function loadSeasonsData() {
    $.ajax({
        url: 'api/seasons.php?action=list',
        method: 'GET',
        success: function(response) {
            if (response.success) {
                displaySeasons(response.data);
            }
        }
    });
}

function displaySeasons(seasons) {
    const mobileConfig = {
        getHeader: (s) => s.name,
        fields: [
            { label: 'Ημ/νία Έναρξης', getValue: (s) => formatDate(s.start_date) },
            { label: 'Ημ/νία Λήξης', getValue: (s) => formatDate(s.end_date) },
            { label: 'Κατάσταση', getValue: (s) => s.is_active ? '✓ Ενεργή' : 'Ανενεργή' }
        ],
        actions: [
            {
                label: '✏️ Επεξεργασία',
                className: 'btn-secondary btn-sm',
                getOnClick: (s) => `editSeason(${JSON.stringify(s).replace(/"/g, '&quot;')})`
            },
            {
                label: '🗑️ Διαγραφή',
                className: 'btn-danger btn-sm',
                getOnClick: (s) => `deleteSeason(${s.id})`
            }
        ]
    };
    
    updateTableDisplay('#seasons-table', seasons, displaySeasonsTable, mobileConfig);
}

function displaySeasonsTable(seasons) {
    if (seasons.length === 0) {
        $('#seasons-table tbody').html('<tr><td colspan="5" class="text-center">Δεν υπάρχουν περίοδοι</td></tr>');
        return;
    }
    
    const rows = seasons.map(season => `
        <tr>
            <td><strong>${season.name}</strong></td>
            <td>${formatDate(season.start_date)}</td>
            <td>${formatDate(season.end_date)}</td>
            <td>
                ${season.is_active ? 
                    '<span style="color: var(--success); font-weight: 600;">✓ Ενεργή</span>' : 
                    '<span style="color: var(--text-muted);">Ανενεργή</span>'
                }
            </td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick='editSeason(${JSON.stringify(season)})'>
                    ✏️ Επεξεργασία
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteSeason(${season.id})">
                    🗑️ Διαγραφή
                </button>
            </td>
        </tr>
    `).join('');
    
    $('#seasons-table tbody').html(rows);
}

function showSeasonModal(season = null) {
    if (season) {
        $('#season-modal-title').text('Επεξεργασία Περιόδου');
        $('#season-id').val(season.id);
        $('#season-name').val(season.name);
        $('#season-start').val(season.start_date);
        $('#season-end').val(season.end_date);
        $('#season-active').prop('checked', season.is_active == 1);
    } else {
        $('#season-modal-title').text('Νέα Περίοδος');
        $('#season-form')[0].reset();
        $('#season-id').val('');
    }
    
    $('#season-modal').addClass('show');
}

function closeSeasonModal() {
    $('#season-modal').removeClass('show');
}

function editSeason(season) {
    showSeasonModal(season);
}

function saveSeason() {
    const id = $('#season-id').val();
    const data = {
        name: $('#season-name').val(),
        start_date: $('#season-start').val(),
        end_date: $('#season-end').val(),
        is_active: $('#season-active').is(':checked')
    };
    
    if (id) {
        data.id = parseInt(id);
    }
    
    const action = id ? 'update' : 'create';
    
    $.ajax({
        url: `api/seasons.php?action=${action}`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(response) {
            if (response.success) {
                showAlert('Η περίοδος αποθηκεύτηκε επιτυχώς', 'success');
                closeSeasonModal();
                loadSeasonsData();
                loadActiveSeason(); // Reload active season
            } else {
                showAlert(response.error || 'Σφάλμα αποθήκευσης', 'danger');
            }
        }
    });
}

function deleteSeason(id) {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την περίοδο; Θα διαγραφούν και όλα τα σχετικά δεδομένα.')) {
        return;
    }
    
    $.ajax({
        url: `api/seasons.php?action=delete&id=${id}`,
        method: 'POST',
        success: function(response) {
            if (response.success) {
                showAlert('Η περίοδος διαγράφηκε επιτυχώς', 'success');
                loadSeasonsData();
                loadActiveSeason(); // Reload active season
            } else {
                showAlert(response.error || 'Σφάλμα διαγραφής', 'danger');
            }
        }
    });
}

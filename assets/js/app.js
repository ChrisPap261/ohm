// Main Application Logic

let currentPage = 'dashboard';
let activeSeason = null;

$(document).ready(function() {
    // Load active season
    loadActiveSeason();
    
    // Mobile menu toggle
    $('#mobile-menu-toggle').on('click', function() {
        $('.sidebar').toggleClass('show');
    });
    
    // Close mobile menu when clicking outside
    $(document).on('click', function(e) {
        if (!$(e.target).closest('.sidebar, #mobile-menu-toggle').length) {
            $('.sidebar').removeClass('show');
        }
    });
    
    // Navigation
    $('.sidebar-menu-link').on('click', function(e) {
        e.preventDefault();
        const page = $(this).data('page');
        navigateTo(page);
        // Close mobile menu after navigation
        $('.sidebar').removeClass('show');
    });
    
    // Logout
    $('#logout-btn').on('click', function() {
        $.ajax({
            url: 'api/auth.php?action=logout',
            method: 'POST',
            success: function() {
                window.location.href = 'login.php';
            }
        });
    });
    
    // Auto-load dashboard after season loads
    setTimeout(function() {
        navigateTo('dashboard');
    }, 500);
});

function loadActiveSeason() {
    $.ajax({
        url: 'api/seasons.php?action=active',
        method: 'GET',
        success: function(response) {
            if (response.success && response.data) {
                activeSeason = response.data;
            }
        }
    });
}

function navigateTo(page) {
    currentPage = page;
    
    // Update active menu item
    $('.sidebar-menu-link').removeClass('active');
    $(`.sidebar-menu-link[data-page="${page}"]`).addClass('active');
    
    // Load page content
    switch(page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'fields':
            loadFields();
            break;
        case 'harvests':
            loadHarvests();
            break;
        case 'mill':
            loadMill();
            break;
        case 'oil_sales':
            loadOilSales();
            break;
        case 'customers':
            loadCustomers();
            break;
        case 'transactions':
            loadTransactions();
            break;
        case 'seasons':
            loadSeasons();
            break;
    }
}

function showAlert(message, type = 'info') {
    const colors = {
        success: 'var(--success)',
        danger: 'var(--danger)',
        warning: 'var(--warning)',
        info: 'var(--info)'
    };
    
    const alert = $('<div>')
        .css({
            position: 'fixed',
            top: '2rem',
            right: '2rem',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            backgroundColor: colors[type] || colors.info,
            color: 'white',
            fontSize: '0.875rem',
            zIndex: 9999,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            maxWidth: '400px'
        })
        .text(message);
    
    $('body').append(alert);
    
    setTimeout(function() {
        alert.fadeOut(function() {
            $(this).remove();
        });
    }, 3000);
}

function formatCurrency(amount) {
    return '€' + (amount / 100).toFixed(2);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('el-GR');
}

function getSeasonId() {
    return activeSeason ? activeSeason.id : null;
}

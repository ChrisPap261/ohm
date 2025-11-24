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
    
    // Navigation (leaf links)
    $('.sidebar-menu').on('click', '.sidebar-menu-link[data-page]', function(e) {
        e.preventDefault();
        const page = $(this).data('page');
        if (!page) return;
        navigateTo(page);
        // Close mobile menu after navigation
        $('.sidebar').removeClass('show');
    });
    
    // Dropdown toggles
    $('.sidebar-menu').on('click', '.sidebar-dropdown-toggle', function(e) {
        e.preventDefault();
        toggleSubmenu($(this));
    });
    
    // Logo click - navigate to dashboard
    $('.sidebar-logo, .mobile-navbar-logo').on('click', function(e) {
        e.preventDefault();
        navigateTo('dashboard');
        // Close mobile menu after navigation
        $('.sidebar').removeClass('show');
    });
    
    // Make logos clickable (cursor pointer)
    $('.sidebar-logo, .mobile-navbar-logo').css('cursor', 'pointer');
    
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
    $('.sidebar-menu-link[data-page]').removeClass('active');
    const $targetLink = $(`.sidebar-menu-link[data-page="${page}"]`);
    $targetLink.addClass('active');
    syncSubmenuState($targetLink);
    
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
        case 'olive_sales':
            loadOliveSales();
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
        case 'analytics':
            loadAnalytics();
            break;
    }
}

function toggleSubmenu($toggle) {
    const $item = $toggle.closest('.sidebar-menu-item');
    const $submenu = $item.find('.sidebar-submenu').first();
    const isOpen = $item.hasClass('open');
    
    // Close other dropdowns
    $('.sidebar-menu-item.has-children').not($item).removeClass('open')
        .find('.sidebar-dropdown-toggle').attr('aria-expanded', 'false').end()
        .find('.sidebar-submenu').slideUp(150);
    
    if (isOpen) {
        $item.removeClass('open');
        $submenu.stop(true, true).slideUp(150);
        $toggle.attr('aria-expanded', 'false');
    } else {
        $item.addClass('open');
        $submenu.stop(true, true).slideDown(150);
        $toggle.attr('aria-expanded', 'true');
    }
}

function syncSubmenuState($link) {
    const $allDropdowns = $('.sidebar-menu-item.has-children');
    const $submenus = $('.sidebar-submenu');
    
    // Reset dropdowns when no link is provided
    if (!$link || !$link.length) {
        $allDropdowns.removeClass('open').find('.sidebar-dropdown-toggle').attr('aria-expanded', 'false');
        $submenus.hide();
        return;
    }
    
    const $submenu = $link.closest('.sidebar-submenu');
    $allDropdowns.removeClass('open').find('.sidebar-dropdown-toggle').attr('aria-expanded', 'false');
    $submenus.hide();
    
    if ($submenu.length) {
        const $parentItem = $submenu.closest('.sidebar-menu-item');
        $parentItem.addClass('open');
        $submenu.show();
        $parentItem.find('.sidebar-dropdown-toggle').attr('aria-expanded', 'true');
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
            bottom: '2rem',
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

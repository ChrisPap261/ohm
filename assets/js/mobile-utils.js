// Mobile Utilities for Responsive Tables

function isMobile() {
    return window.innerWidth <= 768;
}

function renderMobileCards(data, config) {
    if (!data || data.length === 0) {
        return '<p class="text-center" style="padding: 2rem; color: var(--text-muted);">Δεν υπάρχουν δεδομένα</p>';
    }
    
    return data.map(item => {
        const header = config.getHeader(item);
        const rows = config.fields.map(field => `
            <div class="mobile-card-row">
                <span class="mobile-card-label">${field.label}</span>
                <span class="mobile-card-value">${field.getValue(item)}</span>
            </div>
        `).join('');
        
        const visibleActions = config.actions ? config.actions.filter(action => {
            if (typeof action.isHidden === 'function') {
                return !action.isHidden(item);
            }
            return !action.isHidden;
        }) : [];
        
        const actions = visibleActions.length ? `
            <div class="mobile-card-actions">
                ${visibleActions.map(action => `
                    <button class="btn ${action.className}" onclick="${action.getOnClick(item)}">
                        ${action.label}
                    </button>
                `).join('')}
            </div>
        ` : '';
        
        return `
            <div class="mobile-card">
                <div class="mobile-card-header">${header}</div>
                ${rows}
                ${actions}
            </div>
        `;
    }).join('');
}

function updateTableDisplay(tableSelector, data, tableRenderer, mobileConfig) {
    const $table = $(tableSelector);
    const $container = $table.closest('.table-responsive');
    
    if (isMobile()) {
        // Hide table, show mobile cards
        $table.hide();
        
        // Remove old mobile cards
        $container.find('.mobile-cards-wrapper').remove();
        
        // Add new mobile cards
        const cardsHtml = renderMobileCards(data, mobileConfig);
        $container.append(`<div class="mobile-cards-wrapper">${cardsHtml}</div>`);
    } else {
        // Show table, hide mobile cards
        $table.show();
        $container.find('.mobile-cards-wrapper').remove();
        tableRenderer(data);
    }
}

// Re-render on window resize
let resizeTimeout;
$(window).on('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
        // Trigger re-render of current page
        if (typeof window.currentPage !== 'undefined') {
            const loadFunction = window[`load${window.currentPage.charAt(0).toUpperCase() + window.currentPage.slice(1)}Data`];
            if (typeof loadFunction === 'function') {
                loadFunction();
            }
        }
    }, 250);
});

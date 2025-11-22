// Authentication handling

$(document).ready(function() {
    // Login form
    $('#login-form').on('submit', function(e) {
        e.preventDefault();
        
        const username = $('#username').val();
        const password = $('#password').val();
        
        $.ajax({
            url: 'api/auth.php?action=login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ username, password }),
            success: function(response) {
                if (response.success) {
                    window.location.href = 'index.php';
                } else {
                    showAlert(response.error || 'Σφάλμα σύνδεσης', 'danger');
                }
            },
            error: function() {
                showAlert('Σφάλμα επικοινωνίας με τον server', 'danger');
            }
        });
    });
    
    // Register form
    $('#register-form').on('submit', function(e) {
        e.preventDefault();
        
        const password = $('#password').val();
        const passwordConfirm = $('#password_confirm').val();
        
        if (password !== passwordConfirm) {
            showAlert('Οι κωδικοί δεν ταιριάζουν', 'danger');
            return;
        }
        
        const data = {
            username: $('#username').val(),
            password: password,
            email: $('#email').val(),
            full_name: $('#full_name').val()
        };
        
        $.ajax({
            url: 'api/auth.php?action=register',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(response) {
                if (response.success) {
                    showAlert('Η εγγραφή ολοκληρώθηκε! Μπορείτε τώρα να συνδεθείτε.', 'success');
                    setTimeout(function() {
                        window.location.href = 'login.php';
                    }, 2000);
                } else {
                    showAlert(response.error || 'Σφάλμα εγγραφής', 'danger');
                }
            },
            error: function() {
                showAlert('Σφάλμα επικοινωνίας με τον server', 'danger');
            }
        });
    });
});

function showAlert(message, type) {
    const alertClass = type === 'success' ? 'success' : 'danger';
    const bgColor = type === 'success' ? 'var(--success)' : 'var(--danger)';
    
    const alert = $('<div>')
        .css({
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            borderRadius: '8px',
            backgroundColor: bgColor,
            color: 'white',
            fontSize: '0.875rem'
        })
        .text(message);
    
    $('#alert-container').html(alert);
    
    setTimeout(function() {
        alert.fadeOut(function() {
            $(this).remove();
        });
    }, 5000);
}

<?php
require_once 'includes/config.php';
require_once 'includes/Database.php';
require_once 'includes/Auth.php';

$auth = new Auth();

// If already logged in, redirect to dashboard
if ($auth->isLoggedIn()) {
    header('Location: index.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="el">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Σύνδεση - Olive Harvest Manager</title>
    <link rel="icon" type="image/png" href="assets/images/olive-logo.png">
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <div class="login-logo">🫒</div>
                <h1 class="login-title">Olive Harvest Manager</h1>
                <p class="login-subtitle">Διαχείριση Συγκομιδής Ελιών</p>
            </div>
            
            <div id="alert-container"></div>
            
            <form id="login-form">
                <div class="form-group">
                    <label class="form-label" for="username">Όνομα Χρήστη</label>
                    <input type="text" id="username" name="username" class="form-control" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="password">Κωδικός</label>
                    <input type="password" id="password" name="password" class="form-control" required>
                </div>
                
                <button type="submit" class="btn btn-primary" style="width: 100%;">
                    Σύνδεση
                </button>
            </form>
            
            <div class="text-center mt-3">
                <p style="color: var(--text-muted); font-size: 0.875rem;">
                    Δεν έχετε λογαριασμό; 
                    <a href="register.php" style="color: var(--primary); text-decoration: none; font-weight: 500;">
                        Εγγραφή
                    </a>
                </p>
            </div>
            
            <div class="text-center mt-3" style="padding-top: 1rem; border-top: 1px solid var(--border);">
                <p style="color: var(--text-muted); font-size: 0.75rem;">
                    Προεπιλεγμένος λογαριασμός:<br>
                    <strong>admin / admin123</strong>
                </p>
            </div>
        </div>
    </div>
    
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <script src="assets/js/auth.js"></script>
</body>
</html>

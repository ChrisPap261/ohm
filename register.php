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
    <title>Εγγραφή - Olive Harvest Manager</title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <div class="login-logo">🫒</div>
                <h1 class="login-title">Εγγραφή</h1>
                <p class="login-subtitle">Δημιουργία νέου λογαριασμού</p>
            </div>
            
            <div id="alert-container"></div>
            
            <form id="register-form">
                <div class="form-group">
                    <label class="form-label" for="full_name">Ονοματεπώνυμο</label>
                    <input type="text" id="full_name" name="full_name" class="form-control" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="username">Όνομα Χρήστη</label>
                    <input type="text" id="username" name="username" class="form-control" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="email">Email</label>
                    <input type="email" id="email" name="email" class="form-control" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="password">Κωδικός</label>
                    <input type="password" id="password" name="password" class="form-control" required minlength="6">
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="password_confirm">Επιβεβαίωση Κωδικού</label>
                    <input type="password" id="password_confirm" name="password_confirm" class="form-control" required minlength="6">
                </div>
                
                <button type="submit" class="btn btn-primary" style="width: 100%;">
                    Εγγραφή
                </button>
            </form>
            
            <div class="text-center mt-3">
                <p style="color: var(--text-muted); font-size: 0.875rem;">
                    Έχετε ήδη λογαριασμό; 
                    <a href="login.php" style="color: var(--primary); text-decoration: none; font-weight: 500;">
                        Σύνδεση
                    </a>
                </p>
            </div>
        </div>
    </div>
    
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <script src="assets/js/auth.js"></script>
</body>
</html>

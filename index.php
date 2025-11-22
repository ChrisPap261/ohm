<?php
require_once 'includes/config.php';
require_once 'includes/Database.php';
require_once 'includes/Auth.php';

$auth = new Auth();

// Check if user is logged in
if (!$auth->isLoggedIn()) {
    header('Location: login.php');
    exit;
}

$user = $auth->getCurrentUser();
?>
<!DOCTYPE html>
<html lang="el">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Olive Harvest Manager</title>
    <link rel="icon" type="image/png" href="assets/images/olive-logo.png">
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="assets/css/autocomplete.css">
</head>
<body>
    <!-- Mobile Navbar -->
    <nav class="mobile-navbar">
        <div class="mobile-navbar-brand">
            <img src="assets/images/olive-logo.png" alt="Olive" class="mobile-navbar-logo">
            <span class="mobile-navbar-title">Olive Harvest</span>
        </div>
        <button id="mobile-menu-toggle" class="mobile-navbar-burger" aria-label="Toggle Menu">
            <span></span>
            <span></span>
            <span></span>
        </button>
    </nav>
    
    <!-- Sidebar -->
    <aside class="sidebar">
        <div class="sidebar-header">
            <img src="assets/images/olive-logo.png" alt="Olive" class="sidebar-logo">
            <div class="sidebar-title">Olive Harvest</div>
        </div>
        
        <nav>
            <ul class="sidebar-menu">
                <li class="sidebar-menu-item">
                    <a href="#" class="sidebar-menu-link active" data-page="dashboard">
                        <span class="sidebar-menu-icon">📊</span>
                        <span>Επισκόπηση</span>
                    </a>
                </li>
                <li class="sidebar-menu-item">
                    <a href="#" class="sidebar-menu-link" data-page="fields">
                        <span class="sidebar-menu-icon">🌾</span>
                        <span>Αγροτεμάχια</span>
                    </a>
                </li>
                <li class="sidebar-menu-item">
                    <a href="#" class="sidebar-menu-link" data-page="harvests">
                        <span class="sidebar-menu-icon">🫒</span>
                        <span>Συγκομιδές</span>
                    </a>
                </li>
                <li class="sidebar-menu-item">
                    <a href="#" class="sidebar-menu-link" data-page="mill">
                        <span class="sidebar-menu-icon">🏭</span>
                        <span>Ελαιοτριβείο</span>
                    </a>
                </li>
                <li class="sidebar-menu-item">
                    <a href="#" class="sidebar-menu-link" data-page="oil_sales">
                        <span class="sidebar-menu-icon">🛢️</span>
                        <span>Πωλήσεις Λαδιού</span>
                    </a>
                </li>
                <li class="sidebar-menu-item">
                    <a href="#" class="sidebar-menu-link" data-page="customers">
                        <span class="sidebar-menu-icon">👥</span>
                        <span>Πελάτες</span>
                    </a>
                </li>
                <li class="sidebar-menu-item">
                    <a href="#" class="sidebar-menu-link" data-page="transactions">
                        <span class="sidebar-menu-icon">💰</span>
                        <span>Έσοδα/Έξοδα</span>
                    </a>
                </li>
                <li class="sidebar-menu-item">
                    <a href="#" class="sidebar-menu-link" data-page="seasons">
                        <span class="sidebar-menu-icon">📅</span>
                        <span>Περίοδοι</span>
                    </a>
                </li>
            </ul>
        </nav>
        
        <div class="sidebar-footer">
            <div class="user-info">
                <div class="user-avatar"><?= strtoupper(substr($user['full_name'] ?? $user['username'], 0, 1)) ?></div>
                <div class="user-details">
                    <div class="user-name"><?= htmlspecialchars($user['full_name'] ?? $user['username']) ?></div>
                    <div class="user-email"><?= htmlspecialchars($user['email'] ?? '') ?></div>
                </div>
            </div>
            <button id="logout-btn" class="btn btn-secondary" style="width: 100%;">
                Αποσύνδεση
            </button>
        </div>
    </aside>
    
    <!-- Main Content -->
    <main class="main-content">
        <div id="page-content">
            <!-- Content will be loaded here dynamically -->
        </div>
    </main>
    
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js"></script>
    <script src="assets/js/mobile-utils.js"></script>
    <script src="assets/js/app.js"></script>
    <script src="assets/js/dashboard.js"></script>
    <script src="assets/js/fields.js"></script>
    <script src="assets/js/harvests.js"></script>
    <script src="assets/js/mill.js"></script>
    <script src="assets/js/oil_sales.js"></script>
    <script src="assets/js/customers.js"></script>
    <script src="assets/js/transactions.js"></script>
    <script src="assets/js/seasons.js"></script>
</body>
</html>

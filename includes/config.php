<?php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'u728674601_oil');
define('DB_USER', 'u728674601_oil');
define('DB_PASS', '?Uyj#$*mZ0j');
define('DB_CHARSET', 'utf8mb4');

// Application Configuration
define('APP_NAME', 'Olive Harvest Manager');
define('APP_VERSION', '1.2.1');

// Session Configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 0); // Set to 1 if using HTTPS
session_start();

// Timezone
date_default_timezone_set('Europe/Athens');

// Error Reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

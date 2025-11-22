<?php
class Auth {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    public function login($username, $password) {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['full_name'] = $user['full_name'];
            return ['success' => true, 'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'full_name' => $user['full_name'],
                'email' => $user['email']
            ]];
        }
        
        return ['success' => false, 'error' => 'Λάθος όνομα χρήστη ή κωδικός'];
    }
    
    public function register($username, $password, $email, $full_name) {
        // Check if username exists
        $stmt = $this->db->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$username]);
        if ($stmt->fetch()) {
            return ['success' => false, 'error' => 'Το όνομα χρήστη υπάρχει ήδη'];
        }
        
        // Hash password
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        
        // Insert user
        $stmt = $this->db->prepare("INSERT INTO users (username, password, email, full_name) VALUES (?, ?, ?, ?)");
        if ($stmt->execute([$username, $hashed_password, $email, $full_name])) {
            return ['success' => true, 'message' => 'Η εγγραφή ολοκληρώθηκε επιτυχώς'];
        }
        
        return ['success' => false, 'error' => 'Σφάλμα κατά την εγγραφή'];
    }
    
    public function logout() {
        session_destroy();
        return ['success' => true];
    }
    
    public function isLoggedIn() {
        return isset($_SESSION['user_id']);
    }
    
    public function getCurrentUser() {
        if (!$this->isLoggedIn()) {
            return null;
        }
        
        $stmt = $this->db->prepare("SELECT id, username, email, full_name FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        return $stmt->fetch();
    }
    
    public function getUserId() {
        return $_SESSION['user_id'] ?? null;
    }
}

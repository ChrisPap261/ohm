<?php
require_once '../includes/config.php';
require_once '../includes/Database.php';
require_once '../includes/Auth.php';

header('Content-Type: application/json');

$auth = new Auth();
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'login':
        $data = json_decode(file_get_contents('php://input'), true);
        echo json_encode($auth->login($data['username'], $data['password']));
        break;
        
    case 'register':
        $data = json_decode(file_get_contents('php://input'), true);
        echo json_encode($auth->register($data['username'], $data['password'], $data['email'], $data['full_name']));
        break;
        
    case 'logout':
        echo json_encode($auth->logout());
        break;
        
    case 'me':
        $user = $auth->getCurrentUser();
        if ($user) {
            echo json_encode(['success' => true, 'user' => $user]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'error' => 'Invalid action']);
}

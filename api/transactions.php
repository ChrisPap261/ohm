<?php
require_once '../includes/config.php';
require_once '../includes/Database.php';
require_once '../includes/Auth.php';

header('Content-Type: application/json');

$auth = new Auth();
if (!$auth->isLoggedIn()) {
    echo json_encode(['success' => false, 'error' => 'Not authenticated']);
    exit;
}

$db = Database::getInstance()->getConnection();
$userId = $auth->getUserId();
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'list':
        $seasonId = $_GET['season_id'] ?? null;
        if ($seasonId) {
            $stmt = $db->prepare("SELECT * FROM transactions WHERE user_id = ? AND season_id = ? ORDER BY transaction_date DESC");
            $stmt->execute([$userId, $seasonId]);
        } else {
            $stmt = $db->prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC");
            $stmt->execute([$userId]);
        }
        $transactions = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $transactions]);
        break;
        
    case 'create':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $db->prepare("INSERT INTO transactions (user_id, season_id, type, transaction_date, description, amount, notes) 
                             VALUES (?, ?, ?, ?, ?, ?, ?)");
        if ($stmt->execute([
            $userId, 
            $data['season_id'], 
            $data['type'], 
            $data['transaction_date'], 
            $data['description'], 
            $data['amount'], 
            $data['notes'] ?? null
        ])) {
            echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to create transaction']);
        }
        break;
        
    case 'update':
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'] ?? 0;
        $stmt = $db->prepare("UPDATE transactions SET season_id = ?, type = ?, transaction_date = ?, description = ?, amount = ?, notes = ? 
                             WHERE id = ? AND user_id = ?");
        if ($stmt->execute([
            $data['season_id'], 
            $data['type'], 
            $data['transaction_date'], 
            $data['description'], 
            $data['amount'], 
            $data['notes'] ?? null, 
            $id, 
            $userId
        ])) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to update transaction']);
        }
        break;
        
    case 'delete':
        $id = $_GET['id'] ?? 0;
        $stmt = $db->prepare("DELETE FROM transactions WHERE id = ? AND user_id = ?");
        if ($stmt->execute([$id, $userId])) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to delete transaction']);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'error' => 'Invalid action']);
}

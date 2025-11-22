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
            $stmt = $db->prepare("SELECT * FROM mill_processing WHERE user_id = ? AND season_id = ? ORDER BY processing_date DESC");
            $stmt->execute([$userId, $seasonId]);
        } else {
            $stmt = $db->prepare("SELECT * FROM mill_processing WHERE user_id = ? ORDER BY processing_date DESC");
            $stmt->execute([$userId]);
        }
        $records = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $records]);
        break;
        
    case 'create':
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Insert mill processing (no auto-transaction)
        $stmt = $db->prepare("INSERT INTO mill_processing (user_id, season_id, processing_date, crates, olives_kg, oil_kg, expenses, notes) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        if ($stmt->execute([
            $userId, 
            $data['season_id'], 
            $data['processing_date'], 
            $data['crates'] ?? null,
            $data['olives_kg'], 
            $data['oil_kg'], 
            $data['expenses'],
            $data['notes'] ?? null
        ])) {
            echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to create record']);
        }
        break;
        
    case 'update':
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'] ?? 0;
        $stmt = $db->prepare("UPDATE mill_processing SET season_id = ?, processing_date = ?, crates = ?, olives_kg = ?, oil_kg = ?, expenses = ?, notes = ? 
                             WHERE id = ? AND user_id = ?");
        if ($stmt->execute([
            $data['season_id'], 
            $data['processing_date'], 
            $data['crates'] ?? null,
            $data['olives_kg'], 
            $data['oil_kg'], 
            $data['expenses'],
            $data['notes'] ?? null, 
            $id, 
            $userId
        ])) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to update record']);
        }
        break;
        
    case 'delete':
        $id = $_GET['id'] ?? 0;
        $stmt = $db->prepare("DELETE FROM mill_processing WHERE id = ? AND user_id = ?");
        if ($stmt->execute([$id, $userId])) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to delete record']);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'error' => 'Invalid action']);
}

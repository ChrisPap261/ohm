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
        $stmt = $db->prepare("SELECT * FROM seasons WHERE user_id = ? ORDER BY start_date DESC");
        $stmt->execute([$userId]);
        $seasons = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $seasons]);
        break;
        
    case 'active':
        $stmt = $db->prepare("SELECT * FROM seasons WHERE user_id = ? AND is_active = 1 LIMIT 1");
        $stmt->execute([$userId]);
        $season = $stmt->fetch();
        echo json_encode(['success' => true, 'data' => $season]);
        break;
        
    case 'create':
        $data = json_decode(file_get_contents('php://input'), true);
        
        // If setting as active, deactivate all others
        if ($data['is_active']) {
            $stmt = $db->prepare("UPDATE seasons SET is_active = 0 WHERE user_id = ?");
            $stmt->execute([$userId]);
        }
        
        $stmt = $db->prepare("INSERT INTO seasons (user_id, name, start_date, end_date, is_active) VALUES (?, ?, ?, ?, ?)");
        if ($stmt->execute([$userId, $data['name'], $data['start_date'], $data['end_date'], $data['is_active'] ? 1 : 0])) {
            echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to create season']);
        }
        break;
        
    case 'update':
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'] ?? 0;
        
        // If setting as active, deactivate all others
        if ($data['is_active']) {
            $stmt = $db->prepare("UPDATE seasons SET is_active = 0 WHERE user_id = ?");
            $stmt->execute([$userId]);
        }
        
        $stmt = $db->prepare("UPDATE seasons SET name = ?, start_date = ?, end_date = ?, is_active = ? WHERE id = ? AND user_id = ?");
        if ($stmt->execute([$data['name'], $data['start_date'], $data['end_date'], $data['is_active'] ? 1 : 0, $id, $userId])) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to update season']);
        }
        break;
        
    case 'delete':
        $id = $_GET['id'] ?? 0;
        $stmt = $db->prepare("DELETE FROM seasons WHERE id = ? AND user_id = ?");
        if ($stmt->execute([$id, $userId])) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to delete season']);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'error' => 'Invalid action']);
}

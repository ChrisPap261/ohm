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
            $stmt = $db->prepare("SELECT h.*, f.name as field_name FROM harvests h 
                                  LEFT JOIN fields f ON h.field_id = f.id 
                                  WHERE h.user_id = ? AND h.season_id = ? 
                                  ORDER BY h.harvest_date DESC");
            $stmt->execute([$userId, $seasonId]);
        } else {
            $stmt = $db->prepare("SELECT h.*, f.name as field_name FROM harvests h 
                                  LEFT JOIN fields f ON h.field_id = f.id 
                                  WHERE h.user_id = ? 
                                  ORDER BY h.harvest_date DESC");
            $stmt->execute([$userId]);
        }
        $harvests = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $harvests]);
        break;
        
    case 'create':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $db->prepare("INSERT INTO harvests (user_id, field_id, season_id, harvest_date, crates, olives_kg, notes) 
                             VALUES (?, ?, ?, ?, ?, ?, ?)");
        if ($stmt->execute([
            $userId, 
            $data['field_id'], 
            $data['season_id'], 
            $data['harvest_date'], 
            $data['crates'], 
            $data['olives_kg'], 
            $data['notes'] ?? null
        ])) {
            echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to create harvest']);
        }
        break;
        
    case 'update':
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'] ?? 0;
        $stmt = $db->prepare("UPDATE harvests SET field_id = ?, season_id = ?, harvest_date = ?, crates = ?, olives_kg = ?, notes = ? 
                             WHERE id = ? AND user_id = ?");
        if ($stmt->execute([
            $data['field_id'], 
            $data['season_id'], 
            $data['harvest_date'], 
            $data['crates'], 
            $data['olives_kg'], 
            $data['notes'] ?? null, 
            $id, 
            $userId
        ])) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to update harvest']);
        }
        break;
        
    case 'delete':
        $id = $_GET['id'] ?? 0;
        $stmt = $db->prepare("DELETE FROM harvests WHERE id = ? AND user_id = ?");
        if ($stmt->execute([$id, $userId])) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to delete harvest']);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'error' => 'Invalid action']);
}

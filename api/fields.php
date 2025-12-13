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
        $stmt = $db->prepare("SELECT * FROM fields WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$userId]);
        $fields = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $fields]);
        break;
        
    case 'get':
        $id = $_GET['id'] ?? 0;
        $stmt = $db->prepare("SELECT * FROM fields WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        $field = $stmt->fetch();
        if ($field) {
            // Get harvest statistics
            $stmt = $db->prepare("SELECT 
                COUNT(*) as total_harvests,
                SUM(crates) as total_crates,
                SUM(olives_kg) as total_olives_kg,
                AVG(olives_kg / NULLIF(crates, 0)) as avg_kg_per_crate
                FROM harvests 
                WHERE field_id = ? AND user_id = ?");
            $stmt->execute([$id, $userId]);
            $harvestStats = $stmt->fetch();
            
            // Get all harvests for this field
            $stmt = $db->prepare("SELECT h.*, s.name as season_name 
                FROM harvests h 
                LEFT JOIN seasons s ON h.season_id = s.id 
                WHERE h.field_id = ? AND h.user_id = ? 
                ORDER BY h.harvest_date DESC");
            $stmt->execute([$id, $userId]);
            $harvests = $stmt->fetchAll();
            
            $field['harvests'] = $harvests;
            $field['stats'] = [
                'totalHarvests' => (int)($harvestStats['total_harvests'] ?? 0),
                'totalCrates' => (int)($harvestStats['total_crates'] ?? 0),
                'totalOlivesKg' => (int)($harvestStats['total_olives_kg'] ?? 0),
                'avgKgPerCrate' => $harvestStats['avg_kg_per_crate'] ? round((float)$harvestStats['avg_kg_per_crate'], 2) : 22.5
            ];
            
            echo json_encode(['success' => true, 'data' => $field]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Field not found']);
        }
        break;
        
    case 'create':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $db->prepare("INSERT INTO fields (user_id, name, location, area, tree_count) VALUES (?, ?, ?, ?, ?)");
        if ($stmt->execute([$userId, $data['name'], $data['location'] ?? null, $data['area'] ?? null, $data['tree_count'] ?? null])) {
            echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to create field']);
        }
        break;
        
    case 'update':
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'] ?? 0;
        $stmt = $db->prepare("UPDATE fields SET name = ?, location = ?, area = ?, tree_count = ? WHERE id = ? AND user_id = ?");
        if ($stmt->execute([$data['name'], $data['location'] ?? null, $data['area'] ?? null, $data['tree_count'] ?? null, $id, $userId])) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to update field']);
        }
        break;
        
    case 'delete':
        $id = $_GET['id'] ?? 0;
        $stmt = $db->prepare("DELETE FROM fields WHERE id = ? AND user_id = ?");
        if ($stmt->execute([$id, $userId])) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to delete field']);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'error' => 'Invalid action']);
}

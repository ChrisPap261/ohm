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
            $stmt = $db->prepare("SELECT os.*, c.name as customer_name 
                                 FROM olive_sales os 
                                 LEFT JOIN customers c ON os.customer_id = c.id
                                 WHERE os.user_id = ? AND os.season_id = ? 
                                 ORDER BY os.sale_date DESC");
            $stmt->execute([$userId, $seasonId]);
        } else {
            $stmt = $db->prepare("SELECT os.*, c.name as customer_name 
                                 FROM olive_sales os 
                                 LEFT JOIN customers c ON os.customer_id = c.id
                                 WHERE os.user_id = ? 
                                 ORDER BY os.sale_date DESC");
            $stmt->execute([$userId]);
        }
        $records = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $records]);
        break;
        
    case 'create':
        $data = json_decode(file_get_contents('php://input'), true);
        $totalAmount = $data['olives_kg'] * $data['price_per_kg'];
        
        // Insert olive sale (no auto-transaction)
        $stmt = $db->prepare("INSERT INTO olive_sales (user_id, season_id, sale_date, olives_kg, price_per_kg, total_amount, customer_id, buyer, notes, delivered, paid) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        if ($stmt->execute([
            $userId, 
            $data['season_id'], 
            $data['sale_date'], 
            $data['olives_kg'], 
            $data['price_per_kg'], 
            $totalAmount,
            $data['customer_id'] ?? null,
            $data['buyer'] ?? null,
            $data['notes'] ?? null,
            $data['delivered'] ?? 0,
            $data['paid'] ?? 0
        ])) {
            echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to create record']);
        }
        break;
        
    case 'update':
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'] ?? 0;
        $totalAmount = $data['olives_kg'] * $data['price_per_kg'];
        $stmt = $db->prepare("UPDATE olive_sales SET season_id = ?, sale_date = ?, olives_kg = ?, price_per_kg = ?, total_amount = ?, customer_id = ?, buyer = ?, notes = ?, delivered = ?, paid = ? 
                             WHERE id = ? AND user_id = ?");
        if ($stmt->execute([
            $data['season_id'], 
            $data['sale_date'], 
            $data['olives_kg'], 
            $data['price_per_kg'], 
            $totalAmount,
            $data['customer_id'] ?? null,
            $data['buyer'] ?? null,
            $data['notes'] ?? null,
            $data['delivered'] ?? 0,
            $data['paid'] ?? 0,
            $id,
            $userId
        ])) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to update record']);
        }
        break;
        

    case 'update_status':
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'] ?? 0;
        $field = $data['field'] ?? '';
        $value = isset($data['value']) ? (int)$data['value'] : 0;

        $allowedFields = ['delivered', 'paid'];
        if (!in_array($field, $allowedFields, true)) {
            echo json_encode(['success' => false, 'error' => 'Invalid field']);
            break;
        }

        $sql = "UPDATE olive_sales SET $field = ? WHERE id = ? AND user_id = ?";
        $stmt = $db->prepare($sql);
        if ($stmt->execute([$value, $id, $userId])) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to update status']);
        }
        break;

    case 'delete':
        $id = $_GET['id'] ?? 0;
        $stmt = $db->prepare("DELETE FROM olive_sales WHERE id = ? AND user_id = ?");
        if ($stmt->execute([$id, $userId])) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to delete record']);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'error' => 'Invalid action']);
}


<?php
require_once '../includes/config.php';
require_once '../includes/Auth.php';
require_once '../includes/Database.php';

header('Content-Type: application/json');

$auth = new Auth();
$userId = $auth->getUserId();

if (!$userId) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$db = Database::getInstance()->getConnection();
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'list':
        $stmt = $db->prepare("SELECT * FROM customers WHERE user_id = ? ORDER BY name ASC");
        $stmt->execute([$userId]);
        $customers = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $customers]);
        break;
        
    case 'get':
        $id = $_GET['id'] ?? 0;
        $stmt = $db->prepare("SELECT * FROM customers WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        $customer = $stmt->fetch();
        
        if ($customer) {
            // Get customer's purchases
            $stmt = $db->prepare("SELECT os.*, s.name as season_name 
                                 FROM oil_sales os 
                                 LEFT JOIN seasons s ON os.season_id = s.id
                                 WHERE os.customer_id = ? AND os.user_id = ? 
                                 ORDER BY os.sale_date DESC");
            $stmt->execute([$id, $userId]);
            $purchases = $stmt->fetchAll();
            
            $customer['purchases'] = $purchases;
            echo json_encode(['success' => true, 'data' => $customer]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Customer not found']);
        }
        break;
        
    case 'create':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $db->prepare("INSERT INTO customers (user_id, name, phone) VALUES (?, ?, ?)");
        if ($stmt->execute([
            $userId,
            $data['name'],
            $data['phone'] ?? null
        ])) {
            echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to create customer']);
        }
        break;
        
    case 'update':
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'] ?? 0;
        $stmt = $db->prepare("UPDATE customers SET name = ?, phone = ? WHERE id = ? AND user_id = ?");
        if ($stmt->execute([
            $data['name'],
            $data['phone'] ?? null,
            $id,
            $userId
        ])) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to update customer']);
        }
        break;
        
    case 'delete':
        $id = $_GET['id'] ?? 0;
        // Check if customer has any sales
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM oil_sales WHERE customer_id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        $result = $stmt->fetch();
        
        if ($result['count'] > 0) {
            echo json_encode(['success' => false, 'error' => 'Cannot delete customer with existing sales']);
        } else {
            $stmt = $db->prepare("DELETE FROM customers WHERE id = ? AND user_id = ?");
            if ($stmt->execute([$id, $userId])) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Failed to delete customer']);
            }
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'error' => 'Invalid action']);
}
?>

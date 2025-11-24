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
    case 'dashboard':
        $seasonId = $_GET['season_id'] ?? null;
        if (!$seasonId) {
            echo json_encode(['success' => false, 'error' => 'Season ID required']);
            exit;
        }
        
        // Harvest stats
        $stmt = $db->prepare("SELECT 
            SUM(crates) as total_crates,
            SUM(olives_kg) as total_olives_kg
            FROM harvests 
            WHERE user_id = ? AND season_id = ?");
        $stmt->execute([$userId, $seasonId]);
        $harvestStats = $stmt->fetch();
        
        // Manual transaction stats (excluding auto-transactions)
        $stmt = $db->prepare("SELECT 
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
            SUM(CASE WHEN type = 'donation' THEN amount ELSE 0 END) as total_donations
            FROM transactions 
            WHERE user_id = ? AND season_id = ?");
        $stmt->execute([$userId, $seasonId]);
        $transactionStats = $stmt->fetch();
        
        // Mill processing stats
        $stmt = $db->prepare("SELECT 
            SUM(oil_kg) as total_oil_kg,
            SUM(expenses) as total_mill_expenses
            FROM mill_processing 
            WHERE user_id = ? AND season_id = ?");
        $stmt->execute([$userId, $seasonId]);
        $millStats = $stmt->fetch();
        
        // Oil sales stats (in liters) - revenue to be included in total income
        $stmt = $db->prepare("SELECT 
            SUM(oil_liters) as total_oil_sold,
            SUM(total_amount) as total_oil_revenue
            FROM oil_sales 
            WHERE user_id = ? AND season_id = ?");
        $stmt->execute([$userId, $seasonId]);
        $oilSalesStats = $stmt->fetch();
        
        // Combine income: manual transactions + oil sales revenue
        $manualIncome = (int)($transactionStats['total_income'] ?? 0);
        $oilRevenue = (int)($oilSalesStats['total_oil_revenue'] ?? 0);
        $totalIncome = $manualIncome + $oilRevenue;
        
        // Combine expenses: manual transactions + mill expenses
        $manualExpenses = (int)($transactionStats['total_expenses'] ?? 0);
        $millExpenses = (int)($millStats['total_mill_expenses'] ?? 0);
        $totalExpenses = $manualExpenses + $millExpenses;
        
        // Previous seasons inventory
        $stmt = $db->prepare("SELECT COALESCE(SUM(oil_kg), 0) as previous_inventory 
            FROM oil_inventory 
            WHERE user_id = ? AND season_id IN (
                SELECT id FROM seasons WHERE user_id = ? AND id < ? ORDER BY id DESC
            )");
        $stmt->execute([$userId, $userId, $seasonId]);
        $prevInventory = $stmt->fetch();
        
        // Calculate remaining oil for the selected season (in kg)
        $totalProduced = (int)($millStats['total_oil_kg'] ?? 0);
        $totalSoldLiters = (int)($oilSalesStats['total_oil_sold'] ?? 0);
        $totalSoldKg = round($totalSoldLiters / 1.1); // Convert liters to kg
        $previousInv = (int)($prevInventory['previous_inventory'] ?? 0);
        $remainingOil = $totalProduced - $totalSoldKg + $previousInv;

        // Calculate overall remaining oil across all seasons
        $stmt = $db->prepare("SELECT COALESCE(SUM(oil_kg), 0) as total_oil_kg
            FROM mill_processing
            WHERE user_id = ?");
        $stmt->execute([$userId]);
        $allMillStats = $stmt->fetch();

        $stmt = $db->prepare("SELECT COALESCE(SUM(oil_liters), 0) as total_oil_sold
            FROM oil_sales
            WHERE user_id = ?");
        $stmt->execute([$userId]);
        $allOilSalesStats = $stmt->fetch();

        $stmt = $db->prepare("SELECT COALESCE(SUM(oil_kg), 0) as total_inventory
            FROM oil_inventory
            WHERE user_id = ?");
        $stmt->execute([$userId]);
        $allInventoryStats = $stmt->fetch();

        $allProduced = (int)($allMillStats['total_oil_kg'] ?? 0);
        $allSoldLiters = (int)($allOilSalesStats['total_oil_sold'] ?? 0);
        $allSoldKg = round($allSoldLiters / 1.1);
        $allInventory = (int)($allInventoryStats['total_inventory'] ?? 0);
        $overallRemainingOil = $allProduced - $allSoldKg + $allInventory;
        
        echo json_encode([
            'success' => true,
            'data' => [
                'harvests' => [
                    'totalCrates' => (int)($harvestStats['total_crates'] ?? 0),
                    'totalOlivesKg' => (int)($harvestStats['total_olives_kg'] ?? 0)
                ],
                'transactions' => [
                    'totalIncome' => $totalIncome, // Manual + oil sales
                    'totalExpenses' => $totalExpenses, // Manual + mill
                    'totalDonations' => (int)($transactionStats['total_donations'] ?? 0)
                ],
                'mill' => [
                    'totalOilKg' => (int)($millStats['total_oil_kg'] ?? 0),
                    'totalExpenses' => (int)($millStats['total_mill_expenses'] ?? 0)
                ],
                'oil' => [
                    'totalProduced' => $totalProduced,
                    'totalSold' => $totalSoldLiters, // in liters
                    'totalRevenue' => (int)($oilSalesStats['total_oil_revenue'] ?? 0),
                    'remaining' => $remainingOil, // in kg
                    'previousInventory' => $previousInv,
                    'remainingAllSeasons' => $overallRemainingOil
                ]
            ]
        ]);
        break;
        
    case 'oil_yield_by_season':
        $stmt = $db->prepare("
            SELECT 
                s.id,
                s.name,
                COALESCE(SUM(mp.olives_kg), 0) AS total_olives_kg,
                COALESCE(SUM(mp.oil_kg), 0) AS total_oil_kg
            FROM seasons s
            LEFT JOIN mill_processing mp 
                ON s.id = mp.season_id 
                AND mp.user_id = ?
            WHERE s.user_id = ?
            GROUP BY s.id, s.name
            ORDER BY s.start_date ASC
        ");
        $stmt->execute([$userId, $userId]);
        $rows = $stmt->fetchAll();
        
        $data = array_map(function($row) {
            $olives = (float)$row['total_olives_kg'];
            $oil = (float)$row['total_oil_kg'];
            $yieldPercent = $olives > 0 ? round(($oil / $olives) * 100, 2) : 0;
            
            return [
                'seasonId' => (int)$row['id'],
                'seasonName' => $row['name'],
                'totalOlivesKg' => $olives,
                'totalOilKg' => $oil,
                'yieldPercent' => $yieldPercent
            ];
        }, $rows);
        
        echo json_encode(['success' => true, 'data' => $data]);
        break;
        
    case 'harvests_by_field':
        $seasonId = $_GET['season_id'] ?? null;
        if (!$seasonId) {
            echo json_encode(['success' => false, 'error' => 'Season ID required']);
            exit;
        }
        
        $stmt = $db->prepare("SELECT 
            f.id,
            f.name,
            COUNT(h.id) as harvest_count,
            SUM(h.crates) as total_crates,
            SUM(h.olives_kg) as total_olives_kg
            FROM fields f
            LEFT JOIN harvests h ON f.id = h.field_id AND h.season_id = ?
            WHERE f.user_id = ?
            GROUP BY f.id, f.name
            HAVING harvest_count > 0
            ORDER BY total_olives_kg DESC");
        $stmt->execute([$seasonId, $userId]);
        $fieldStats = $stmt->fetchAll();
        
        // Convert to camelCase for consistency with frontend
        $result = array_map(function($row) {
            return [
                'id' => (int)$row['id'],
                'name' => $row['name'],
                'harvestCount' => (int)$row['harvest_count'],
                'totalCrates' => (int)$row['total_crates'],
                'totalOlivesKg' => (int)$row['total_olives_kg']
            ];
        }, $fieldStats);
        
        echo json_encode(['success' => true, 'data' => $result]);
        break;

    case 'field_crates_by_season':
        $stmt = $db->prepare("
            SELECT 
                s.id as season_id,
                s.name as season_name,
                f.id as field_id,
                f.name as field_name,
                COALESCE(SUM(h.crates), 0) as total_crates,
                COALESCE(SUM(h.olives_kg), 0) as total_olives_kg
            FROM seasons s
            JOIN harvests h ON s.id = h.season_id AND h.user_id = ?
            JOIN fields f ON h.field_id = f.id AND f.user_id = ?
            WHERE s.user_id = ?
            GROUP BY s.id, s.name, f.id, f.name
            ORDER BY s.start_date ASC, f.name ASC
        ");
        $stmt->execute([$userId, $userId, $userId]);
        $records = $stmt->fetchAll();

        $fields = [];
        $seasons = [];

        foreach ($records as $row) {
            $fieldId = (int)$row['field_id'];
            $seasonId = (int)$row['season_id'];

            if (!isset($fields[$fieldId])) {
                $fields[$fieldId] = [
                    'id' => $fieldId,
                    'name' => $row['field_name']
                ];
            }

            if (!isset($seasons[$seasonId])) {
                $seasons[$seasonId] = [
                    'id' => $seasonId,
                    'name' => $row['season_name']
                ];
            }
        }

        $normalizedRecords = array_map(function($row) {
            return [
                'seasonId' => (int)$row['season_id'],
                'seasonName' => $row['season_name'],
                'fieldId' => (int)$row['field_id'],
                'fieldName' => $row['field_name'],
                'totalCrates' => (int)$row['total_crates'],
                'totalOlivesKg' => (int)$row['total_olives_kg']
            ];
        }, $records);

        echo json_encode([
            'success' => true,
            'data' => [
                'records' => $normalizedRecords,
                'fields' => array_values($fields),
                'seasons' => array_values($seasons)
            ]
        ]);
        break;
        
    default:
        echo json_encode(['success' => false, 'error' => 'Invalid action']);
}

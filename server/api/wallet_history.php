<?php
// api/wallet_history.php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *'); // change for production

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  header('Access-Control-Allow-Methods: GET, OPTIONS');
  exit;
}

$user_id = $_GET['user_id'] ?? null;
if (!$user_id) {
  http_response_code(400);
  echo json_encode(['success'=>false,'error'=>'Missing user_id']);
  exit;
}

// DB config - update to your credentials
$DB_HOST = '127.0.0.1';
$DB_NAME = 'gotruck';
$DB_USER = 'db_user';
$DB_PASS = 'db_pass';

try {
  $pdo = new PDO("mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4", $DB_USER, $DB_PASS, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
  ]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['success'=>false,'error'=>'DB connection failed']);
  exit;
}

try {
  // get wallets
  $stmt = $pdo->prepare("SELECT reward_wallet, diesel_wallet FROM users WHERE id = :id LIMIT 1");
  $stmt->execute([':id' => $user_id]);
  $user = $stmt->fetch(PDO::FETCH_ASSOC);
  if (!$user) {
    echo json_encode(['success'=>false,'error'=>'User not found']);
    exit;
  }

  // get latest 200 transactions (adjust as needed)
  $tstmt = $pdo->prepare("SELECT id, type, wallet, amount, description, date_created as date FROM transactions WHERE user_id = :id ORDER BY date_created DESC LIMIT 200");
  $tstmt->execute([':id' => $user_id]);
  $transactions = $tstmt->fetchAll(PDO::FETCH_ASSOC);

  echo json_encode([
    'success' => true,
    'reward_wallet' => (int)$user['reward_wallet'],
    'diesel_wallet' => (int)$user['diesel_wallet'],
    'transactions' => $transactions
  ]);
  exit;
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['success'=>false,'error'=>'Server error']);
  exit;
}

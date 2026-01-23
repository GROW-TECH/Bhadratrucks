<?php
// server/db.php
// Put this outside web root or protect it. Use environment vars in production.
$DB_HOST = '127.0.0.1';
$DB_NAME = 'growtechnologies_bhadra';
$DB_USER = 'growtechnologies_bhadra';
$DB_PASS = 'Bhadra@123';
$DSN = "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4";
$options = [
  PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
  PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

try {
  $pdo = new PDO($DSN, $DB_USER, $DB_PASS, $options);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => 'DB connection failed', 'detail' => $e->getMessage()]);
  exit;
}

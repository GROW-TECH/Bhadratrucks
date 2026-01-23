<?php
require_once __DIR__.'/../db.php';
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=utf-8");

try {
  $stmt = $pdo->query("SELECT * FROM users ORDER BY created_at DESC");
  $users = $stmt->fetchAll();
  echo json_encode($users);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => 'Failed fetching users']);
}

<?php
require_once __DIR__.'/../db.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  try {
    $stmt = $pdo->query("SELECT * FROM orders ORDER BY created_at DESC");
    echo json_encode($stmt->fetchAll());
  } catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed fetching orders']);
  }
  exit;
}

if ($method === 'POST') {
  $body = json_decode(file_get_contents('php://input'), true);
  // Basic validation omitted — add checks in production
  $sql = "INSERT INTO orders
    (pickup_location, delivery_location, weight, material_type, vehicle_type, wheel_type, amount, advance, contact_number, assigned_to, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  $stmt = $pdo->prepare($sql);
  try {
    $stmt->execute([
      $body['pickup_location'] ?? '',
      $body['delivery_location'] ?? '',
      $body['weight'] ?? '',
      $body['material_type'] ?? '',
      $body['vehicle_type'] ?? '',
      $body['wheel_type'] ?? null,
      $body['amount'] ?? 0,
      $body['advance'] ?? 0,
      $body['contact_number'] ?? '',
      $body['assigned_to'] ?? null,
      $body['status'] ?? 'pending'
    ]);
    echo json_encode(['id' => $pdo->lastInsertId()]);
  } catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed creating order']);
  }
  exit;
}

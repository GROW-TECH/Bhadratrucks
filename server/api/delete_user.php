<?php
// server/api/delete_user.php
// Deletes a user by id. Expects JSON POST: { "userId": "<uuid>" }

require_once __DIR__ . '/../db.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Method not allowed']);
  exit;
}

$body = json_decode(file_get_contents('php://input'), true);
$userId = $body['userId'] ?? null;

if (!$userId) {
  http_response_code(400);
  echo json_encode(['error' => 'missing userId']);
  exit;
}

try {
  // Optionally: remove or reassign orders related to this user first (not done here).
  $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
  $stmt->execute([$userId]);

  // Check whether a row was deleted
  if ($stmt->rowCount() === 0) {
    http_response_code(404);
    echo json_encode(['error' => 'user not found']);
    exit;
  }

  echo json_encode(['success' => true]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => 'Failed to delete user', 'detail' => $e->getMessage()]);
}

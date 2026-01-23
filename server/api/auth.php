<?php
require_once __DIR__.'/../db.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

$body = json_decode(file_get_contents('php://input'), true);
$username = $body['username'] ?? '';
$password = $body['password'] ?? '';

$stmt = $pdo->prepare("SELECT id, username, password FROM admins WHERE username = ?");
$stmt->execute([$username]);
$admin = $stmt->fetch();

if ($admin && $password === $admin['password']) {
    echo json_encode([
        'id' => $admin['id'],
        'username' => $admin['username']
    ]);
} else {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid credentials']);
}

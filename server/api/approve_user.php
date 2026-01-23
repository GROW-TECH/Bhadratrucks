<?php
require_once __DIR__.'/../db.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

$body = json_decode(file_get_contents('php://input'), true);
$userId = $body['userId'] ?? null;
if (!$userId) { http_response_code(400); echo json_encode(['error'=>'missing userId']); exit; }

try {
  // approve user
  $u = $pdo->prepare("UPDATE users SET approval_status = 'approved' WHERE id = ?");
  $u->execute([$userId]);

  // reward referrer if exists
  $q = $pdo->prepare("SELECT referred_by FROM users WHERE id = ?");
  $q->execute([$userId]);
  $row = $q->fetch();
  if ($row && $row['referred_by']) {
    $ref = $pdo->prepare("SELECT id, reward_wallet FROM users WHERE referral_code = ?");
    $ref->execute([$row['referred_by']]);
    $referrer = $ref->fetch();
    if ($referrer) {
      $upd = $pdo->prepare("UPDATE users SET reward_wallet = reward_wallet + 50 WHERE id = ?");
      $upd->execute([$referrer['id']]);
    }
  }

  echo json_encode(['success' => true]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => 'Failed to approve user']);
}

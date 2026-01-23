<?php
// server/index.php - simple router for built-in PHP server (optional)
$path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);

if (preg_match('#^/api/#', $path)) {
  // Let /api/* be handled by real files inside /api/
  $file = __DIR__ . $path;
  if (file_exists($file)) {
    require $file;
    exit;
  } else {
    http_response_code(404);
    header("Content-Type: application/json; charset=utf-8");
    echo json_encode(['error' => 'Not found']);
    exit;
  }
}

// default: return simple message
header("Content-Type: text/plain; charset=utf-8");
echo "PHP API server\nAvailable endpoints: /api/users.php /api/orders.php /api/approve_user.php /api/delete_user.php /api/auth.php";

<?php
// api/register_user.php
header('Content-Type: application/json; charset=utf-8');

// Simple CORS allowance for local dev — remove/lock down in production
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    exit;
}
header('Access-Control-Allow-Origin: *');

$raw = file_get_contents('php://input');
if (!$raw) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Empty request']);
    exit;
}

$data = json_decode($raw, true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
    exit;
}

// required fields
$required = ['full_name','mobile_number','email','password','district','vehicle_type','wheel_type'];
foreach ($required as $r) {
    if (empty($data[$r])) {
        http_response_code(422);
        echo json_encode(['success' => false, 'error' => "Missing field: $r"]);
        exit;
    }
}

$full_name = trim($data['full_name']);
$mobile_number = trim($data['mobile_number']);
$email = trim($data['email']);
$password = $data['password'];
$mail_id = isset($data['mail_id']) ? trim($data['mail_id']) : null;
$district = trim($data['district']);
$vehicle_type = trim($data['vehicle_type']);
$wheel_type = trim($data['wheel_type']);
$referred_by = isset($data['referred_by']) && $data['referred_by'] !== '' ? trim($data['referred_by']) : null;
$created_at = date('Y-m-d H:i:s');

// basic validations (improve as needed)
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'Invalid email']);
    exit;
}
if (!preg_match('/^[0-9]{7,15}$/', $mobile_number)) {
    // allow 7-15 digits; adjust to 10 digits if you prefer
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'Invalid mobile number']);
    exit;
}

// hash password
$password_hash = password_hash($password, PASSWORD_DEFAULT);

// --- DB connection (update credentials) ---
$DB_HOST = 'localhost';
$DB_NAME = 'growtechnologies_bhadra';
$DB_USER = 'growtechnologies_bhadra';
$DB_PASS = 'Bhadra@123';

try {
    $pdo = new PDO("mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4", $DB_USER, $DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

// check duplicate email or mobile
try {
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = :email OR mobile_number = :mobile LIMIT 1");
    $stmt->execute([':email' => $email, ':mobile' => $mobile_number]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'error' => 'User with this email or mobile already exists']);
        exit;
    }

    // insert user with approval_status = 'pending' by default
    $insert = $pdo->prepare("INSERT INTO users 
        (full_name, email, password_hash, mobile_number, mail_id, district, vehicle_type, wheel_type, referral_code, referred_by, reward_wallet, diesel_wallet, approval_status, created_at)
        VALUES
        (:full_name, :email, :password_hash, :mobile_number, :mail_id, :district, :vehicle_type, :wheel_type, :referral_code, :referred_by, 0, 0, 'pending', :created_at)
    ");

    // generate a referral_code (simple random) — ensure uniqueness in DB ideally
    $referral_code = strtoupper(substr(md5(uniqid('', true)), 0, 8));

    $insert->execute([
        ':full_name' => $full_name,
        ':email' => $email,
        ':password_hash' => $password_hash,
        ':mobile_number' => $mobile_number,
        ':mail_id' => $mail_id,
        ':district' => $district,
        ':vehicle_type' => $vehicle_type,
        ':wheel_type' => $wheel_type,
        ':referral_code' => $referral_code,
        ':referred_by' => $referred_by,
        ':created_at' => $created_at,
    ]);

    $newId = $pdo->lastInsertId();

    // optionally: if referred_by present, you can credit referrer when admin approves (do it in approval flow)
    echo json_encode(['success' => true, 'user_id' => $newId]);
    exit;
} catch (Exception $e) {
    http_response_code(500);
    // DO NOT expose $e->getMessage() in production
    echo json_encode(['success' => false, 'error' => 'Server error']);
    exit;
}

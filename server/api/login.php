<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

require_once "../db.php"; // your DB connection

$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';

if ($username === "" || $password === "") {
    echo json_encode(["status" => "error", "message" => "Missing credentials"]);
    exit;
}

// prepare query
$stmt = $conn->prepare("SELECT id, username, password FROM admins WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["status" => "error", "message" => "Invalid username"]);
    exit;
}

$user = $result->fetch_assoc();

// password stored as plaintext? (NOT recommended)
// temporary check:
if ($password !== $user['password']) {
    echo json_encode(["status" => "error", "message" => "Invalid password"]);
    exit;
}

echo json_encode([
    "status" => "success",
    "message" => "Login successful",
    "user" => [
        "id" => $user['id'],
        "username" => $user['username']
    ]
]);

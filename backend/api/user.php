<?php
require_once __DIR__ . '/../bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$input = json_decode(file_get_contents('php://input'), true) ?: [];
$action = strtolower(trim((string)($_GET['action'] ?? $input['action'] ?? '')));

if ($method === 'GET' && $action === 'full') {
  require_auth();
  $uid = (int)$_SESSION['user_id'];
  $user = User::getById($uid);
  $stats = User::getStats($uid);
  Response::ok(['user'=>$user,'stats'=>$stats]);
}

if ($method === 'POST' && $action === 'update-preferences') {
  require_auth();
  $uid = (int)$_SESSION['user_id'];
  User::updatePreferences($uid, $input);
  Response::ok(['message'=>'Preferences updated']);
}

Response::error('Unsupported action', 400);

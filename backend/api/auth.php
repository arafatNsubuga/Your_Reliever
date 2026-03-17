<?php
require_once __DIR__ . '/../bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$input = json_decode(file_get_contents('php://input'), true) ?: [];
$action = strtolower(trim((string)($input['action'] ?? $_GET['action'] ?? '')));

if ($method === 'POST' && $action === 'register') {
  $name = trim((string)($input['fullname'] ?? ''));
  $email = strtolower(trim((string)($input['email'] ?? '')));
  $password = (string)($input['password'] ?? '');
  if (!$name || !$email || !$password) { Response::error('Missing fields', 422); }
  if (User::findByEmail($email)) { Response::error('Email already registered', 409); }
  $uid = User::create($name, $email, $password);
  $_SESSION['user_id'] = $uid;
  Response::ok(['message'=>'Registered','user_id'=>$uid]);
}

if ($method === 'POST' && $action === 'login') {
  $email = strtolower(trim((string)($input['email'] ?? '')));
  $password = (string)($input['password'] ?? '');
  if (!$email || !$password) { Response::error('Missing email or password', 422); }
  $row = User::findByEmail($email);
  if (!$row || !password_verify($password, $row['password_hash'])) {
    Response::error('Invalid credentials', 401);
  }
  $_SESSION['user_id'] = (int)$row['user_id'];
  Response::ok(['message'=>'Logged in']);
}

if ($method === 'POST' && $action === 'logout') {
  $_SESSION = [];
  if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
  }
  session_destroy();
  Response::ok(['message'=>'Logged out']);
}

Response::error('Unsupported action', 400);

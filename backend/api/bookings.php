<?php
require_once __DIR__ . '/../bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
  $action = strtolower(trim((string)($_GET['action'] ?? '')));
  if ($action === 'professionals') {
    $rows = User::professionals();
    Response::ok(['data'=>$rows]);
  }
}

if ($method === 'POST') {
  $input = json_decode(file_get_contents('php://input'), true) ?: [];
  $action = strtolower(trim((string)($input['action'] ?? '')));
  if ($action === 'create') {
    require_auth();
    $uid = (int)$_SESSION['user_id'];
    $proId = (int)($input['professional_id'] ?? 0);
    $date = (string)($input['appointment_date'] ?? '');
    $time = (string)($input['appointment_time'] ?? '');
    $type = (string)($input['booking_type'] ?? 'consultation');
    $problem = isset($input['problem']) ? (string)$input['problem'] : null;
    $meetup = isset($input['meetup']) ? (string)$input['meetup'] : null;
    if ($proId <= 0 || !$date || !$time) Response::error('Missing booking fields', 422);
    $id = Booking::create($uid, $proId, $date, $time, $type, $problem, $meetup);
    Response::ok(['booking_id'=>$id]);
  }
}

Response::error('Unsupported action', 400);

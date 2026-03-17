<?php
require_once __DIR__ . '/../bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
  $active = isset($_GET['active']) ? (int)$_GET['active'] : 1;
  $rows = Forum::list(['active'=>$active]);
  Response::ok(['data'=>$rows]);
}

if ($method === 'POST') {
  $input = json_decode(file_get_contents('php://input'), true) ?: [];
  $action = strtolower(trim((string)($input['action'] ?? '')));
  if ($action === 'join') {
    require_auth();
    $uid = (int)$_SESSION['user_id'];
    $forumId = (int)($input['forum_id'] ?? 0);
    if ($forumId <= 0) Response::error('Invalid forum');
    Forum::join($uid, $forumId);
    Response::ok(['message'=>'Joined']);
  }
}

Response::error('Unsupported action', 400);

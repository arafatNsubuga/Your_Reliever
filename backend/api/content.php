<?php
require_once __DIR__ . '/../bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = strtolower(trim((string)($_GET['action'] ?? '')));

if ($method === 'GET' && $action === 'list') {
  $type = isset($_GET['type']) ? (string)$_GET['type'] : null;
  $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 12;
  $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
  $search = isset($_GET['search']) ? (string)$_GET['search'] : '';
  $rows = Content::list(['type'=>$type,'limit'=>$limit,'offset'=>$offset,'search'=>$search]);
  Response::ok(['data'=>$rows]);
}

if ($method === 'GET' && $action === 'saved') {
  require_auth();
  $uid = (int)$_SESSION['user_id'];
  $rows = Content::savedByUser($uid);
  Response::ok(['data'=>$rows]);
}

if ($method === 'POST') {
  $input = json_decode(file_get_contents('php://input'), true) ?: [];
  $action = strtolower(trim((string)($input['action'] ?? '')));
  if (in_array($action, ['save','unsave'], true)) {
    require_auth();
    $uid = (int)$_SESSION['user_id'];
    $contentId = (int)($input['content_id'] ?? 0);
    if ($contentId <= 0) { Response::error('Invalid content id', 422); }
    if ($action === 'save') { Content::saveForUser($uid, $contentId); }
    if ($action === 'unsave') { Content::unsaveForUser($uid, $contentId); }
    Response::ok(['message'=>'ok']);
  }
}

Response::error('Unsupported action', 400);

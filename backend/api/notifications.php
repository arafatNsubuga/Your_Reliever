<?php
require_once __DIR__ . '/../bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
require_auth();
$uid = (int)$_SESSION['user_id'];

if ($method === 'GET') {
  $rem = Database::pdo()->prepare('SELECT reminder_id, title, remind_at, done FROM reminders WHERE user_id = ? ORDER BY remind_at DESC LIMIT 100');
  $rem->execute([$uid]);
  $not = Database::pdo()->prepare('SELECT notification_id, message, read_flag, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100');
  $not->execute([$uid]);
  Response::ok(['reminders'=>$rem->fetchAll(), 'notifications'=>$not->fetchAll()]);
}

if ($method === 'POST') {
  $input = json_decode(file_get_contents('php://input'), true) ?: [];
  $action = strtolower(trim((string)($input['action'] ?? '')));
  if ($action === 'mark-read') {
    $nid = (int)($input['notification_id'] ?? 0);
    $stmt = Database::pdo()->prepare('UPDATE notifications SET read_flag = 1 WHERE notification_id = ? AND user_id = ?');
    $stmt->execute([$nid, $uid]);
    Response::ok(['message'=>'Marked read']);
  }
  if ($action === 'toggle-reminder') {
    $rid = (int)($input['reminder_id'] ?? 0);
    $done = isset($input['done']) ? (int)!!$input['done'] : 1;
    $stmt = Database::pdo()->prepare('UPDATE reminders SET done = ? WHERE reminder_id = ? AND user_id = ?');
    $stmt->execute([$done, $rid, $uid]);
    Response::ok(['message'=>'Reminder updated']);
  }
}

Response::error('Unsupported action', 400);

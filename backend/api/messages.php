<?php
require_once __DIR__ . '/../bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
  $forumId = isset($_GET['forum_id']) ? (int)$_GET['forum_id'] : 0;
  $sinceId = isset($_GET['since_id']) ? (int)$_GET['since_id'] : 0;
  if ($forumId <= 0) Response::error('Invalid forum', 422);
  $sql = 'SELECT m.message_id, m.forum_id, m.user_id, u.full_name, m.message_type, m.content, m.created_at
          FROM forum_messages m JOIN users u ON u.user_id = m.user_id
          WHERE m.forum_id = ?' . ($sinceId > 0 ? ' AND m.message_id > ?' : '') . ' ORDER BY m.message_id ASC LIMIT 200';
  $stmt = Database::pdo()->prepare($sql);
  $stmt->execute($sinceId > 0 ? [$forumId, $sinceId] : [$forumId]);
  Response::ok(['data'=>$stmt->fetchAll()]);
}

if ($method === 'POST') {
  require_auth();
  $uid = (int)$_SESSION['user_id'];
  $input = json_decode(file_get_contents('php://input'), true) ?: [];
  $forumId = (int)($input['forum_id'] ?? 0);
  $type = (string)($input['message_type'] ?? 'text');
  $content = trim((string)($input['content'] ?? ''));
  if ($forumId <= 0 || !in_array($type, ['text','audio','video'], true)) Response::error('Invalid payload', 422);
  if ($type === 'text' && $content === '') Response::error('Empty message', 422);
  $stmt = Database::pdo()->prepare('INSERT INTO forum_messages (forum_id, user_id, message_type, content) VALUES (?,?,?,?)');
  $stmt->execute([$forumId, $uid, $type, $content]);
  $id = (int)Database::pdo()->lastInsertId();
  Response::ok(['message_id'=>$id]);
}

Response::error('Unsupported action', 400);

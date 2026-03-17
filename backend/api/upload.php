<?php
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  Response::error('Method not allowed', 405);
}

require_auth();
$uid = (int)$_SESSION['user_id'];
$type = isset($_POST['type']) ? (string)$_POST['type'] : '';
if (!in_array($type, ['video','image','article','news'], true)) {
  Response::error('Invalid type', 422);
}

if (!isset($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) {
  Response::error('No file uploaded', 422);
}

$uploadDir = __DIR__ . '/../uploads';
if (!is_dir($uploadDir)) { @mkdir($uploadDir, 0775, true); }

$orig = $_FILES['file']['name'];
$ext = pathinfo($orig, PATHINFO_EXTENSION);
$base = pathinfo($orig, PATHINFO_FILENAME);
$safeBase = preg_replace('/[^a-zA-Z0-9_-]+/','-', $base);
$fname = $safeBase . '-' . date('YmdHis') . ($ext?'.'.$ext:'');
$destFs = $uploadDir . '/' . $fname;
$destUrl = 'backend/uploads/' . $fname;

if (!move_uploaded_file($_FILES['file']['tmp_name'], $destFs)) {
  Response::error('Failed to save file', 500);
}

$stmt = Database::pdo()->prepare('INSERT INTO content (title, description, content_type, duration, file_path) VALUES (?,?,?,?,?)');
$stmt->execute([$safeBase, null, $type, null, $destUrl]);
$contentId = (int)Database::pdo()->lastInsertId();

Response::ok(['content_id'=>$contentId,'title'=>$safeBase,'file_path'=>$destUrl]);

<?php
$CONFIG = $CONFIG ?? require __DIR__ . '/config.php';

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

function db_mysqli(): mysqli {
  static $conn = null;
  if ($conn instanceof mysqli) { return $conn; }
  $db = $GLOBALS['CONFIG']['db'];
  $conn = new mysqli($db['host'], $db['user'], $db['pass'], $db['name'], (int)$db['port']);
  $conn->set_charset($db['charset']);
  return $conn;
}

$GLOBALS['mysqli'] = db_mysqli();

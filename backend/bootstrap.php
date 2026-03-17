<?php
// Bootstrap: sessions, config, autoload
if (session_status() === PHP_SESSION_NONE) {
  session_name('YRSESSID');
  session_start();
}

$CONFIG = require __DIR__ . '/config.php';

require_once __DIR__ . '/connection.php';

spl_autoload_register(function($class){
  $paths = [
    __DIR__ . '/lib/' . $class . '.php',
    __DIR__ . '/models/' . $class . '.php',
  ];
  foreach ($paths as $p) {
    if (is_file($p)) { require_once $p; return; }
  }
});

// Helper: get PDO
Database::init($CONFIG['db']);

function require_auth() {
  if (empty($_SESSION['user_id'])) {
    Response::json(['success'=>false,'message'=>'Not authenticated'], 401);
  }
}

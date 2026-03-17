<?php
// mysqli-backed compatibility 
class Database {
  private static $mysqli = null; 
  private static $pseudo = null; 

  public static function init(array $cfg): void {
    if (self::$mysqli) return;
    $host = $cfg['host'] ?? '127.0.0.1';
    $port = (int)($cfg['port'] ?? 3306);
    $user = $cfg['user'] ?? 'root';
    $pass = $cfg['pass'] ?? '';
    $name = $cfg['name'] ?? '';
    $charset = $cfg['charset'] ?? 'utf8mb4';

    $mysqli = @new \mysqli($host, $user, $pass, $name, $port);
    if ($mysqli->connect_errno) {
      throw new \RuntimeException('DB connect error: ' . $mysqli->connect_error);
    }
    if (!$mysqli->set_charset($charset)) {
      // continue; charset will be default
    }
    self::$mysqli = $mysqli;
    self::$pseudo = new PseudoPDO(self::$mysqli);
  }

  // Return a minimal PDO-like object
  public static function pdo() {
    if (!self::$pseudo) { throw new \RuntimeException('Database not initialized'); }
    return self::$pseudo;
  }
}

class PseudoPDO {
  private $db; // \mysqli
  public function __construct($mysqli) { $this->db = $mysqli; }

  public function prepare(string $sql) {
    return new PseudoStmt($this->db, $sql);
  }

  public function query(string $sql) {
    $res = $this->db->query($sql);
    if ($res === false) {
      throw new \RuntimeException('Query error: ' . $this->db->error);
    }
    return new PseudoResult($res);
  }

  public function lastInsertId(): int {
    return (int)$this->db->insert_id;
  }
}

class PseudoStmt {
  private $db; // \mysqli
  private $sql;
  private $result; // \mysqli_result|null

  public function __construct($mysqli, string $sql) {
    $this->db = $mysqli;
    $this->sql = $sql;
    $this->result = null;
  }

  public function execute(array $params = []): bool {
    $stmt = $this->db->prepare($this->sql);
    if (!$stmt) { throw new \RuntimeException('Prepare failed: ' . $this->db->error); }
    if (!empty($params)) {
      $types = '';
      $bind = [];
      foreach ($params as $p) {
        if (is_int($p)) { $types .= 'i'; }
        elseif (is_float($p)) { $types .= 'd'; }
        elseif (is_null($p)) { $types .= 's'; $p = null; }
        elseif (is_bool($p)) { $types .= 'i'; $p = $p ? 1 : 0; }
        else { $types .= 's'; }
        $bind[] = $p;
      }
      // mysqli requires references
      $refs = [];
      $refs[] = &$types;
      for ($i=0; $i<count($bind); $i++) { $refs[] = &$bind[$i]; }
      if (!call_user_func_array([$stmt, 'bind_param'], $refs)) {
        throw new \RuntimeException('bind_param failed');
      }
    }
    $ok = $stmt->execute();
    if ($ok) {
      $this->result = $stmt->get_result(); // may be null for non-SELECT
    } else {
      throw new \RuntimeException('Execute failed: ' . $stmt->error);
    }
    $stmt->close();
    return true;
  }

  public function fetch() {
    if (!$this->result) return null;
    return $this->result->fetch_assoc() ?: null;
  }

  public function fetchAll(): array {
    if (!$this->result) return [];
    $rows = [];
    while ($row = $this->result->fetch_assoc()) { $rows[] = $row; }
    return $rows;
  }
}

class PseudoResult {
  private $res; // \mysqli_result
  public function __construct($res) { $this->res = $res; }
  public function fetchAll(): array {
    $rows = [];
    while ($row = $this->res->fetch_assoc()) { $rows[] = $row; }
    $this->res->free();
    return $rows;
  }
}

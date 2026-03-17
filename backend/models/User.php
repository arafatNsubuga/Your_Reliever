<?php
class User {
  public int $user_id;
  public string $full_name;
  public string $email;
  public string $role;

  public static function findByEmail(string $email): ?array {
    $stmt = Database::pdo()->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $row = $stmt->fetch();
    return $row ?: null;
  }

  public static function create(string $full_name, string $email, string $password): int {
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = Database::pdo()->prepare('INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, "user")');
    $stmt->execute([$full_name, $email, $hash]);
    return (int)Database::pdo()->lastInsertId();
  }

  public static function getById(int $id): ?array {
    $stmt = Database::pdo()->prepare('SELECT user_id, full_name, email, role, created_at AS member_since FROM users WHERE user_id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ?: null;
  }

  public static function updatePreferences(int $userId, array $prefs): void {
    $stmt = Database::pdo()->prepare('INSERT INTO user_preferences (user_id, daily_reminders, dark_mode, email_notifications) VALUES (?,?,?,?)
      ON DUPLICATE KEY UPDATE daily_reminders=VALUES(daily_reminders), dark_mode=VALUES(dark_mode), email_notifications=VALUES(email_notifications)');
    $stmt->execute([
      $userId,
      isset($prefs['daily_reminders']) ? (int)!!$prefs['daily_reminders'] : 0,
      isset($prefs['dark_mode']) ? (int)!!$prefs['dark_mode'] : 0,
      isset($prefs['email_notifications']) ? (int)!!$prefs['email_notifications'] : 1,
    ]);
  }

  public static function getStats(int $userId): array {
    $stmt = Database::pdo()->prepare('SELECT days_active, sessions_completed, total_minutes, current_streak FROM user_stats WHERE user_id = ?');
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    if (!$row) {
      return ['days_active'=>0,'sessions_completed'=>0,'total_minutes'=>0,'current_streak'=>0];
    }
    return $row;
  }

  public static function professionals(): array {
    $sql = 'SELECT u.user_id, u.full_name, u.email, p.category, p.bio, p.location, p.rating
            FROM users u
            INNER JOIN professionals p ON p.user_id = u.user_id
            ORDER BY u.full_name';
    return Database::pdo()->query($sql)->fetchAll();
  }
}

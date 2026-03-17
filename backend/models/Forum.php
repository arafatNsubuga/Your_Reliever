<?php
class Forum {
  public static function list(array $opts): array {
    $active = isset($opts['active']) ? (int)$opts['active'] : 1;
    $sql = 'SELECT f.forum_id, f.forum_name, f.topic, f.group_name,
                   (SELECT COUNT(*) FROM forum_members m WHERE m.forum_id = f.forum_id) AS member_count
            FROM forums f WHERE f.active = ? ORDER BY f.forum_name';
    $stmt = Database::pdo()->prepare($sql);
    $stmt->execute([$active]);
    return $stmt->fetchAll();
  }

  public static function join(int $userId, int $forumId): void {
    $stmt = Database::pdo()->prepare('INSERT IGNORE INTO forum_members (forum_id, user_id) VALUES (?, ?)');
    $stmt->execute([$forumId, $userId]);
  }
}

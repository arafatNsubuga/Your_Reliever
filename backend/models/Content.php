<?php
class Content {
  public static function list(array $opts): array {
    $type = $opts['type'] ?? null;
    $limit = max(1, min(100, (int)($opts['limit'] ?? 12)));
    $offset = max(0, (int)($opts['offset'] ?? 0));
    $search = trim((string)($opts['search'] ?? ''));

    $where = [];$params=[];
    if ($type) { $where[] = 'content_type = ?'; $params[] = $type; }
    if ($search !== '') {
      $where[] = '(title LIKE ? OR description LIKE ?)';
      $params[] = "%$search%"; $params[] = "%$search%";
    }
    $sql = 'SELECT content_id, title, content_type, duration, file_path, created_at FROM content';
    if ($where) { $sql .= ' WHERE ' . implode(' AND ', $where); }
    $sql .= ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    $params[] = $limit; $params[] = $offset;
    $stmt = Database::pdo()->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
  }

  public static function savedByUser(int $userId): array {
    $sql = 'SELECT c.content_id, c.title, c.content_type, c.duration, c.file_path, c.created_at
            FROM saved_content s JOIN content c ON c.content_id = s.content_id
            WHERE s.user_id = ? ORDER BY s.created_at DESC';
    $stmt = Database::pdo()->prepare($sql);
    $stmt->execute([$userId]);
    return $stmt->fetchAll();
  }

  public static function saveForUser(int $userId, int $contentId): void {
    $stmt = Database::pdo()->prepare('INSERT IGNORE INTO saved_content (user_id, content_id) VALUES (?, ?)');
    $stmt->execute([$userId, $contentId]);
  }

  public static function unsaveForUser(int $userId, int $contentId): void {
    $stmt = Database::pdo()->prepare('DELETE FROM saved_content WHERE user_id = ? AND content_id = ?');
    $stmt->execute([$userId, $contentId]);
  }
}

<?php
// Simple PHP WebSocket server (RFC 6455 minimal) for chat messages
// Run with: php -d detect_unicode=0 backend/ws/server.php

require_once __DIR__ . '/../bootstrap.php';

$addr = '0.0.0.0';
$port = 8080;
$server = stream_socket_server("tcp://{$addr}:{$port}", $errno, $errstr);
if (!$server) { fwrite(STDERR, "Failed to bind: $errstr\n"); exit(1); }
stream_set_blocking($server, false);

$clients = []; // id => ['sock'=>resource,'handshaked'=>bool,'forum_id'=>int|null,'user_id'=>int|null]

function ws_encode(string $payload): string {
  $b1 = 0x81; // FIN + text frame
  $len = strlen($payload);
  if ($len <= 125) {
    return chr($b1) . chr($len) . $payload;
  } elseif ($len <= 65535) {
    return chr($b1) . chr(126) . pack('n', $len) . $payload;
  } else {
    return chr($b1) . chr(127) . pack('J', $len) . $payload; // 64-bit length
  }
}

function ws_decode(string $data): ?string {
  $bytes = unpack('Cfirst/Csecond', substr($data, 0, 2));
  if (!$bytes) return null;
  $masked = ($bytes['second'] & 0x80) === 0x80;
  $len = $bytes['second'] & 0x7F;
  $offset = 2;
  if ($len === 126) { $len = unpack('n', substr($data, $offset, 2))[1]; $offset += 2; }
  elseif ($len === 127) { $lenArr = unpack('J', substr($data, $offset, 8)); $len = $lenArr ? $lenArr[1] : 0; $offset += 8; }
  $mask = '';
  if ($masked) { $mask = substr($data, $offset, 4); $offset += 4; }
  $payload = substr($data, $offset, $len);
  if ($masked && $mask !== '') {
    $out = '';
    for ($i=0; $i<$len; $i++) { $out .= $payload[$i] ^ $mask[$i % 4]; }
    return $out;
  }
  return $payload;
}

function ws_handshake($sock, string $buffer): bool {
  if (!preg_match("/Sec-WebSocket-Key: (.*)\r\n/iU", $buffer, $m)) return false;
  $key = trim($m[1]);
  $accept = base64_encode(sha1($key . '258EAFA5-E914-47DA-95CA-C5AB0DC85B11', true));
  $headers = "HTTP/1.1 101 Switching Protocols\r\n" .
             "Upgrade: websocket\r\n" .
             "Connection: Upgrade\r\n" .
             "Sec-WebSocket-Accept: {$accept}\r\n\r\n";
  fwrite($sock, $headers);
  return true;
}

function broadcast(array &$clients, int $forumId, array $payload): void {
  $msg = ws_encode(json_encode($payload));
  foreach ($clients as $id => $cli) {
    if (!isset($cli['forum_id']) || (int)$cli['forum_id'] !== $forumId) continue;
    @fwrite($cli['sock'], $msg);
  }
}

function persist_message(int $forumId, int $userId, string $content): array {
  $stmt = Database::pdo()->prepare('INSERT INTO forum_messages (forum_id, user_id, message_type, content) VALUES (?,?,"text",?)');
  $stmt->execute([$forumId, $userId, $content]);
  $id = (int)Database::pdo()->lastInsertId();
  // Fetch enriched row (with user name and timestamp)
  $q = Database::pdo()->prepare('SELECT m.message_id, m.forum_id, m.user_id, u.full_name, m.message_type, m.content, m.created_at FROM forum_messages m JOIN users u ON u.user_id = m.user_id WHERE m.message_id = ?');
  $q->execute([$id]);
  return $q->fetch() ?: [
    'message_id'=>$id,
    'forum_id'=>$forumId,
    'user_id'=>$userId,
    'full_name'=>null,
    'message_type'=>'text',
    'content'=>$content,
    'created_at'=>date('Y-m-d H:i:s'),
  ];
}

function now_ms(): int { return (int)floor(microtime(true)*1000); }

echo "WebSocket server listening on ws://{$addr}:{$port}\n";

while (true) {
  $read = [$server];
  foreach ($clients as $c) { $read[] = $c['sock']; }
  $write = $except = [];
  @stream_select($read, $write, $except, 1);

  if (in_array($server, $read, true)) {
    $sock = @stream_socket_accept($server, 0);
    if ($sock) {
      stream_set_blocking($sock, false);
      $clients[(int)$sock] = ['sock'=>$sock,'handshaked'=>false];
    }
    $read = array_diff($read, [$server]);
  }

  foreach ($read as $sock) {
    $id = (int)$sock;
    $buf = @fread($sock, 8192);
    if ($buf === '' || $buf === false) {
      @fclose($sock); unset($clients[$id]); continue;
    }

    if (!$clients[$id]['handshaked']) {
      if (ws_handshake($sock, $buf)) {
        $clients[$id]['handshaked'] = true;
      } else {
        @fclose($sock); unset($clients[$id]);
      }
      continue;
    }

    $decoded = ws_decode($buf);
    if ($decoded === null) { continue; }
    $data = json_decode($decoded, true);
    if (!is_array($data)) { continue; }

    $type = $data['type'] ?? '';
    if ($type === 'join') {
      $forumId = (int)($data['forum_id'] ?? 0);
      $userId = (int)($data['user_id'] ?? 0);
      $clients[$id]['forum_id'] = $forumId;
      $clients[$id]['user_id'] = $userId;
      // Ack
      @fwrite($sock, ws_encode(json_encode(['type'=>'joined','ts'=>now_ms(),'forum_id'=>$forumId])));
    } elseif ($type === 'message') {
      $forumId = (int)($clients[$id]['forum_id'] ?? 0);
      $userId = (int)($clients[$id]['user_id'] ?? 0);
      $content = trim((string)($data['content'] ?? ''));
      if ($forumId > 0 && $userId > 0 && $content !== '') {
        $row = persist_message($forumId, $userId, $content);
        broadcast($clients, $forumId, ['type'=>'message','data'=>$row]);
      }
    }
  }
}

<?php
class Response {
  public static function json($data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
  }

  public static function ok($data = []): void {
    self::json(array_merge(['success'=>true], $data));
  }

  public static function error(string $message, int $status = 400): void {
    self::json(['success'=>false,'message'=>$message], $status);
  }
}

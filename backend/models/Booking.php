<?php
class Booking {
  public static function create(int $userId, int $professionalId, string $date, string $time, string $type, ?string $problem = null, ?string $meetup = null): int {
    $stmt = Database::pdo()->prepare('INSERT INTO bookings (user_id, professional_id, appointment_date, appointment_time, booking_type, problem_desc, meetup_type) VALUES (?,?,?,?,?,?,?)');
    $stmt->execute([$userId, $professionalId, $date, $time, $type, $problem, $meetup]);
    $id = (int)Database::pdo()->lastInsertId();

    // Add reminder and notification
    $msg = 'Booking with professional #' . $professionalId . ' on ' . $date . ' ' . $time . ' created.';
    $stmt2 = Database::pdo()->prepare('INSERT INTO reminders (user_id, title, remind_at) VALUES (?, ?, ?)');
    $stmt2->execute([$userId, 'Professional booking', $date . ' ' . $time]);
    $stmt3 = Database::pdo()->prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)');
    $stmt3->execute([$userId, 'Booking successful: ' . $msg]);
    return $id;
  }
}

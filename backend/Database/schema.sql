-- YourReliever schema
CREATE DATABASE IF NOT EXISTS yourreliever CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE yourreliever;

-- Users and auth
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user','professional','admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id INT PRIMARY KEY,
  daily_reminders TINYINT(1) NOT NULL DEFAULT 0,
  dark_mode TINYINT(1) NOT NULL DEFAULT 0,
  email_notifications TINYINT(1) NOT NULL DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_prefs_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_stats (
  user_id INT PRIMARY KEY,
  days_active INT NOT NULL DEFAULT 0,
  sessions_completed INT NOT NULL DEFAULT 0,
  total_minutes INT NOT NULL DEFAULT 0,
  current_streak INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_user_stats_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Professionals (normalized)
CREATE TABLE IF NOT EXISTS professionals (
  user_id INT PRIMARY KEY,
  category ENUM('counsellors','psychologists','motivational-speakers','religious-leaders') NULL,
  bio TEXT NULL,
  location VARCHAR(160) NULL,
  rating DECIMAL(3,2) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_prof_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS specialties (
  specialty_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS professional_specialties (
  user_id INT NOT NULL,
  specialty_id INT NOT NULL,
  PRIMARY KEY (user_id, specialty_id),
  CONSTRAINT fk_ps_user FOREIGN KEY (user_id) REFERENCES professionals(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_ps_spec FOREIGN KEY (specialty_id) REFERENCES specialties(specialty_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Content library
CREATE TABLE IF NOT EXISTS content (
  content_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  content_type ENUM('video','image','article','news') NOT NULL,
  duration INT NULL,
  file_path VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS saved_content (
  user_id INT NOT NULL,
  content_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id, content_id),
  CONSTRAINT fk_saved_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_saved_content FOREIGN KEY (content_id) REFERENCES content(content_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Forums
CREATE TABLE IF NOT EXISTS forums (
  forum_id INT AUTO_INCREMENT PRIMARY KEY,
  forum_name VARCHAR(160) NOT NULL,
  topic VARCHAR(160) NULL,
  group_name VARCHAR(160) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS forum_members (
  forum_id INT NOT NULL,
  user_id INT NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (forum_id, user_id),
  CONSTRAINT fk_member_forum FOREIGN KEY (forum_id) REFERENCES forums(forum_id) ON DELETE CASCADE,
  CONSTRAINT fk_member_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS forum_messages (
  message_id INT AUTO_INCREMENT PRIMARY KEY,
  forum_id INT NOT NULL,
  user_id INT NOT NULL,
  message_type ENUM('text','audio','video') NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_msg_forum FOREIGN KEY (forum_id) REFERENCES forums(forum_id) ON DELETE CASCADE,
  CONSTRAINT fk_msg_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  booking_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  professional_id INT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  booking_type VARCHAR(60) NOT NULL,
  problem_desc TEXT NULL,
  meetup_type ENUM('video','audio','physical') NULL,
  status ENUM('pending','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_booking_prof FOREIGN KEY (professional_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Reminders and notifications
CREATE TABLE IF NOT EXISTS reminders (
  reminder_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  remind_at DATETIME NOT NULL,
  done TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rem_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message VARCHAR(255) NOT NULL,
  read_flag TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Seed some sample data
INSERT INTO users (full_name, email, password_hash, role) VALUES
  ('Dr. Alice Brown','alice@example.com', '$2y$10$9uM1bUuX7w3QkC6QwKcB5OaR2Yt1R5pQZ1mX0LwXw8nS6S3Xn8X9a', 'professional'),
  ('Dr. Peter Baker','peter@example.com', '$2y$10$9uM1bUuX7w3QkC6QwKcB5OaR2Yt1R5pQZ1mX0LwXw8nS6S3Xn8X9a', 'professional'),
  ('Jane Doe','jane@example.com', '$2y$10$9uM1bUuX7w3QkC6QwKcB5OaR2Yt1R5pQZ1mX0LwXw8nS6S3Xn8X9a', 'user')
ON DUPLICATE KEY UPDATE email = email;

-- Seed professionals table from users with role='professional'
INSERT INTO professionals (user_id, category)
  SELECT u.user_id,
         'psychologists' AS category
  FROM users u
  LEFT JOIN professionals p ON p.user_id = u.user_id
  WHERE u.role = 'professional' AND p.user_id IS NULL;

INSERT INTO forums (forum_name, topic, group_name, active) VALUES
 ('Mindful Breathing', 'Stress Relief', 'Wellness', 1),
 ('Exam Anxiety Support', 'Study Pressure', 'Students', 1),
 ('Daily Gratitude', 'Positivity', 'Community', 1),
 ('Sleep Better', 'Sleep Hygiene', 'Wellness', 1)
ON DUPLICATE KEY UPDATE forum_name = forum_name;

INSERT INTO content (title, description, content_type, duration, file_path) VALUES
 ('Managing Daily Stress', 'Article on stress management', 'article', NULL, NULL),
 ('Breathing Techniques', '5-minute guided breathing', 'video', 5, NULL),
 ('Campus Wellness Update', 'Latest news from wellness center', 'news', NULL, NULL)
;

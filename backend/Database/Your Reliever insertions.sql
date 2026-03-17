USE yourreliever;

-- 1) Create or update 8 professional user accounts
INSERT INTO users (full_name, email, password_hash, role)
VALUES
  ('Dr. Bongomin Ronald',  'bongomin.ronald@gmail.com',    '$2y$10$9uM1bUuX7w3QkC6QwKcB5OaR2Yt1R5pQZ1mX0LwXw8nS6S3Xn8X9a', 'professional'),
  ('Rev. Habimaana Adelin','habimaana.adelin@gmail.com',   '$2y$10$9uM1bUuX7w3QkC6QwKcB5OaR2Yt1R5pQZ1mX0LwXw8nS6S3Xn8X9a', 'professional'),
  ('Dr. Samuel Otieno',    'sam.otieno@gmail.com',         '$2y$10$9uM1bUuX7w3QkC6QwKcB5OaR2Yt1R5pQZ1mX0LwXw8nS6S3Xn8X9a', 'professional'),
  ('Dr. Grace Wanjiku',    'grace.wanjiku@gmail.com',      '$2y$10$9uM1bUuX7w3QkC6QwKcB5OaR2Yt1R5pQZ1mX0LwXw8nS6S3Xn8X9a', 'professional'),
  ('Coach Daniel Mwangi',  'daniel.mwangi@gmail.com',      '$2y$10$9uM1bUuX7w3QkC6QwKcB5OaR2Yt1R5pQZ1mX0LwXw8nS6S3Xn8X9a', 'professional'),
  ('Imam Ahmed Yusuf',     'ahmed.yusuf@gmail.com',        '$2y$10$9uM1bUuX7w3QkC6QwKcB5OaR2Yt1R5pQZ1mX0LwXw8nS6S3Xn8X9a', 'professional'),
  ('Pastor Ruth Njeri',    'ruth.njeri@gmail.com',         '$2y$10$9uM1bUuX7w3QkC6QwKcB5OaR2Yt1R5pQZ1mX0LwXw8nS6S3Xn8X9a', 'professional'),
  ('Dr. Peter Ndungu',     'peter.ndungu@gmail.com',       '$2y$10$9uM1bUuX7w3QkC6QwKcB5OaR2Yt1R5pQZ1mX0LwXw8nS6S3Xn8X9a', 'professional')
ON DUPLICATE KEY UPDATE
  email = VALUES(email),
  role = VALUES(role);

-- 2) Map these users into professionals with categories (skip if already present)
INSERT INTO professionals (user_id, category, bio, location, rating)
SELECT u.user_id,
       CASE u.email
         WHEN 'bongomin.ronald@gmail.com'   THEN 'psychologists'
         WHEN 'habimaana.adelin@gmail.com'  THEN 'religious-leaders'
         WHEN 'sam.otieno@gmail.com'        THEN 'counsellors'
         WHEN 'grace.wanjiku@gmail.com'     THEN 'psychologists'
         WHEN 'daniel.mwangi@gmail.com'     THEN 'motivational-speakers'
         WHEN 'ahmed.yusuf@gmail.com'       THEN 'religious-leaders'
         WHEN 'ruth.njeri@gmail.com'        THEN 'counsellors'
         WHEN 'peter.ndungu@gmail.com'      THEN 'motivational-speakers'
       END AS category,
       NULL AS bio,
       NULL AS location,
       NULL AS rating
FROM users u
LEFT JOIN professionals p ON p.user_id = u.user_id
WHERE u.email IN (
  'bongomin.ronald@gmail.com','habimaana.adelin@gmail.com','sam.otieno@gmail.com','grace.wanjiku@gmail.com',
  'daniel.mwangi@gmail.com','ahmed.yusuf@gmail.com','ruth.njeri@gmail.com','peter.ndungu@gmail.com'
)
AND p.user_id IS NULL;


INSERT INTO content (title, description, content_type, duration, file_path)
VALUES
  ('Mindful Breathing ', 'Guided meditation session', 'video', 10, 'https://www.youtube.com/watch?v=y8KSid0WFwY'),
  ('Grounding Techniques', 'Simple grounding steps for anxiety', 'article', NULL, 'https://www.helpguide.org/mental-health/stress/stress-management'),
  ('Box Breathing ', 'Calming breath exercise', 'video', 7, 'https://www.youtube.com/watch?v=1WIHlVZcrzs'),
  ('Sleep Hygiene Tips', 'Improve sleep quality with routines', 'article', NULL, 'https://medlineplus.gov/ency/article/001942.htm'),
  ('Gratitude Journal Cover', 'Printable journal cover', 'image', NULL, 'https://picsum.photos/id/1011/1200/800'),
  ('Mental Health Awareness', 'Latest mental health news highlights', 'news', NULL, 'https://www.unicef.org/press-releases'),
  ('Mindful Breathing ', 'Guided meditation session', 'video', 10, 'https://www.youtube.com/watch?v=y8KSid0WFwY'),
  ('CDC Mental Health', 'CDC mental health resources and updates', 'news', NULL, 'https://www.cdc.gov/mentalhealth/'),
  ('CDC Newsroom', 'Latest public health news from CDC', 'news', NULL, 'https://www.cdc.gov/media/index.html'),
  ('NIH News Releases', 'U.S. National Institutes of Health news releases', 'news', NULL, 'https://www.nih.gov/news-events/news-releases');
  

INSERT INTO forums (forum_name, topic, group_name, active) VALUES
  ('Mindful Breathing', 'Stress Relief', 'Wellness', 1),
  ('Exam Anxiety Support', 'Study Pressure', 'Students', 1),
  ('Daily Gratitude', 'Positivity', 'Community', 1),
  ('Sleep Better', 'Sleep Hygiene', 'Wellness', 1),
  ('Anxiety Coping Skills', 'Coping Strategies', 'Community', 1),
  ('Mindfulness Beginners', 'Mindfulness Basics', 'Wellness', 1);

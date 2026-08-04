-- Create database and tables for the Magical Room project
CREATE DATABASE IF NOT EXISTS magical_room CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE magical_room;

CREATE TABLE IF NOT EXISTS posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200),
  content TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT,
  author VARCHAR(100),
  text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Sample data
INSERT INTO posts (title, content) VALUES ('第一次发布', '这是我的梦境笔记本第一条发布～');
INSERT INTO posts (title, content) VALUES ('色彩测试', '今天调了新的魔法滤镜');

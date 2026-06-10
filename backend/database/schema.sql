-- ============================================
-- Smart Task Management System - Database Schema
-- ============================================

-- Create database (run once)
CREATE DATABASE IF NOT EXISTS smart_task_db;
USE smart_task_db;

-- --------------------------------------------
-- Table: users
-- Stores registered user accounts
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------
-- Table: tasks
-- Each task belongs to one user (user_id FK)
-- ON DELETE CASCADE: deleting a user removes their tasks
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status ENUM('pending', 'completed') DEFAULT 'pending',
  is_priority TINYINT(1) NOT NULL DEFAULT 0,
  priority_order INT NOT NULL DEFAULT 0,
  due_date DATETIME NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  user_id INT NOT NULL,
  updated_by INT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_priority ON tasks(is_priority, priority_order);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- ============================================
-- Sample test users (password: password123)
-- Hashed with bcrypt (10 salt rounds)
-- ============================================
INSERT INTO users (name, email, password) VALUES
('John Doe', 'john@example.com', '$2a$10$cw75IkqY8T6DxRetsfDyxOAuh73KlTnA69.RN0l64GNzViHndW0qS'),
('Jane Smith', 'jane@example.com', '$2a$10$cw75IkqY8T6DxRetsfDyxOAuh73KlTnA69.RN0l64GNzViHndW0qS');

-- Sample tasks for user id 1 (John) — some on priority board
INSERT INTO tasks (title, description, status, user_id, is_priority, priority_order) VALUES
('Complete React project', 'Build task manager with JWT auth', 'pending', 1, 1, 0),
('Study Node.js APIs', 'Review Express middleware and REST', 'completed', 1, 0, 0),
('Prepare for interview', 'Practice JWT flow and MySQL joins', 'pending', 1, 1, 1);

-- Sample tasks for user id 2 (Jane)
INSERT INTO tasks (title, description, status, user_id, is_priority, priority_order) VALUES
('Buy groceries', 'Milk, eggs, bread', 'pending', 2, 0, 0),
('Morning workout', '30 min cardio', 'completed', 2, 0, 0);

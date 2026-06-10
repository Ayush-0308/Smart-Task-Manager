-- Migration: workspace management system
USE smart_task_db;

ALTER TABLE users ADD COLUMN onboarding_completed TINYINT(1) NOT NULL DEFAULT 0;

CREATE TABLE workspaces (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  type ENUM('individual', 'team') NOT NULL DEFAULT 'individual',
  room_code VARCHAR(8) NULL UNIQUE,
  owner_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE workspace_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('owner', 'member') NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_workspace_user (workspace_id, user_id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE workspace_activity (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL,
  user_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  details TEXT,
  task_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE tasks ADD COLUMN workspace_id INT NULL;
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX idx_tasks_workspace ON tasks(workspace_id);

-- Mark existing users as onboarded
UPDATE users SET onboarding_completed = 1;

-- Create personal workspace for each user and migrate their tasks
INSERT INTO workspaces (name, type, owner_id)
SELECT CONCAT(name, '''s Workspace'), 'individual', id FROM users;

INSERT INTO workspace_members (workspace_id, user_id, role)
SELECT w.id, w.owner_id, 'owner' FROM workspaces w WHERE w.type = 'individual';

UPDATE tasks t
JOIN users u ON t.user_id = u.id
JOIN workspaces w ON w.owner_id = u.id AND w.type = 'individual'
SET t.workspace_id = w.id;

-- Migration: collaborative tasks + priority board (run once on existing DB)
USE smart_task_db;

ALTER TABLE tasks
  ADD COLUMN is_priority TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN priority_order INT NOT NULL DEFAULT 0,
  ADD COLUMN updated_by INT NULL;

ALTER TABLE tasks
  ADD CONSTRAINT fk_tasks_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_tasks_priority ON tasks(is_priority, priority_order);

-- Mark sample urgent tasks for the priority board
UPDATE tasks SET is_priority = 1, priority_order = 0 WHERE id = 1;
UPDATE tasks SET is_priority = 1, priority_order = 1 WHERE id = 3;

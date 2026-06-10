-- Migration: due dates, completion timestamps
USE smart_task_db;

ALTER TABLE tasks ADD COLUMN due_date DATETIME NULL;
ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMP NULL;

CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Set completed_at for existing completed tasks
UPDATE tasks SET completed_at = updated_at WHERE status = 'completed' AND completed_at IS NULL;

-- Sample due dates for demo
UPDATE tasks SET due_date = DATE_ADD(NOW(), INTERVAL 2 DAY) WHERE id = 1;
UPDATE tasks SET due_date = DATE_ADD(NOW(), INTERVAL -1 DAY) WHERE id = 4;
UPDATE tasks SET due_date = DATE_ADD(NOW(), INTERVAL 6 HOUR) WHERE id = 3;

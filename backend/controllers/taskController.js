/**
 * Task Controller — workspace-scoped collaborative CRUD
 */
const { pool } = require('../config/db');
const { logActivity } = require('./workspaceController');

const TASK_SELECT = `
  SELECT t.*, u.name AS creator_name, e.name AS updated_by_name
  FROM tasks t
  LEFT JOIN users u ON t.user_id = u.id
  LEFT JOIN users e ON t.updated_by = e.id
`;

const buildSortClause = (sortBy, sortOrder) => {
  const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
  switch (sortBy) {
    case 'due_date':
      return `ORDER BY t.due_date IS NULL, t.due_date ${order}, t.created_at DESC`;
    case 'priority':
      return `ORDER BY t.is_priority DESC, t.priority_order ASC, t.created_at DESC`;
    case 'status':
      return `ORDER BY t.status ${order}, t.created_at DESC`;
    case 'completed_at':
      return `ORDER BY t.completed_at IS NULL, t.completed_at ${order}`;
    case 'created_at':
    default:
      return `ORDER BY t.created_at ${order}`;
  }
};

const getTaskByIdQuery = async (taskId, workspaceId) => {
  const [tasks] = await pool.query(
    `${TASK_SELECT} WHERE t.id = ? AND t.workspace_id = ?`,
    [taskId, workspaceId]
  );
  return tasks[0] || null;
};

const parseDueDate = (dueDate) => {
  if (!dueDate) return null;
  const parsed = new Date(dueDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getTaskStats = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN status = 'pending' AND is_priority = 1 THEN 1 ELSE 0 END) AS urgent,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN status = 'pending' AND due_date IS NOT NULL AND due_date < NOW() THEN 1 ELSE 0 END) AS overdue
      FROM tasks WHERE workspace_id = ?`,
      [req.workspaceId]
    );
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('GetTaskStats error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching stats' });
  }
};

const getTasks = async (req, res) => {
  try {
    const { status, search, priority, exclude_priority, overdue, sort_by, sort_order } = req.query;
    let query = `${TASK_SELECT} WHERE t.workspace_id = ?`;
    const params = [req.workspaceId];

    if (priority === 'true') query += ' AND t.is_priority = 1';
    if (exclude_priority === 'true') query += ' AND t.is_priority = 0';
    if (status && status !== 'all') {
      query += ' AND t.status = ?';
      params.push(status);
    }
    if (overdue === 'true') {
      query += " AND t.status = 'pending' AND t.due_date IS NOT NULL AND t.due_date < NOW()";
    }
    if (search?.trim()) {
      query += ' AND (t.title LIKE ? OR t.description LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    query += ` ${buildSortClause(sort_by, sort_order)}`;
    const [tasks] = await pool.query(query, params);
    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    console.error('GetTasks error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching tasks' });
  }
};

const getPriorityTasks = async (req, res) => {
  try {
    const [tasks] = await pool.query(
      `${TASK_SELECT} WHERE t.workspace_id = ? AND t.is_priority = 1 AND t.status = 'pending'
       ORDER BY t.priority_order ASC, t.created_at DESC`,
      [req.workspaceId]
    );
    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    console.error('GetPriorityTasks error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching priority tasks' });
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await getTaskByIdQuery(req.params.id, req.workspaceId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (error) {
    console.error('GetTaskById error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, status, is_priority, due_date } = req.body;
    const taskStatus = status || 'pending';
    const onPriorityBoard = is_priority && taskStatus === 'pending' ? 1 : 0;
    let priorityOrder = 0;
    const dueDate = parseDueDate(due_date);
    const completedAt = taskStatus === 'completed' ? new Date() : null;

    if (onPriorityBoard) {
      const [maxOrder] = await pool.query(
        'SELECT COALESCE(MAX(priority_order), -1) + 1 AS next_order FROM tasks WHERE is_priority = 1 AND workspace_id = ?',
        [req.workspaceId]
      );
      priorityOrder = maxOrder[0].next_order;
    }

    const [result] = await pool.query(
      `INSERT INTO tasks (title, description, status, user_id, workspace_id, is_priority, priority_order, updated_by, due_date, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title.trim(), description || '', taskStatus, req.user.id, req.workspaceId, onPriorityBoard, priorityOrder, req.user.id, dueDate, completedAt]
    );

    await logActivity(req.workspaceId, req.user.id, 'task_created', `Created task "${title.trim()}"`, result.insertId);
    const newTask = await getTaskByIdQuery(result.insertId, req.workspaceId);
    res.status(201).json({ success: true, message: 'Task created successfully', data: newTask });
  } catch (error) {
    console.error('CreateTask error:', error);
    res.status(500).json({ success: false, message: 'Server error creating task' });
  }
};

const updateTask = async (req, res) => {
  try {
    const { title, description, status, is_priority, due_date } = req.body;
    const taskId = req.params.id;

    const [existing] = await pool.query(
      'SELECT id, is_priority, status FROM tasks WHERE id = ? AND workspace_id = ?',
      [taskId, req.workspaceId]
    );
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Task not found' });

    const taskStatus = status || 'pending';
    const dueDate = due_date === '' || due_date === null ? null : parseDueDate(due_date);
    let priorityOrder = 0;
    let onPriorityBoard = 0;

    if (taskStatus !== 'completed') {
      const wantsPriority = is_priority === true || is_priority === 1;
      onPriorityBoard = wantsPriority ? 1 : 0;
      if (wantsPriority) {
        if (!existing[0].is_priority) {
          const [maxOrder] = await pool.query(
            'SELECT COALESCE(MAX(priority_order), -1) + 1 AS next_order FROM tasks WHERE is_priority = 1 AND workspace_id = ?',
            [req.workspaceId]
          );
          priorityOrder = maxOrder[0].next_order;
        } else {
          const [current] = await pool.query('SELECT priority_order FROM tasks WHERE id = ?', [taskId]);
          priorityOrder = current[0].priority_order;
        }
      }
    }

    await pool.query(
      `UPDATE tasks SET title = ?, description = ?, status = ?,
       is_priority = ?, priority_order = ?, updated_by = ?, due_date = ?,
       completed_at = CASE WHEN ? = 'completed' THEN COALESCE(completed_at, NOW()) ELSE NULL END
       WHERE id = ? AND workspace_id = ?`,
      [title.trim(), description || '', taskStatus, onPriorityBoard, onPriorityBoard ? priorityOrder : 0, req.user.id, dueDate, taskStatus, taskId, req.workspaceId]
    );

    await logActivity(req.workspaceId, req.user.id, 'task_updated', `Updated task "${title.trim()}"`, taskId);
    const updated = await getTaskByIdQuery(taskId, req.workspaceId);
    res.json({ success: true, message: 'Task updated successfully', data: updated });
  } catch (error) {
    console.error('UpdateTask error:', error);
    res.status(500).json({ success: false, message: 'Server error updating task' });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const taskId = req.params.id;
    if (!status || !['pending', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be pending or completed' });
    }

    const [existing] = await pool.query(
      'SELECT title FROM tasks WHERE id = ? AND workspace_id = ?',
      [taskId, req.workspaceId]
    );
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Task not found' });

    const isCompleting = status === 'completed';
    await pool.query(
      `UPDATE tasks SET status = ?, updated_by = ?,
       completed_at = ${isCompleting ? 'NOW()' : 'NULL'},
       is_priority = ${isCompleting ? '0' : 'is_priority'},
       priority_order = ${isCompleting ? '0' : 'priority_order'}
       WHERE id = ? AND workspace_id = ?`,
      [status, req.user.id, taskId, req.workspaceId]
    );

    await logActivity(
      req.workspaceId,
      req.user.id,
      isCompleting ? 'task_completed' : 'task_restored',
      `${isCompleting ? 'Completed' : 'Restored'} task "${existing[0].title}"`,
      taskId
    );

    const updated = await getTaskByIdQuery(taskId, req.workspaceId);
    res.json({ success: true, message: isCompleting ? 'Task marked complete' : 'Task restored to active', data: updated });
  } catch (error) {
    console.error('UpdateTaskStatus error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateTaskPriority = async (req, res) => {
  try {
    const { is_priority } = req.body;
    const taskId = req.params.id;

    const [existing] = await pool.query(
      'SELECT id, status, title FROM tasks WHERE id = ? AND workspace_id = ?',
      [taskId, req.workspaceId]
    );
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Task not found' });
    if (existing[0].status === 'completed' && is_priority) {
      return res.status(400).json({ success: false, message: 'Completed tasks cannot be added to the urgent board' });
    }

    let priorityOrder = 0;
    if (is_priority) {
      const [maxOrder] = await pool.query(
        'SELECT COALESCE(MAX(priority_order), -1) + 1 AS next_order FROM tasks WHERE is_priority = 1 AND workspace_id = ?',
        [req.workspaceId]
      );
      priorityOrder = maxOrder[0].next_order;
    }

    await pool.query(
      'UPDATE tasks SET is_priority = ?, priority_order = ?, updated_by = ? WHERE id = ? AND workspace_id = ?',
      [is_priority ? 1 : 0, priorityOrder, req.user.id, taskId, req.workspaceId]
    );

    await logActivity(
      req.workspaceId,
      req.user.id,
      is_priority ? 'priority_added' : 'priority_removed',
      `${is_priority ? 'Marked' : 'Removed'} "${existing[0].title}" ${is_priority ? 'as urgent' : 'from urgent board'}`,
      taskId
    );

    const updated = await getTaskByIdQuery(taskId, req.workspaceId);
    res.json({
      success: true,
      message: is_priority ? 'Task added to priority board' : 'Task removed from priority board',
      data: updated,
    });
  } catch (error) {
    console.error('UpdateTaskPriority error:', error);
    res.status(500).json({ success: false, message: 'Server error updating priority' });
  }
};

const reorderPriorityBoard = async (req, res) => {
  try {
    const { taskIds } = req.body;
    if (!Array.isArray(taskIds)) {
      return res.status(400).json({ success: false, message: 'taskIds must be an array' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (let i = 0; i < taskIds.length; i++) {
        await connection.query(
          'UPDATE tasks SET priority_order = ?, is_priority = 1, updated_by = ? WHERE id = ? AND workspace_id = ?',
          [i, req.user.id, taskIds[i], req.workspaceId]
        );
      }
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    const [tasks] = await pool.query(
      `${TASK_SELECT} WHERE t.workspace_id = ? AND t.is_priority = 1 AND t.status = 'pending' ORDER BY t.priority_order ASC`,
      [req.workspaceId]
    );
    res.json({ success: true, message: 'Priority board reordered', data: tasks });
  } catch (error) {
    console.error('ReorderPriorityBoard error:', error);
    res.status(500).json({ success: false, message: 'Server error reordering priority board' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const [existing] = await pool.query(
      'SELECT title FROM tasks WHERE id = ? AND workspace_id = ?',
      [req.params.id, req.workspaceId]
    );
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Task not found' });

    await pool.query('DELETE FROM tasks WHERE id = ? AND workspace_id = ?', [req.params.id, req.workspaceId]);
    await logActivity(req.workspaceId, req.user.id, 'task_deleted', `Deleted task "${existing[0].title}"`, req.params.id);
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('DeleteTask error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting task' });
  }
};

module.exports = {
  getTaskStats,
  getTasks,
  getPriorityTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  updateTaskPriority,
  reorderPriorityBoard,
  deleteTask,
};

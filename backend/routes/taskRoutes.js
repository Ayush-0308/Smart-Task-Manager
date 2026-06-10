const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { resolveWorkspace } = require('../middleware/workspaceMiddleware');
const { validateTask } = require('../middleware/validateInput');

router.use(protect);
router.use(resolveWorkspace);

router.get('/stats', getTaskStats);
router.get('/priority', getPriorityTasks);
router.put('/priority-board', reorderPriorityBoard);
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/', validateTask, createTask);
router.put('/:id', validateTask, updateTask);
router.patch('/:id/status', updateTaskStatus);
router.patch('/:id/priority', updateTaskPriority);
router.delete('/:id', deleteTask);

module.exports = router;

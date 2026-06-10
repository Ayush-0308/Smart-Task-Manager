const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getWorkspaces,
  createWorkspace,
  joinWorkspace,
  getMembers,
  getActivity,
  regenerateCode,
} = require('../controllers/workspaceController');

router.use(protect);

router.get('/', getWorkspaces);
router.post('/', createWorkspace);
router.post('/join', joinWorkspace);
router.get('/:id/members', getMembers);
router.get('/:id/activity', getActivity);
router.post('/:id/regenerate-code', regenerateCode);

module.exports = router;

const { pool } = require('../config/db');

const resolveWorkspace = async (req, res, next) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        message: 'Workspace ID is required (X-Workspace-Id header)',
      });
    }

    const [membership] = await pool.query(
      `SELECT wm.role, w.id, w.name, w.type, w.room_code, w.owner_id
       FROM workspace_members wm
       JOIN workspaces w ON w.id = wm.workspace_id
       WHERE wm.workspace_id = ? AND wm.user_id = ?`,
      [workspaceId, req.user.id]
    );

    if (membership.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this workspace',
      });
    }

    req.workspace = membership[0];
    req.workspaceId = Number(workspaceId);
    next();
  } catch (error) {
    console.error('Workspace middleware error:', error);
    res.status(500).json({ success: false, message: 'Workspace validation failed' });
  }
};

module.exports = { resolveWorkspace };

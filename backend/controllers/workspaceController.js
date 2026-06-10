const { pool } = require('../config/db');
const { generateRoomCode } = require('../utils/roomCode');

const logActivity = async (workspaceId, userId, action, details, taskId = null) => {
  await pool.query(
    'INSERT INTO workspace_activity (workspace_id, user_id, action, details, task_id) VALUES (?, ?, ?, ?, ?)',
    [workspaceId, userId, action, details, taskId]
  );
};

const getUniqueRoomCode = async () => {
  for (let i = 0; i < 10; i++) {
    const code = generateRoomCode();
    const [existing] = await pool.query('SELECT id FROM workspaces WHERE room_code = ?', [code]);
    if (existing.length === 0) return code;
  }
  throw new Error('Could not generate unique room code');
};

// @route GET /api/workspaces
const getWorkspaces = async (req, res) => {
  try {
    const [workspaces] = await pool.query(
      `SELECT w.id, w.name, w.type, w.room_code, w.owner_id, w.created_at,
              wm.role,
              (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = w.id) AS member_count
       FROM workspaces w
       JOIN workspace_members wm ON wm.workspace_id = w.id
       WHERE wm.user_id = ?
       ORDER BY w.type ASC, w.name ASC`,
      [req.user.id]
    );

    res.json({ success: true, count: workspaces.length, data: workspaces });
  } catch (error) {
    console.error('GetWorkspaces error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch workspaces' });
  }
};

// @route POST /api/workspaces
const createWorkspace = async (req, res) => {
  try {
    const { name, type } = req.body;
    const wsType = type === 'team' ? 'team' : 'individual';
    const wsName = name?.trim() || (wsType === 'team' ? 'Team Workspace' : 'Personal Workspace');

    let roomCode = null;
    if (wsType === 'team') {
      roomCode = await getUniqueRoomCode();
    }

    const [result] = await pool.query(
      'INSERT INTO workspaces (name, type, room_code, owner_id) VALUES (?, ?, ?, ?)',
      [wsName, wsType, roomCode, req.user.id]
    );

    await pool.query(
      'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)',
      [result.insertId, req.user.id, 'owner']
    );

    await logActivity(result.insertId, req.user.id, 'workspace_created', `Created ${wsType} workspace "${wsName}"`);

    const [workspace] = await pool.query(
      `SELECT w.*, 'owner' AS role,
              (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = w.id) AS member_count
       FROM workspaces w WHERE w.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Workspace created',
      data: workspace[0],
    });
  } catch (error) {
    console.error('CreateWorkspace error:', error);
    res.status(500).json({ success: false, message: 'Failed to create workspace' });
  }
};

// @route POST /api/workspaces/join
const joinWorkspace = async (req, res) => {
  try {
    const { room_code } = req.body;
    const code = room_code?.trim().toUpperCase();

    if (!code) {
      return res.status(400).json({ success: false, message: 'Room code is required' });
    }

    const [workspaces] = await pool.query(
      "SELECT * FROM workspaces WHERE room_code = ? AND type = 'team'",
      [code]
    );

    if (workspaces.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid room code' });
    }

    const workspace = workspaces[0];

    const [existing] = await pool.query(
      'SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [workspace.id, req.user.id]
    );

    if (existing.length > 0) {
      return res.json({
        success: true,
        message: 'You are already a member of this workspace',
        data: workspace,
      });
    }

    await pool.query(
      'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)',
      [workspace.id, req.user.id, 'member']
    );

    await logActivity(workspace.id, req.user.id, 'member_joined', `${req.user.id} joined the workspace`);

    res.json({
      success: true,
      message: `Joined workspace "${workspace.name}"`,
      data: workspace,
    });
  } catch (error) {
    console.error('JoinWorkspace error:', error);
    res.status(500).json({ success: false, message: 'Failed to join workspace' });
  }
};

// @route GET /api/workspaces/:id/members
const getMembers = async (req, res) => {
  try {
    const workspaceId = req.params.id;

    const [access] = await pool.query(
      'SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [workspaceId, req.user.id]
    );

    if (access.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const [members] = await pool.query(
      `SELECT u.id, u.name, u.email, wm.role, wm.joined_at
       FROM workspace_members wm
       JOIN users u ON u.id = wm.user_id
       WHERE wm.workspace_id = ?
       ORDER BY wm.role DESC, wm.joined_at ASC`,
      [workspaceId]
    );

    res.json({ success: true, data: members });
  } catch (error) {
    console.error('GetMembers error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch members' });
  }
};

// @route GET /api/workspaces/:id/activity
const getActivity = async (req, res) => {
  try {
    const workspaceId = req.params.id;

    const [access] = await pool.query(
      'SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [workspaceId, req.user.id]
    );

    if (access.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const [activity] = await pool.query(
      `SELECT a.*, u.name AS user_name
       FROM workspace_activity a
       JOIN users u ON u.id = a.user_id
       WHERE a.workspace_id = ?
       ORDER BY a.created_at DESC
       LIMIT 30`,
      [workspaceId]
    );

    res.json({ success: true, data: activity });
  } catch (error) {
    console.error('GetActivity error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activity' });
  }
};

// @route POST /api/workspaces/:id/regenerate-code
const regenerateCode = async (req, res) => {
  try {
    const workspaceId = req.params.id;

    const [workspaces] = await pool.query(
      "SELECT * FROM workspaces WHERE id = ? AND type = 'team'",
      [workspaceId]
    );

    if (workspaces.length === 0) {
      return res.status(404).json({ success: false, message: 'Team workspace not found' });
    }

    if (workspaces[0].owner_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the owner can regenerate the room code' });
    }

    const newCode = await getUniqueRoomCode();
    await pool.query('UPDATE workspaces SET room_code = ? WHERE id = ?', [newCode, workspaceId]);
    await logActivity(workspaceId, req.user.id, 'code_regenerated', 'Room code was regenerated');

    res.json({
      success: true,
      message: 'Room code regenerated',
      data: { room_code: newCode },
    });
  } catch (error) {
    console.error('RegenerateCode error:', error);
    res.status(500).json({ success: false, message: 'Failed to regenerate code' });
  }
};

// @route POST /api/auth/onboarding
const completeOnboarding = async (req, res) => {
  try {
    const { choice, workspace_name, room_code } = req.body;
    let workspace = null;

    if (choice === 'team' && room_code?.trim()) {
      const code = room_code.trim().toUpperCase();
      const [workspaces] = await pool.query(
        "SELECT * FROM workspaces WHERE room_code = ? AND type = 'team'",
        [code]
      );
      if (workspaces.length === 0) {
        return res.status(404).json({ success: false, message: 'Invalid room code' });
      }
      workspace = workspaces[0];
      const [member] = await pool.query(
        'SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
        [workspace.id, req.user.id]
      );
      if (member.length === 0) {
        await pool.query(
          'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)',
          [workspace.id, req.user.id, 'member']
        );
      }
    } else if (choice === 'team') {
      const name = workspace_name?.trim() || 'My Team';
      const code = await getUniqueRoomCode();
      const [result] = await pool.query(
        'INSERT INTO workspaces (name, type, room_code, owner_id) VALUES (?, ?, ?, ?)',
        [name, 'team', code, req.user.id]
      );
      await pool.query(
        'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)',
        [result.insertId, req.user.id, 'owner']
      );
      const [ws] = await pool.query('SELECT * FROM workspaces WHERE id = ?', [result.insertId]);
      workspace = ws[0];
    } else {
      const [existing] = await pool.query(
        `SELECT w.* FROM workspaces w
         JOIN workspace_members wm ON wm.workspace_id = w.id
         WHERE wm.user_id = ? AND w.type = 'individual' LIMIT 1`,
        [req.user.id]
      );
      if (existing.length > 0) {
        workspace = existing[0];
      } else {
        const name = workspace_name?.trim() || 'Personal Workspace';
        const [result] = await pool.query(
          'INSERT INTO workspaces (name, type, owner_id) VALUES (?, ?, ?)',
          [name, 'individual', req.user.id]
        );
        await pool.query(
          'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)',
          [result.insertId, req.user.id, 'owner']
        );
        const [ws] = await pool.query('SELECT * FROM workspaces WHERE id = ?', [result.insertId]);
        workspace = ws[0];
      }
    }

    await pool.query('UPDATE users SET onboarding_completed = 1 WHERE id = ?', [req.user.id]);
    await logActivity(workspace.id, req.user.id, 'onboarding_complete', `Joined workspace "${workspace.name}"`);

    res.json({
      success: true,
      message: 'Onboarding complete',
      data: { workspace, onboarding_completed: true },
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({ success: false, message: 'Onboarding failed' });
  }
};

module.exports = {
  logActivity,
  getWorkspaces,
  createWorkspace,
  joinWorkspace,
  getMembers,
  getActivity,
  regenerateCode,
  completeOnboarding,
};

import { useState, useEffect } from 'react';
import { getWorkspaceMembers, getWorkspaceActivity, regenerateRoomCode } from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import Button from './Button';

const actionLabels = {
  task_created: 'created a task',
  task_completed: 'completed a task',
  task_restored: 'restored a task',
  task_updated: 'updated a task',
  task_deleted: 'deleted a task',
  priority_added: 'marked a task urgent',
  priority_removed: 'removed urgent status',
  member_joined: 'joined the workspace',
  workspace_created: 'created the workspace',
  code_regenerated: 'regenerated room code',
  onboarding_complete: 'joined the workspace',
};

const MemberPanel = ({ workspace, currentUserId }) => {
  const { loadWorkspaces } = useWorkspace();
  const [members, setMembers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!workspace?.id) return;
    setLoading(true);
    try {
      const [m, a] = await Promise.all([
        getWorkspaceMembers(workspace.id),
        getWorkspaceActivity(workspace.id),
      ]);
      setMembers(m.data.data);
      setActivity(a.data.data);
    } catch {
      /* non-blocking */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [workspace?.id]);

  const handleRegenerate = async () => {
    if (!window.confirm('Regenerate room code? Old code will stop working.')) return;
    await regenerateRoomCode(workspace.id);
    await loadWorkspaces();
    load();
  };

  if (workspace?.type !== 'team') return null;

  return (
    <div className="bg-white rounded-xl border p-5 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-slate-800">Team Members</h3>
          <p className="text-sm text-slate-500">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        {workspace.room_code && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Room code:</span>
            <code className="bg-slate-100 px-3 py-1 rounded-lg font-bold tracking-widest text-primary-700">
              {workspace.room_code}
            </code>
            {workspace.owner_id === currentUserId && (
              <Button variant="outline" className="text-xs py-1 px-2" onClick={handleRegenerate}>
                Regenerate
              </Button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading team info...</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {members.map((m) => (
              <span
                key={m.id}
                className={`text-xs px-3 py-1.5 rounded-full ${
                  m.role === 'owner'
                    ? 'bg-primary-100 text-primary-800 font-semibold'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {m.name} {m.role === 'owner' ? '(Owner)' : ''}
              </span>
            ))}
          </div>

          <h4 className="text-sm font-semibold text-slate-700 mb-2">Recent Activity</h4>
          <ul className="space-y-2 max-h-40 overflow-y-auto text-sm">
            {activity.length === 0 ? (
              <li className="text-slate-400">No activity yet</li>
            ) : (
              activity.map((a) => (
                <li key={a.id} className="text-slate-600">
                  <strong>{a.user_name}</strong>{' '}
                  {actionLabels[a.action] || a.action}
                  <span className="text-slate-400 ml-2 text-xs">
                    {new Date(a.created_at).toLocaleString()}
                  </span>
                </li>
              ))
            )}
          </ul>
        </>
      )}
    </div>
  );
};

export default MemberPanel;

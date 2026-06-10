import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import Button from './Button';

const Navbar = () => {
  const { user, logout } = useAuth();
  const {
    viewMode,
    setViewMode,
    filteredWorkspaces,
    currentWorkspace,
    selectWorkspace,
    handleCreateWorkspace,
    handleJoinWorkspace,
  } = useWorkspace();
  const navigate = useNavigate();
  const [showJoin, setShowJoin] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [newTeamName, setNewTeamName] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    await handleJoinWorkspace(roomCode);
    setShowJoin(false);
    setRoomCode('');
  };

  const handleCreateTeam = async () => {
    const name = newTeamName.trim() || 'New Team';
    await handleCreateWorkspace(name, 'team');
    setNewTeamName('');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="w-full px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        <Link to="/dashboard" className="text-xl font-bold text-primary-600 shrink-0">
          Smart Task Manager
        </Link>

        <div className="flex flex-wrap items-center gap-3 flex-1 justify-end">
          {/* Mode toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setViewMode('individual')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                viewMode === 'individual'
                  ? 'bg-white shadow text-primary-700'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Individual workspaces"
            >
              👤 Personal
            </button>
            <button
              type="button"
              onClick={() => setViewMode('team')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                viewMode === 'team'
                  ? 'bg-white shadow text-primary-700'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Team workspaces"
            >
              👥 Team
            </button>
          </div>

          {/* Workspace switcher */}
          <select
            value={currentWorkspace?.id || ''}
            onChange={(e) => {
              const ws = filteredWorkspaces.find((w) => w.id === Number(e.target.value));
              if (ws) selectWorkspace(ws);
            }}
            className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 max-w-[200px]"
          >
            {filteredWorkspaces.length === 0 ? (
              <option value="">No workspaces</option>
            ) : (
              filteredWorkspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))
            )}
          </select>

          {viewMode === 'team' && (
            <>
              <Button variant="outline" className="text-xs py-1 px-2" onClick={handleCreateTeam}>
                + New Team
              </Button>
              <Button variant="outline" className="text-xs py-1 px-2" onClick={() => setShowJoin(!showJoin)}>
                Join Code
              </Button>
            </>
          )}

          <span className="text-slate-600 text-sm hidden md:inline">
            {user?.name}
          </span>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      {showJoin && (
        <form
          onSubmit={handleJoin}
          className="px-4 lg:px-8 pb-3 flex gap-2 border-t border-slate-100 pt-3"
        >
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="Enter room code"
            className="flex-1 max-w-xs px-3 py-1.5 border rounded-lg uppercase tracking-widest text-sm"
          />
          <Button type="submit" className="text-sm py-1 px-3">
            Join
          </Button>
        </form>
      )}
    </nav>
  );
};

export default Navbar;

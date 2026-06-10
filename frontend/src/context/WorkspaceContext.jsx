import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  getWorkspaces,
  createWorkspace,
  joinWorkspace,
  completeOnboarding,
} from '../services/api';

const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
  const { user, isAuthenticated, setUser } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem('viewMode') || 'individual'
  );
  const [showWelcome, setShowWelcome] = useState(false);
  const [loading, setLoading] = useState(true);

  const selectWorkspace = useCallback((workspace) => {
    if (!workspace) return;
    setCurrentWorkspace(workspace);
    localStorage.setItem('currentWorkspaceId', String(workspace.id));
  }, []);

  const loadWorkspaces = useCallback(async () => {
    if (!isAuthenticated) {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await getWorkspaces();
      const list = res.data.data || [];
      setWorkspaces(list);

      const savedId = localStorage.getItem('currentWorkspaceId');
      const saved = list.find((w) => String(w.id) === savedId);
      const modeList = list.filter((w) => w.type === viewMode);
      const fallback = modeList[0] || list[0] || null;

      selectWorkspace(saved && list.some((w) => w.id === saved.id) ? saved : fallback);
    } catch {
      setWorkspaces([]);
      setCurrentWorkspace(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, viewMode, selectWorkspace]);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    if (user && user.onboarding_completed === false) {
      setShowWelcome(true);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
    const modeList = workspaces.filter((w) => w.type === viewMode);
    if (currentWorkspace?.type !== viewMode && modeList.length > 0) {
      selectWorkspace(modeList[0]);
    }
  }, [viewMode, workspaces, currentWorkspace, selectWorkspace]);

  const handleOnboarding = async (payload) => {
    const res = await completeOnboarding(payload);
    const { workspace, onboarding_completed } = res.data.data;
    setUser({ ...user, onboarding_completed });
    localStorage.setItem('user', JSON.stringify({ ...user, onboarding_completed }));
    setShowWelcome(false);
    await loadWorkspaces();
    if (workspace) selectWorkspace(workspace);
    return res.data;
  };

  const handleCreateWorkspace = async (name, type) => {
    const res = await createWorkspace({ name, type });
    await loadWorkspaces();
    selectWorkspace(res.data.data);
    return res.data.data;
  };

  const handleJoinWorkspace = async (roomCode) => {
    const res = await joinWorkspace(roomCode);
    await loadWorkspaces();
    selectWorkspace(res.data.data);
    return res.data.data;
  };

  const filteredWorkspaces = workspaces.filter((w) => w.type === viewMode);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        filteredWorkspaces,
        currentWorkspace,
        viewMode,
        setViewMode,
        selectWorkspace,
        loadWorkspaces,
        showWelcome,
        setShowWelcome,
        handleOnboarding,
        handleCreateWorkspace,
        handleJoinWorkspace,
        loading,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
};

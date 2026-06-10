import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getTasks,
  getPriorityTasks,
  getTaskStats,
  createTask,
  updateTask,
  updateTaskStatus,
  updateTaskPriority,
  reorderPriorityBoard,
  deleteTask,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { sortTasks } from '../utils/taskHelpers';
import TaskForm from '../components/TaskForm';
import TaskCard from '../components/TaskCard';
import TaskFilters from '../components/TaskFilters';
import PriorityBoard from '../components/PriorityBoard';
import ActiveTasksDropZone from '../components/ActiveTasksDropZone';
import CompletedTasksSection from '../components/CompletedTasksSection';
import DashboardStats from '../components/DashboardStats';
import MemberPanel from '../components/MemberPanel';
import WelcomeModal from '../components/WelcomeModal';
import Alert from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';

const REFRESH_INTERVAL = 15000;
const emptyStats = { total: 0, active: 0, urgent: 0, completed: 0, overdue: 0 };

const Dashboard = () => {
  const { user } = useAuth();
  const { currentWorkspace, showWelcome, handleOnboarding, setShowWelcome, loading: wsLoading } =
    useWorkspace();

  const [activeTasks, setActiveTasks] = useState([]);
  const [priorityTasks, setPriorityTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [completedLoading, setCompletedLoading] = useState(true);
  const [priorityLoading, setPriorityLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editTask, setEditTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewFilter, setViewFilter] = useState('all');

  const priorityRef = useRef(null);
  const activeRef = useRef(null);
  const completedRef = useRef(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getTaskStats();
      setStats(res.data.data);
    } catch {
      /* non-blocking */
    }
  }, []);

  const fetchPriorityTasks = useCallback(async () => {
    try {
      const res = await getPriorityTasks();
      setPriorityTasks(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load priority board');
    } finally {
      setPriorityLoading(false);
    }
  }, []);

  const fetchActiveTasks = useCallback(async () => {
    setLoading(true);
    try {
      if (viewFilter === 'urgent') {
        setActiveTasks([]);
        setLoading(false);
        return;
      }

      const params = {
        status: 'pending',
        exclude_priority: 'true',
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      if (viewFilter === 'overdue') params.overdue = 'true';
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await getTasks(params);
      setActiveTasks(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, sortBy, sortOrder, viewFilter]);

  const fetchCompletedTasks = useCallback(async () => {
    setCompletedLoading(true);
    try {
      const params = { status: 'completed', sort_by: 'completed_at', sort_order: 'desc' };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const res = await getTasks(params);
      setCompletedTasks(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load completed tasks');
    } finally {
      setCompletedLoading(false);
    }
  }, [searchQuery]);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchStats(), fetchPriorityTasks(), fetchActiveTasks(), fetchCompletedTasks()]);
  }, [fetchStats, fetchPriorityTasks, fetchActiveTasks, fetchCompletedTasks]);

  useEffect(() => {
    if (!currentWorkspace) return;
    const delay = setTimeout(refreshAll, 200);
    return () => clearTimeout(delay);
  }, [currentWorkspace, refreshAll]);

  useEffect(() => {
    if (!currentWorkspace) return;
    const interval = setInterval(refreshAll, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [currentWorkspace, refreshAll]);

  const scrollToSection = (filter) => {
    const map = {
      all: null,
      active: activeRef,
      urgent: priorityRef,
      completed: completedRef,
      overdue: activeRef,
    };
    map[filter]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleFilterClick = (filter) => {
    if (viewFilter === filter) {
      setViewFilter('all');
    } else {
      setViewFilter(filter);
      setTimeout(() => scrollToSection(filter), 100);
    }
  };

  const bumpStat = (key, delta) => {
    setStats((prev) => ({
      ...prev,
      [key]: Math.max(0, Number(prev[key] || 0) + delta),
    }));
  };

  const handleCreateOrUpdate = async (formData) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      if (editTask) {
        await updateTask(editTask.id, formData);
        setSuccess('Task updated');
        setEditTask(null);
      } else {
        await createTask(formData);
        setSuccess('Task created');
        bumpStat('total', 1);
        bumpStat('active', 1);
      }
      refreshAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    const task = [...activeTasks, ...priorityTasks, ...completedTasks].find((t) => t.id === id);
    try {
      await deleteTask(id);
      if (task) {
        bumpStat('total', -1);
        if (task.status === 'completed') bumpStat('completed', -1);
        else bumpStat('active', -1);
        if (task.is_priority) bumpStat('urgent', -1);
      }
      setSuccess('Task deleted');
      refreshAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleToggleStatus = async (task) => {
    const completing = task.status !== 'completed';
    const wasUrgent = task.is_priority;

    if (completing) {
      if (wasUrgent) setPriorityTasks((p) => p.filter((t) => t.id !== task.id));
      setActiveTasks((p) => p.filter((t) => t.id !== task.id));
      setCompletedTasks((p) => [{ ...task, status: 'completed', is_priority: 0 }, ...p]);
      bumpStat('active', -1);
      bumpStat('completed', 1);
      if (wasUrgent) bumpStat('urgent', -1);
    } else {
      setCompletedTasks((p) => p.filter((t) => t.id !== task.id));
      setActiveTasks((p) => [{ ...task, status: 'pending' }, ...p]);
      bumpStat('active', 1);
      bumpStat('completed', -1);
    }

    try {
      await updateTaskStatus(task.id, completing ? 'completed' : 'pending');
      setSuccess(completing ? 'Moved to Completed' : 'Restored to active');
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Status update failed');
      refreshAll();
    }
  };

  const handleAddToPriority = async (taskId) => {
    const task = activeTasks.find((t) => t.id === taskId);
    if (!task) return;
    setActiveTasks((p) => p.filter((t) => t.id !== taskId));
    setPriorityTasks((p) => [...p, { ...task, is_priority: 1 }]);
    bumpStat('urgent', 1);
    try {
      await updateTaskPriority(taskId, true);
      setSuccess('Added to urgent board');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
      refreshAll();
    }
  };

  const handleRemoveFromPriority = async (taskId) => {
    const task = priorityTasks.find((t) => t.id === taskId);
    if (!task) return;
    setPriorityTasks((p) => p.filter((t) => t.id !== taskId));
    setActiveTasks((p) => [{ ...task, is_priority: 0 }, ...p]);
    bumpStat('urgent', -1);
    try {
      await updateTaskPriority(taskId, false);
      setSuccess('Removed from urgent board');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
      refreshAll();
    }
  };

  const handleReorderPriority = async (taskIds) => {
    setPriorityTasks((prev) => {
      const map = Object.fromEntries(prev.map((t) => [t.id, t]));
      return taskIds.map((id, i) => ({ ...map[id], priority_order: i })).filter(Boolean);
    });
    try {
      await reorderPriorityBoard(taskIds);
    } catch {
      fetchPriorityTasks();
    }
  };

  const showPriority = viewFilter === 'all' || viewFilter === 'urgent' || viewFilter === 'active' || viewFilter === 'overdue';
  const showActive = viewFilter === 'all' || viewFilter === 'active' || viewFilter === 'overdue';
  const showCompleted = viewFilter === 'all' || viewFilter === 'completed';
  const displayedActive = sortTasks(activeTasks, sortBy, sortOrder);

  if (wsLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      {showWelcome && (
        <WelcomeModal
          onComplete={handleOnboarding}
          onClose={() => setShowWelcome(false)}
        />
      )}

      <div className="min-h-full bg-slate-100">
        <div className="w-full px-4 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                {currentWorkspace?.name || 'Workspace'}
              </h1>
              <p className="text-slate-500 mt-1">
                {currentWorkspace?.type === 'team'
                  ? 'Shared team workspace — collaborate in real time'
                  : 'Your personal workspace — private to you'}
                {' · '}
                <strong>{user?.name}</strong>
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-white border rounded-lg px-3 py-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live sync every {REFRESH_INTERVAL / 1000}s
            </div>
          </div>

          <DashboardStats
            stats={stats}
            activeFilter={viewFilter}
            onFilterClick={handleFilterClick}
          />

          <Alert type="error" message={error} onClose={() => setError('')} />
          <Alert type="success" message={success} onClose={() => setSuccess('')} />

          {currentWorkspace?.type === 'team' && (
            <MemberPanel workspace={currentWorkspace} currentUserId={user?.id} />
          )}

          {showPriority && (
            <PriorityBoard
              sectionRef={priorityRef}
              tasks={priorityTasks}
              urgentCount={stats.urgent}
              onReorder={handleReorderPriority}
              onRemove={handleRemoveFromPriority}
              onAddTask={handleAddToPriority}
              loading={priorityLoading}
            />
          )}

          <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6">
            <div className="2xl:col-span-4">
              <TaskForm
                onSubmit={handleCreateOrUpdate}
                onCancel={() => setEditTask(null)}
                editTask={editTask}
                loading={actionLoading}
              />
            </div>

            <div className="2xl:col-span-8">
              <TaskFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortByChange={setSortBy}
                onSortOrderChange={setSortOrder}
                overdueOnly={viewFilter === 'overdue'}
                onOverdueOnlyChange={(v) => setViewFilter(v ? 'overdue' : 'all')}
              />

              {showActive && (
                <div ref={activeRef}>
                  <h2 className="text-lg font-bold text-slate-800 mb-3">Active Tasks</h2>
                  <ActiveTasksDropZone
                    onDropFromPriority={handleRemoveFromPriority}
                    isEmpty={displayedActive.length === 0}
                  >
                    {loading ? (
                      <div className="flex justify-center py-12">
                        <LoadingSpinner size="lg" />
                      </div>
                    ) : displayedActive.length === 0 ? (
                      <div className="text-center py-10 bg-white rounded-xl border border-dashed">
                        <p className="text-slate-500">No active tasks match this view.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {displayedActive.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            variant="active"
                            onEdit={setEditTask}
                            onDelete={handleDelete}
                            onToggleStatus={handleToggleStatus}
                            onAddToPriority={handleAddToPriority}
                          />
                        ))}
                      </div>
                    )}
                  </ActiveTasksDropZone>
                </div>
              )}

              {showCompleted && (
                <div ref={completedRef}>
                  <CompletedTasksSection
                    tasks={completedTasks}
                    loading={completedLoading}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    forceExpanded={viewFilter === 'completed'}
                    onEdit={setEditTask}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;

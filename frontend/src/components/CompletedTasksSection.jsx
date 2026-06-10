import { useState } from 'react';
import TaskCard from './TaskCard';
import LoadingSpinner from './LoadingSpinner';
import { sortTasks } from '../utils/taskHelpers';

const CompletedTasksSection = ({
  tasks,
  loading,
  sortBy,
  sortOrder,
  onEdit,
  onDelete,
  onToggleStatus,
  forceExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(true);
  const isExpanded = forceExpanded || expanded;
  const sorted = sortTasks(tasks, sortBy === 'due_date' ? 'completed_at' : sortBy, sortOrder);

  return (
    <section className="mt-8">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-4 hover:bg-green-100 transition"
      >
        <div className="text-left">
          <h2 className="text-lg font-bold text-green-800">Completed Tasks</h2>
          <p className="text-sm text-green-600">
            {tasks.length} finished — click Restore to move back to active work
          </p>
        </div>
        <span className="text-green-700 text-xl font-bold">{isExpanded ? '−' : '+'}</span>
      </button>

      {isExpanded && (
        <>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-green-200">
              <p className="text-slate-500">No completed tasks yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {sorted.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  variant="completed"
                  draggable={false}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleStatus={onToggleStatus}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default CompletedTasksSection;

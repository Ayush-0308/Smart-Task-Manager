import Button from './Button';
import DueDateBadge from './DueDateBadge';
import {
  dueDateBorderStyles,
  formatCompletedAt,
  getDueDateStatus,
  isOverdue,
} from '../utils/taskHelpers';

const TaskCard = ({
  task,
  onEdit,
  onDelete,
  onToggleStatus,
  onAddToPriority,
  draggable = true,
  variant = 'active',
}) => {
  const isCompleted = task.status === 'completed';
  const dueStatus = getDueDateStatus(task.due_date, task.status);
  const showOverdueSuggestion = isOverdue(task) && !task.is_priority && variant === 'active';

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', String(task.id));
    e.dataTransfer.setData('application/task-source', variant === 'priority' ? 'priority' : 'active');
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable={draggable && variant !== 'completed'}
      onDragStart={handleDragStart}
      className={`bg-white rounded-xl shadow-sm border p-4 lg:p-5 transition hover:shadow-md w-full ${
        dueDateBorderStyles[dueStatus]
      } ${isCompleted ? 'opacity-80 bg-slate-50' : ''} ${
        draggable && variant === 'active' ? 'cursor-grab active:cursor-grabbing' : ''
      } ${variant === 'priority' ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              isCompleted
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {task.status}
          </span>
          <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {task.creator_name || 'Team'}
          </span>
          {task.updated_by_name && (
            <span className="text-xs text-slate-400">edited by {task.updated_by_name}</span>
          )}
          {showOverdueSuggestion && (
            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-200">
              Suggested for urgent board
            </span>
          )}
        </div>

        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
          <div className="flex-1 min-w-0">
            <h3
              className={`text-lg font-semibold leading-snug ${
                isCompleted ? 'line-through text-slate-500' : 'text-slate-800'
              }`}
            >
              {task.title}
            </h3>
            {task.description && (
              <p className="text-slate-600 text-sm mt-1.5 leading-relaxed">{task.description}</p>
            )}
          </div>

          <div className="flex flex-wrap lg:flex-col lg:items-end gap-2 shrink-0">
            {!isCompleted && onAddToPriority && !task.is_priority && (
              <Button
                variant="outline"
                onClick={() => onAddToPriority(task.id)}
                className="text-sm py-1.5 px-3 border-red-300 text-red-600 hover:bg-red-50"
              >
                ⚡ Urgent
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => onToggleStatus(task)}
              className="text-sm py-1.5 px-3"
            >
              {isCompleted ? 'Restore' : 'Mark Done'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => onEdit(task)}
              className="text-sm py-1.5 px-3"
            >
              Edit
            </Button>
            <Button
              variant="danger"
              onClick={() => onDelete(task.id)}
              className="text-sm py-1.5 px-3"
            >
              Delete
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span>Created {new Date(task.created_at).toLocaleDateString()}</span>
            {isCompleted && task.completed_at && (
              <span className="text-green-600 font-medium">
                Completed {formatCompletedAt(task.completed_at)}
              </span>
            )}
          </div>
          <DueDateBadge dueDate={task.due_date} status={task.status} />
        </div>
      </div>
    </div>
  );
};

export default TaskCard;

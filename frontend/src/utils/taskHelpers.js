const APPROACHING_HOURS = 48;

export const getDueDateStatus = (dueDate, status) => {
  if (!dueDate || status === 'completed') return 'none';

  const due = new Date(dueDate);
  const now = new Date();

  if (due < now) return 'overdue';

  const hoursLeft = (due - now) / (1000 * 60 * 60);
  if (hoursLeft <= APPROACHING_HOURS) return 'approaching';

  return 'normal';
};

export const getTimeRemaining = (dueDate) => {
  if (!dueDate) return null;

  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = due - now;

  if (diffMs <= 0) {
    const overdueMs = Math.abs(diffMs);
    const overdueHours = Math.floor(overdueMs / (1000 * 60 * 60));
    const overdueDays = Math.floor(overdueHours / 24);

    if (overdueDays >= 1) return `${overdueDays} day${overdueDays > 1 ? 's' : ''} overdue`;
    if (overdueHours >= 1) return `${overdueHours} hour${overdueHours > 1 ? 's' : ''} overdue`;
    return 'Overdue';
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (days >= 1) return `${days} day${days > 1 ? 's' : ''} left`;
  if (hours >= 1) return `${hours} hour${hours > 1 ? 's' : ''} left`;
  return `${minutes} min left`;
};

export const dueDateStyles = {
  none: 'bg-slate-100 text-slate-600',
  normal: 'bg-blue-50 text-blue-700 border-blue-200',
  approaching: 'bg-amber-50 text-amber-700 border-amber-300',
  overdue: 'bg-red-50 text-red-700 border-red-300',
};

export const dueDateBorderStyles = {
  none: 'border-slate-200',
  normal: 'border-slate-200',
  approaching: 'border-amber-300 ring-1 ring-amber-100',
  overdue: 'border-red-400 ring-1 ring-red-100',
};

export const formatDueDate = (dueDate) => {
  if (!dueDate) return null;
  return new Date(dueDate).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const formatCompletedAt = (completedAt) => {
  if (!completedAt) return null;
  return new Date(completedAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const toDatetimeLocalValue = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const isOverdue = (task) =>
  task.status === 'pending' && getDueDateStatus(task.due_date, task.status) === 'overdue';

export const sortTasks = (tasks, sortBy, sortOrder) => {
  const sorted = [...tasks];
  const dir = sortOrder === 'asc' ? 1 : -1;

  sorted.sort((a, b) => {
    switch (sortBy) {
      case 'due_date': {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return (new Date(a.due_date) - new Date(b.due_date)) * dir;
      }
      case 'priority':
        if (a.is_priority !== b.is_priority) return (b.is_priority - a.is_priority) * dir;
        return (a.priority_order - b.priority_order) * dir;
      case 'status':
        return a.status.localeCompare(b.status) * dir;
      case 'completed_at': {
        if (!a.completed_at && !b.completed_at) return 0;
        if (!a.completed_at) return 1;
        if (!b.completed_at) return -1;
        return (new Date(a.completed_at) - new Date(b.completed_at)) * dir;
      }
      case 'created_at':
      default:
        return (new Date(a.created_at) - new Date(b.created_at)) * dir;
    }
  });

  return sorted;
};

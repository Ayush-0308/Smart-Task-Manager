import {
  getDueDateStatus,
  getTimeRemaining,
  dueDateStyles,
  formatDueDate,
} from '../utils/taskHelpers';

const DueDateBadge = ({ dueDate, status, showDate = true, size = 'sm' }) => {
  if (!dueDate) return null;

  const dueStatus = getDueDateStatus(dueDate, status);
  const remaining = getTimeRemaining(dueDate);
  const textSize = size === 'xs' ? 'text-[10px]' : 'text-xs';

  return (
    <div className={`inline-flex flex-wrap items-center gap-1.5 ${textSize}`}>
      {showDate && (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border font-medium ${dueDateStyles[dueStatus]}`}
        >
          <span>📅</span>
          {formatDueDate(dueDate)}
        </span>
      )}
      {status !== 'completed' && remaining && (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded border font-semibold ${dueDateStyles[dueStatus]}`}
        >
          {remaining}
        </span>
      )}
    </div>
  );
};

export default DueDateBadge;

import { useState } from 'react';

const ActiveTasksDropZone = ({ children, onDropFromPriority, isEmpty }) => {
  const [isActive, setIsActive] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsActive(true);
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsActive(false);
    const source = e.dataTransfer.getData('application/task-source');
    const taskId = Number(e.dataTransfer.getData('text/plain'));
    if (source === 'priority' && taskId) {
      onDropFromPriority(taskId);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-xl transition-all ${
        isActive
          ? 'ring-2 ring-blue-400 bg-blue-50/50 p-3 -m-3'
          : ''
      }`}
    >
      {isActive && (
        <div className="mb-4 text-center py-3 border-2 border-dashed border-blue-400 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium">
          Drop here to remove urgent status and return to active tasks
        </div>
      )}
      {!isActive && !isEmpty && (
        <p className="text-xs text-slate-400 mb-3">
          Drag urgent tasks from the board above into this area to remove their urgent status
        </p>
      )}
      {children}
    </div>
  );
};

export default ActiveTasksDropZone;

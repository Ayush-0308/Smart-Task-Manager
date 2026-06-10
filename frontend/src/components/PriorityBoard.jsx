import { useState } from 'react';
import DueDateBadge from './DueDateBadge';
import { getDueDateStatus, dueDateBorderStyles } from '../utils/taskHelpers';

const PriorityBoard = ({
  tasks,
  urgentCount,
  onReorder,
  onRemove,
  onAddTask,
  loading,
  compact = false,
  sectionRef,
}) => {
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [isDropZoneActive, setIsDropZoneActive] = useState(false);

  const isEmpty = !loading && tasks.length === 0;

  const handleDragStart = (e, taskId) => {
    setDraggedId(taskId);
    e.dataTransfer.setData('text/plain', String(taskId));
    e.dataTransfer.setData('application/task-source', 'priority');
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
    setIsDropZoneActive(false);
  };

  const handleCardDrop = (e, targetId) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = Number(e.dataTransfer.getData('text/plain'));
    const source = e.dataTransfer.getData('application/task-source');
    if (!sourceId || sourceId === targetId) return;

    if (source === 'active') {
      onAddTask(sourceId);
      handleDragEnd();
      return;
    }

    const ids = tasks.map((t) => t.id);
    const fromIndex = ids.indexOf(sourceId);
    const toIndex = ids.indexOf(targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const reordered = [...ids];
    reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, sourceId);
    onReorder(reordered);
    handleDragEnd();
  };

  const handleBoardDrop = (e) => {
    e.preventDefault();
    const sourceId = Number(e.dataTransfer.getData('text/plain'));
    const source = e.dataTransfer.getData('application/task-source');
    if (source === 'active' && sourceId && !tasks.some((t) => t.id === sourceId)) {
      onAddTask(sourceId);
    }
    handleDragEnd();
  };

  return (
    <section
      ref={sectionRef}
      className={`relative w-full rounded-xl mb-6 transition-all ${
        isEmpty
          ? 'bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200'
          : 'bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 text-white shadow-md'
      }`}
    >
      <div className={`px-4 lg:px-6 ${isEmpty ? 'py-3' : 'py-4'}`}>
        <div className="flex items-center justify-between gap-4 mb-2">
          <div>
            <h2
              className={`font-bold tracking-tight flex items-center gap-2 ${
                isEmpty ? 'text-base text-rose-800' : 'text-lg'
              }`}
            >
              <span>{isEmpty ? '⚡' : '⚡'}</span>
              Immediate Attention Board
            </h2>
            <p className={`text-xs mt-0.5 ${isEmpty ? 'text-rose-600/80' : 'text-rose-100'}`}>
              Drag tasks in to mark urgent · drag back to active list to remove
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              isEmpty ? 'bg-rose-100 text-rose-700' : 'bg-white/20 backdrop-blur'
            }`}
          >
            {urgentCount ?? tasks.length} urgent
          </span>
        </div>

        <div
          className={`rounded-lg border-2 border-dashed transition-all flex gap-3 overflow-x-auto ${
            isEmpty ? 'min-h-[52px] p-2 border-rose-200/60' : 'min-h-[130px] p-3 border-white/40 bg-black/10'
          } ${isDropZoneActive && !isEmpty ? 'border-white bg-white/20' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDropZoneActive(true);
          }}
          onDragLeave={() => setIsDropZoneActive(false)}
          onDrop={handleBoardDrop}
        >
          {loading ? (
            <div className={`flex items-center w-full text-sm ${isEmpty ? 'text-rose-400' : 'text-rose-100'}`}>
              Loading...
            </div>
          ) : isEmpty ? (
            <div className="flex items-center w-full text-rose-500/70 text-xs">
              Drop urgent tasks here
            </div>
          ) : (
            tasks.map((task) => {
              const dueStatus = getDueDateStatus(task.due_date, task.status);
              return (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (draggedId && draggedId !== task.id) setDragOverId(task.id);
                  }}
                  onDrop={(e) => handleCardDrop(e, task.id)}
                  className={`shrink-0 w-64 bg-white text-slate-800 rounded-lg p-3 shadow cursor-grab active:cursor-grabbing border ${
                    dueDateBorderStyles[dueStatus]
                  } ${draggedId === task.id ? 'opacity-50' : ''} ${
                    dragOverId === task.id ? 'ring-2 ring-yellow-300' : ''
                  }`}
                >
                  <div className="flex justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                      Urgent
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemove(task.id)}
                      className="text-slate-400 hover:text-red-500 leading-none"
                    >
                      ×
                    </button>
                  </div>
                  <h3 className="font-semibold text-sm">{task.title}</h3>
                  <div className="mt-2 flex justify-between items-center text-xs text-slate-400">
                    <span>{task.creator_name}</span>
                    <DueDateBadge dueDate={task.due_date} status={task.status} size="xs" showDate={false} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};

export default PriorityBoard;

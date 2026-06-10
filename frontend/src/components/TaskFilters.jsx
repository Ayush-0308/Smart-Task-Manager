const TaskFilters = ({
  searchQuery,
  onSearchChange,
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
  overdueOnly = false,
  onOverdueOnlyChange,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Search Tasks</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title or description..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="created_at">Creation Date</option>
            <option value="due_date">Due Date</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Order</label>
          <select
            value={sortOrder}
            onChange={(e) => onSortOrderChange(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="desc">Newest / Latest First</option>
            <option value="asc">Oldest / Earliest First</option>
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 mt-4 text-sm text-slate-600 cursor-pointer">
        <input
          type="checkbox"
          checked={overdueOnly}
          onChange={(e) => onOverdueOnlyChange(e.target.checked)}
          className="rounded border-slate-300 text-red-600 focus:ring-red-500"
        />
        Show overdue tasks only
      </label>
    </div>
  );
};

export default TaskFilters;

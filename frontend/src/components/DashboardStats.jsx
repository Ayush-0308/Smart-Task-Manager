const FILTERS = [
  { key: 'all', label: 'Total Tasks', color: 'text-primary-600', ring: 'ring-primary-400' },
  { key: 'active', label: 'Active Tasks', color: 'text-slate-700', ring: 'ring-slate-400' },
  { key: 'urgent', label: 'Urgent', color: 'text-red-600', ring: 'ring-red-400' },
  { key: 'completed', label: 'Completed', color: 'text-green-600', ring: 'ring-green-400' },
  { key: 'overdue', label: 'Overdue', color: 'text-orange-600', ring: 'ring-orange-400' },
];

const DashboardStats = ({ stats, activeFilter, onFilterClick }) => {
  const data = {
    all: Number(stats?.total || 0),
    active: Number(stats?.active || 0),
    urgent: Number(stats?.urgent || 0),
    completed: Number(stats?.completed || 0),
    overdue: Number(stats?.overdue || 0),
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {FILTERS.map(({ key, label, color, ring }) => {
        const selected = activeFilter === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onFilterClick(key)}
            className={`bg-white rounded-xl border p-4 text-center transition-all cursor-pointer hover:shadow-md hover:scale-[1.02] ${
              selected ? `ring-2 ${ring} shadow-md border-transparent` : 'border-slate-200'
            }`}
          >
            <p className={`text-2xl font-bold ${color}`}>{data[key]}</p>
            <p className="text-sm text-slate-500">{label}</p>
            {selected && (
              <p className="text-[10px] text-primary-600 mt-1 font-medium uppercase tracking-wide">
                Active filter
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default DashboardStats;

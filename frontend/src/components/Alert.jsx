/**
 * Reusable alert for success and error messages
 */
const Alert = ({ type = 'error', message, onClose }) => {
  if (!message) return null;

  const styles = {
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  return (
    <div
      className={`mb-4 px-4 py-3 rounded-lg border flex justify-between items-center ${styles[type]}`}
      role="alert"
    >
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 text-lg font-bold opacity-60 hover:opacity-100"
          aria-label="Close"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default Alert;

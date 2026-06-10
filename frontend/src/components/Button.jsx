const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
  onClick,
}) => {
  const variants = {
    primary:
      'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500',
    secondary:
      'bg-slate-200 hover:bg-slate-300 text-slate-800 focus:ring-slate-400',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    outline:
      'border-2 border-primary-600 text-primary-600 hover:bg-primary-50',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {loading ? 'Please wait...' : children}
    </button>
  );
};

export default Button;

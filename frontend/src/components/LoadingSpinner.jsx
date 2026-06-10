const LoadingSpinner = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div
      className={`${sizeClasses[size]} border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    />
  );
};

export default LoadingSpinner;

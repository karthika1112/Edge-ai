import React from 'react';

export const Spinner = ({ size = 'md', color = 'white' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-5 h-5 border-2',
    lg: 'w-8 h-8 border-3',
  };

  const colorClasses = {
    white: 'border-white/30 border-t-white',
    primary: 'border-primary-200 border-t-primary-600',
    success: 'border-success-200 border-t-success-500',
  };

  return (
    <div
      className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]}`}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
export default Spinner;

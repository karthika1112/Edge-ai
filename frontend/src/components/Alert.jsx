import React from 'react';

export const Alert = ({ children, type = 'error' }) => {
  const bgClasses = {
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    info: 'bg-primary-50 border-primary-200 text-primary-700',
  };

  const iconColor = {
    error: 'text-red-500',
    success: 'text-emerald-500',
    info: 'text-primary-500',
  };

  return (
    <div className={`flex items-start gap-3 p-4 border rounded-xl text-sm ${bgClasses[type]} animate-fade-in`}>
      <svg
        className={`w-5 h-5 flex-shrink-0 ${iconColor[type]}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        {type === 'error' && (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        )}
        {type === 'success' && (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        )}
        {type === 'info' && (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        )}
      </svg>
      <div className="flex-1 font-medium">{children}</div>
    </div>
  );
};
export default Alert;

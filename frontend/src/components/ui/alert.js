// src/components/ui/alert.js
import React from 'react';

export const Alert = ({ children, variant = 'default', className = '' }) => {
  const bgColor = variant === 'destructive' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200';
  return (
    <div className={`p-4 border rounded-lg ${bgColor} ${className}`}>
      {children}
    </div>
  );
};

export const AlertDescription = ({ children }) => (
  <div className="text-sm text-gray-700 ml-2 inline-block">
    {children}
  </div>
);
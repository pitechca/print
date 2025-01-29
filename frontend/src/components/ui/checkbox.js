// src/components/ui/checkbox.js
// import React from 'react';

export const Checkbox = ({ checked, onCheckedChange, className }) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={(e) => onCheckedChange(e.target.checked)}
    className={`h-4 w-4 rounded border-gray-300 ${className}`}
  />
);

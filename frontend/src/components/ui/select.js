// src/components/ui/select.js
import React from 'react';

export const Select = ({ children, onValueChange, defaultValue }) => {
  return (
    <select 
      onChange={(e) => onValueChange(e.target.value)}
      defaultValue={defaultValue}
      className="w-full p-2 border rounded-md"
    >
      {children}
    </select>
  );
};

export const SelectTrigger = ({ children }) => <div>{children}</div>;
export const SelectValue = ({ placeholder }) => <span>{placeholder}</span>;
export const SelectContent = ({ children }) => <>{children}</>;
export const SelectItem = ({ value, children }) => (
  <option value={value}>{children}</option>
);
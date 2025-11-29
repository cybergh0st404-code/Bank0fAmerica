import React from 'react';

const Input = ({ 
  label, 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  error,
  className = '',
  required = false,
  ...props 
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {label}
          {required && <span className="text-accent-red ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`input-field ${error ? 'border-accent-red focus:ring-accent-red' : ''} ${className}`}
        required={required}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-accent-red">{error}</p>
      )}
    </div>
  );
};

export default Input;




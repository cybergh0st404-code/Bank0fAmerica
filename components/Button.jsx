import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  disabled = false,
  onClick,
  type = 'button',
  ...props 
}) => {
  const baseClasses = 'font-medium px-6 py-3 rounded-bank transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-primary-blue hover:bg-primary-navy text-white shadow-bank hover:shadow-bank-lg',
    secondary: 'bg-white hover:bg-accent-soft text-primary-blue border border-primary-blue',
    danger: 'bg-accent-red hover:bg-red-700 text-white',
    outline: 'bg-transparent hover:bg-accent-soft text-primary-blue border border-neutral-300',
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

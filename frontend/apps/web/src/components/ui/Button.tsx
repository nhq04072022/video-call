import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  // Fully rounded pill shape (border-radius: 9999px)
  const baseStyles = 'font-medium rounded-button transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-purple focus:ring-offset-2 shadow-sm';
  
  const variantStyles = {
    primary: 'bg-gradient-to-r from-primary-purple to-primary-purple-accent text-white hover:opacity-90 hover:shadow-md active:scale-95',
    secondary: 'bg-white text-text-grey border-2 border-gray-300 hover:border-primary-purple hover:text-primary-purple focus:ring-primary-purple',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline: 'bg-transparent text-text-grey border-2 border-gray-300 hover:border-primary-purple hover:text-primary-purple focus:ring-primary-purple',
  };
  
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm min-h-[44px] min-w-[44px]',
    md: 'px-6 py-3 text-base min-h-[44px] min-w-[44px]',
    lg: 'px-8 py-4 text-lg min-h-[44px] min-w-[44px]',
  };
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};






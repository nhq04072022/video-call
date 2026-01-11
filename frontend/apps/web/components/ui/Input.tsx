import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={props.id}
          className="block text-sm font-medium text-text-grey mb-2"
        >
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 min-h-[44px] rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent transition-all ${className} ${
          error ? 'border-red-500' : ''
        }`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};


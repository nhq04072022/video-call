import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-background-soft-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
};


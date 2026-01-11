/**
 * Auth Layout Component for authentication pages
 */
import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-soft-white wave-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-card-lg shadow-2xl p-10 animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-heading text-primary-purple mb-2">
              Lifely
            </h1>
            {title && (
              <h2 className="text-xl font-semibold text-text-grey mt-2">{title}</h2>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};


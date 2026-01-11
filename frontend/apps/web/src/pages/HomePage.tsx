/**
 * Home Page - Landing page with login button
 */
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  // If already authenticated, redirect to dashboard or intended destination
  React.useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = searchParams.get('redirectTo');
      if (redirectTo) {
        navigate(decodeURIComponent(redirectTo), { replace: true });
      } else {
        navigate('/sessions', { replace: true });
      }
    }
  }, [isAuthenticated, navigate, searchParams]);

  const handleLogin = () => {
    // Preserve redirectTo parameter if exists
    const redirectTo = searchParams.get('redirectTo');
    if (redirectTo) {
      navigate(`/login?redirectTo=${redirectTo}`);
    } else {
      navigate('/login');
    }
  };

  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <div className="min-h-screen wave-background bg-gradient-to-b from-primary-purple/10 to-background-soft-white">
      {/* Skip to main content link */}
      <a href="#main-content" className="skip-link sr-only focus:not-sr-only">
        Skip to main content
      </a>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-heading text-primary-purple">
              Lifely
            </h1>
            <nav className="flex items-center space-x-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogin}
              >
                Login
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRegister}
              >
                Sign Up
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" tabIndex={-1}>
        <div className="text-center">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto mb-16 animate-fade-in">
            <h2 className="text-5xl md:text-6xl font-heading text-text-grey mb-6">
              Welcome to <span className="text-primary-purple">Lifely</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Professional session management platform for mentors and patients.
              Start, manage, and join sessions seamlessly.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                variant="primary"
                size="lg"
                onClick={handleLogin}
                className="min-w-[200px]"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Login to Continue
                </span>
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={handleRegister}
                className="min-w-[200px]"
              >
                Create Account
              </Button>
            </div>
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-5xl mx-auto">
            <div className="bg-white rounded-card-lg shadow-lg p-8 hover:shadow-xl transition-shadow duration-200">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-primary-purple to-primary-purple-accent flex items-center justify-center text-white">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-xl font-heading text-text-grey mb-3">Create Sessions</h3>
              <p className="text-gray-600">
                Easily start new sessions and invite participants with just a few clicks.
              </p>
            </div>

            <div className="bg-white rounded-card-lg shadow-lg p-8 hover:shadow-xl transition-shadow duration-200">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-heading text-text-grey mb-3">Manage Sessions</h3>
              <p className="text-gray-600">
                View, edit, and manage all your sessions from one central dashboard.
              </p>
            </div>

            <div className="bg-white rounded-card-lg shadow-lg p-8 hover:shadow-xl transition-shadow duration-200">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-heading text-text-grey mb-3">Join Sessions</h3>
              <p className="text-gray-600">
                Join existing sessions quickly with device testing and consent management.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-gray-500 text-center">
            © 2024 Lifely Session Management. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};


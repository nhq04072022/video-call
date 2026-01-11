/**
 * Main Layout Component for application pages
 */
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../stores/authStore';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  // Filter nav items based on user role
  const allNavItems = [
    { path: '/mentors', label: 'Find Mentors', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', roles: ['MENTEE'] },
    { path: '/bookings', label: 'My Bookings', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', roles: ['MENTEE'] },
    { path: '/sessions', label: 'Sessions', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z', roles: ['MENTOR', 'MENTEE'] },
    { path: '/calendar', label: 'Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', roles: ['MENTOR'] },
    { path: '/profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', roles: ['MENTOR', 'MENTEE'] },
  ];

  // Filter nav items based on user role
  const navItems = allNavItems.filter(item => {
    if (!user) return false;
    const userRole = user.role?.toUpperCase();
    return item.roles.includes(userRole as 'MENTOR' | 'MENTEE');
  });

  const isActive = (path: string) => {
    if (path === '/sessions') {
      return location.pathname === '/sessions' || location.pathname === '/';
    }
    if (path === '/mentors') {
      return location.pathname.startsWith('/mentors');
    }
    if (path === '/bookings') {
      return location.pathname.startsWith('/bookings');
    }
    if (path === '/calendar') {
      return location.pathname.startsWith('/calendar');
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background-soft-white wave-background">
      {/* Skip to main content link for keyboard navigation */}
      <a href="#main-content" className="skip-link sr-only focus:not-sr-only">
        Skip to main content
      </a>
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(user?.role?.toUpperCase() === 'MENTOR' ? '/sessions' : '/mentors')}
                className="text-2xl font-heading text-primary-purple hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary-purple rounded"
                aria-label="Go to home"
              >
                Lifely
              </button>
            </div>
            <nav className="flex items-center space-x-2" aria-label="Main navigation">
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Button
                    key={item.path}
                    variant={active ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => navigate(item.path)}
                    className={`min-w-[80px] ${active ? 'shadow-md' : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                      {item.label}
                    </span>
                  </Button>
                );
              })}
              
              {/* User Menu */}
              {user && (
                <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-300">
                  <div className="flex items-center gap-2">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-purple to-primary-purple/70 flex items-center justify-center text-white text-sm font-semibold">
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm text-text-grey hidden md:inline">
                      {user.full_name}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="min-w-[80px]"
                    aria-label="Đăng xuất"
                  >
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Đăng xuất
                    </span>
                  </Button>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" tabIndex={-1}>
        {title && (
          <h2 className="text-2xl font-heading text-text-grey mb-6">{title}</h2>
        )}
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-sm text-gray-500 text-center">
            © 2024 Lifely Session Management
          </p>
        </div>
      </footer>
    </div>
  );
};


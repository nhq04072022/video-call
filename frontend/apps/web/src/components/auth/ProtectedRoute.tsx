/**
 * Protected Route Component - Redirects to login if not authenticated
 * 
 * TEMPORARY: Bypass authentication for testing internal pages
 * Set ENABLE_AUTH=true to re-enable authentication
 */
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Development flag to bypass authentication
const ENABLE_AUTH = true; // Set to false to bypass authentication for testing

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, setToken, setUser } = useAuth();
  const location = useLocation();

  // Auto-login with mock user for testing (when auth is disabled)
  useEffect(() => {
    if (!ENABLE_AUTH && !isAuthenticated) {
      // Set mock user automatically
      const mockUser = {
        id: 'mentor-1',
        email: 'mentor@example.com',
        name: 'Dr. Smith',
        full_name: 'Dr. Smith',
        role: 'mentor' as const,
        is_active: true,
        is_email_verified: true,
      };
      setToken('mock-token-for-testing');
      setUser(mockUser);
    }
  }, [isAuthenticated, setToken, setUser]);

  if (ENABLE_AUTH && !isAuthenticated) {
    // Always redirect to home first, then user can login
    // Preserve intended destination for after login
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/?redirectTo=${redirectTo}`} replace />;
  }

  return <>{children}</>;
};


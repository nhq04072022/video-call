/**
 * User Profile Edit Page - Role-based routing
 * Routes to MentorProfileEditPage or MenteeProfileEditPage based on user role
 */
import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { MentorProfileEditPage } from './MentorProfileEditPage';
import { MenteeProfileEditPage } from './MenteeProfileEditPage';

export const UserProfileEditPage: React.FC = () => {
  const { user } = useAuthStore();
  const isMentor = user?.role === 'mentor' || user?.role === 'MENTOR';

  if (isMentor) {
    return <MentorProfileEditPage />;
  }

  return <MenteeProfileEditPage />;
};

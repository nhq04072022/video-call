import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import type { FutureConfig } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { SessionActivePage } from './pages/SessionActivePage';
import { MentorSearchPage } from './pages/MentorSearchPage';
import { MentorDetailPage } from './pages/MentorDetailPage';
import { BookingPage } from './pages/BookingPage';
import { BookingListPage } from './pages/BookingListPage';
import { BookingDetailPage } from './pages/BookingDetailPage';
import { BookingConfirmationPage } from './pages/BookingConfirmationPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { UserProfileEditPage } from './pages/UserProfileEditPage';
import { SettingsPage } from './pages/SettingsPage';
import { ReviewPage } from './pages/ReviewPage';
import { SessionApplyPage } from './pages/SessionApplyPage';
import { SessionDetailPage } from './pages/SessionDetailPage';
import { SessionWaitingPage } from './pages/SessionWaitingPage';
import { SessionCreatePage } from './pages/SessionCreatePage';
import { SessionSummaryPage } from './pages/SessionSummaryPage';
import { MentorCalendarPage } from './pages/MentorCalendarPage';

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        {/* Home Page - Public landing page with login */}
        <Route
          path="/"
          element={<HomePage />}
        />
        
        {/* Routes with AuthLayout */}
        <Route
          path="/login"
          element={<LoginPage />}
        />
        <Route
          path="/register"
          element={<RegisterPage />}
        />

        {/* Protected Routes with MainLayout */}
        {/* Dashboard - Main entry point */}
        <Route
          path="/sessions"
          element={
            <ProtectedRoute>
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Session Create Page - MUST come before /sessions/:sessionId to avoid route conflict */}
        <Route
          path="/sessions/create"
          element={
            <ProtectedRoute>
              <MainLayout>
                <SessionCreatePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Session Detail Page */}
        <Route
          path="/sessions/:sessionId"
          element={
            <ProtectedRoute>
              <MainLayout>
                <SessionDetailPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Session Waiting Room */}
        <Route
          path="/sessions/:sessionId/waiting"
          element={
            <ProtectedRoute>
              <SessionWaitingPage />
            </ProtectedRoute>
          }
        />

        {/* Active Session - Video call page */}
        <Route
          path="/sessions/:sessionId/active"
          element={
            <ProtectedRoute>
              <SessionActivePage />
            </ProtectedRoute>
          }
        />
        {/* Fallback route for /sessions/active (without sessionId) */}
        <Route
          path="/sessions/active"
          element={
            <ProtectedRoute>
              <SessionActivePage />
            </ProtectedRoute>
          }
        />

        {/* Session Summary Page - After ending session */}
        <Route
          path="/sessions/:sessionId/summary"
          element={
            <ProtectedRoute>
              <MainLayout>
                <SessionSummaryPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Mentor Discovery Routes */}
        <Route
          path="/mentors"
          element={
            <ProtectedRoute>
              <MainLayout>
                <MentorSearchPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mentors/:mentorId"
          element={
            <ProtectedRoute>
              <MainLayout>
                <MentorDetailPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mentors/:mentorId/book"
          element={
            <ProtectedRoute>
              <MainLayout>
                <BookingPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:mentorId/apply"
          element={
            <ProtectedRoute>
              <MainLayout>
                <SessionApplyPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Booking Routes */}
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <MainLayout>
                <BookingListPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings/:bookingId"
          element={
            <ProtectedRoute>
              <MainLayout>
                <BookingDetailPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings/:bookingId/confirmation"
          element={
            <ProtectedRoute>
              <MainLayout>
                <BookingConfirmationPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Calendar Route - Mentor only */}
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <MainLayout>
                <MentorCalendarPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Profile Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <MainLayout>
                <UserProfilePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute>
              <MainLayout>
                <UserProfileEditPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <MainLayout>
                <SettingsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Review Routes */}
        <Route
          path="/reviews/:bookingId/create"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ReviewPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;






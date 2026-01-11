import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarView } from '../components/features/calendar/CalendarView';
import { AvailabilityManager } from '../components/features/calendar/AvailabilityManager';
import { NotificationCenter } from '../components/features/calendar/NotificationCenter';
import { NotificationPreferencesComponent } from '../components/features/calendar/NotificationPreferences';
import type { CalendarEvent } from '../types/calendar';
import { Button } from '../components/ui/Button';

export const MentorCalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day'>('month');
  const [showAvailability, setShowAvailability] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    if (event.extendedProps?.session_id) {
      navigate(`/sessions/${event.id}`);
    }
  };

  return (
    <div className="w-full flex flex-col bg-white -mx-4 sm:-mx-6 lg:-mx-8 -my-8" style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}>
      {/* Google Calendar Style Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="max-w-full mx-auto px-4 sm:px-6">
          {/* Top Toolbar */}
          <div className="flex items-center justify-between h-14">
            {/* Left: Logo and Navigation */}
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-medium text-gray-700">Calendar</h1>
              <div className="flex items-center gap-1 border border-gray-300 rounded-md overflow-hidden">
                <button
                  onClick={() => {
                    const calendar = (window as any).calendarRef;
                    if (calendar?.current?.getApi) {
                      calendar.current.getApi().today();
                    }
                  }}
                  className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Hôm nay
                </button>
                <div className="h-6 w-px bg-gray-300"></div>
                <button
                  onClick={() => {
                    const calendar = (window as any).calendarRef;
                    if (calendar?.current?.getApi) {
                      calendar.current.getApi().prev();
                    }
                  }}
                  className="px-2 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="Previous"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    const calendar = (window as any).calendarRef;
                    if (calendar?.current?.getApi) {
                      calendar.current.getApi().next();
                    }
                  }}
                  className="px-2 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="Next"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              {/* Month/Year Display - will be updated by FullCalendar */}
              <div id="calendar-title" className="text-lg font-medium text-gray-900 min-w-[200px]">
                {/* FullCalendar will update this */}
              </div>
            </div>

            {/* Right: View Selector and Actions */}
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                <button
                  onClick={() => setCurrentView('month')}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                    currentView === 'month'
                      ? 'bg-blue-50 text-blue-600 border-r border-gray-300'
                      : 'text-gray-700 hover:bg-gray-50 border-r border-gray-300'
                  }`}
                >
                  Tháng
                </button>
                <button
                  onClick={() => setCurrentView('week')}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                    currentView === 'week'
                      ? 'bg-blue-50 text-blue-600 border-r border-gray-300'
                      : 'text-gray-700 hover:bg-gray-50 border-r border-gray-300'
                  }`}
                >
                  Tuần
                </button>
                <button
                  onClick={() => setCurrentView('day')}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                    currentView === 'day'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Ngày
                </button>
              </div>
              <button
                onClick={() => {
                  setShowAvailability(!showAvailability);
                  if (showAvailability) setShowPreferences(false);
                }}
                className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors border border-gray-300"
              >
                {showAvailability || showPreferences ? 'Ẩn' : 'Hiện'} Sidebar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Calendar - Main Area */}
        <div className="flex-1 overflow-hidden bg-white">
          <div className="h-full w-full">
            <CalendarView view={currentView} onEventClick={handleEventClick} />
          </div>
        </div>

        {/* Right Sidebar - Collapsible */}
        <div className={`flex-shrink-0 border-l border-gray-200 bg-white transition-all duration-300 ${
          showAvailability || showPreferences ? 'w-80' : 'w-0 overflow-hidden'
        }`}>
          <div className="h-full overflow-y-auto p-4 space-y-4">
            {/* Notification Center */}
            <NotificationCenter />

            {/* Tabs for Availability and Preferences */}
            <div className="flex gap-2 border-b border-gray-200">
              <button
                onClick={() => {
                  setShowAvailability(true);
                  setShowPreferences(false);
                }}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  showAvailability
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Lịch trống
              </button>
              <button
                onClick={() => {
                  setShowPreferences(true);
                  setShowAvailability(false);
                }}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  showPreferences
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Thông báo
              </button>
            </div>

            {/* Availability Manager */}
            {showAvailability && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Lịch trống</h2>
                <AvailabilityManager />
              </div>
            )}

            {/* Notification Preferences */}
            {showPreferences && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Cài đặt thông báo</h2>
                <NotificationPreferencesComponent />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

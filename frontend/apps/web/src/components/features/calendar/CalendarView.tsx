import React, { useEffect, useRef, useState, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { CalendarEvent } from '../../../types/calendar';
import { calendarApi } from '../../../services/calendarApi';

// Vietnamese locale configuration
const viLocale = {
  code: 'vi',
  week: {
    dow: 1, // Monday is the first day of the week
    doy: 4, // The week that contains Jan 4th is the first week of the year
  },
  buttonText: {
    prev: 'Trước',
    next: 'Sau',
    today: 'Hôm nay',
    month: 'Tháng',
    week: 'Tuần',
    day: 'Ngày',
  },
  weekText: 'Tuần',
  allDayText: 'Cả ngày',
  moreLinkText: (n: number) => `+${n} nữa`,
  noEventsText: 'Không có sự kiện',
};

interface CalendarViewProps {
  view?: 'month' | 'week' | 'day';
  onEventClick?: (event: CalendarEvent) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  view = 'month',
  onEventClick,
}) => {
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async (start: Date, end: Date) => {
    try {
      setLoading(true);
      setError(null);
      
      // FullCalendar provides dates in the calendar's timezone
      // Convert to ISO strings for API (UTC)
      const startStr = start.toISOString();
      const endStr = end.toISOString();
      
      console.log(`[CalendarView] Fetching events from ${startStr} to ${endStr}`);
      
      const fetchedEvents = await calendarApi.getCalendarEventsForFullCalendar(startStr, endStr);
      
      console.log(`[CalendarView] Received ${fetchedEvents.length} events:`, fetchedEvents);
      
      // Validate events have valid dates
      const validEvents = fetchedEvents.filter((event) => {
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.error(`[CalendarView] Invalid event dates:`, event);
          return false;
        }
        return true;
      });
      
      console.log(`[CalendarView] Setting ${validEvents.length} valid events`);
      setEvents(validEvents);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
      setError('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  const handleDatesSet = useCallback((arg: { start: Date; end: Date }) => {
    fetchEvents(arg.start, arg.end);
  }, []);

  const handleEventClick = (clickInfo: any) => {
    const event: CalendarEvent = {
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start: clickInfo.event.start.toISOString(),
      end: clickInfo.event.end.toISOString(),
      backgroundColor: clickInfo.event.backgroundColor,
      borderColor: clickInfo.event.borderColor,
      textColor: clickInfo.event.textColor,
      extendedProps: clickInfo.event.extendedProps,
    };
    if (onEventClick) {
      onEventClick(event);
    }
  };

  // Expose calendar ref to window for navigation buttons
  useEffect(() => {
    (window as any).calendarRef = calendarRef;
    return () => {
      delete (window as any).calendarRef;
    };
  }, []);

  // Update calendar view when prop changes
  useEffect(() => {
    if (calendarRef.current?.getApi) {
      const api = calendarRef.current.getApi();
      const currentViewType = api.view.type;
      let targetView: string;
      
      if (view === 'month') {
        targetView = 'dayGridMonth';
      } else if (view === 'week') {
        targetView = 'timeGridWeek';
      } else {
        targetView = 'timeGridDay';
      }
      
      // Only change view if it's different from current
      if (currentViewType !== targetView) {
        console.log(`[CalendarView] Changing view from ${currentViewType} to ${targetView}`);
        api.changeView(targetView);
      }
    }
  }, [view]);

  // Update title display when view changes
  useEffect(() => {
    if (calendarRef.current?.getApi) {
      const api = calendarRef.current.getApi();
      const updateTitle = () => {
        const titleEl = document.getElementById('calendar-title');
        if (titleEl) {
          const currentView = api.view;
          if (currentView.type === 'dayGridMonth') {
            const date = currentView.currentStart;
            const monthNames = [
              'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
              'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
            ];
            titleEl.textContent = `${monthNames[date.getMonth()]}, ${date.getFullYear()}`;
          } else if (currentView.type === 'timeGridWeek') {
            const start = currentView.currentStart;
            const end = currentView.currentEnd;
            const monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
            if (start.getMonth() === end.getMonth()) {
              titleEl.textContent = `${start.getDate()}-${end.getDate()} ${monthNames[start.getMonth()]}, ${start.getFullYear()}`;
            } else {
              titleEl.textContent = `${start.getDate()} ${monthNames[start.getMonth()]} - ${end.getDate()} ${monthNames[end.getMonth()]}, ${start.getFullYear()}`;
            }
          } else {
            const date = currentView.currentStart;
            const monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
            titleEl.textContent = `${date.getDate()} ${monthNames[date.getMonth()]}, ${date.getFullYear()}`;
          }
        }
      };
      api.on('datesSet', updateTitle);
      api.on('viewChange' as any, updateTitle);
      updateTitle();
      return () => {
        api.off('datesSet', updateTitle);
        api.off('viewChange' as any, updateTitle);
      };
    }
  }, [view]);

  // Log events changes for debugging
  useEffect(() => {
    console.log(`[CalendarView] Events updated: ${events.length} events`, events);
    if (calendarRef.current?.getApi) {
      const api = calendarRef.current.getApi();
      // Force calendar to re-render events
      api.refetchEvents();
    }
  }, [events]);

  return (
    <div className="w-full h-full overflow-hidden bg-white relative" style={{ minHeight: '500px' }}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded m-4">
          {error}
        </div>
      )}
      <div className="w-full h-full overflow-hidden" style={{ minHeight: '500px' }}>
        <style>{`
          /* Google Calendar Style Styling */
          .fc {
            width: 100%;
            height: 100%;
            font-family: 'Roboto', 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            border: none;
            background: linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%);
          }
          
          /* Hide default header toolbar */
          .fc-header-toolbar {
            display: none !important;
          }
          
          /* Day headers styling */
          .fc-col-header-cell {
            padding: 10px 6px;
            background: linear-gradient(to bottom, #f1f3f4 0%, #ffffff 100%);
            border-bottom: 2px solid #dadce0;
            border-right: 1px solid #dadce0;
            font-size: 11px;
            font-weight: 600;
            color: #5f6368;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .fc-col-header-cell:last-child {
            border-right: 1px solid #dadce0;
          }
          
          /* Day cells styling */
          .fc-daygrid-day {
            border-right: 1px solid #dadce0;
            border-bottom: 1px solid #dadce0;
            background-color: #ffffff;
            transition: all 0.2s ease;
            position: relative;
          }
          
          .fc-daygrid-day:hover {
            background-color: #f0f4ff;
            border: 2px solid #6366f1;
            border-radius: 4px;
            z-index: 5;
            box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
          }
          
          .fc-daygrid-day:last-child {
            border-right: 1px solid #dadce0;
          }
          
          .fc-daygrid-day:last-child:hover {
            border-right: 2px solid #6366f1;
          }
          
          .fc-daygrid-day-frame {
            min-height: 100px;
            padding: 6px;
            border: none;
          }
          
          .fc-daygrid-day:hover .fc-daygrid-day-frame {
            border: none;
          }
          
          /* Today highlight */
          .fc-day-today {
            background: linear-gradient(to bottom, #e8f0fe 0%, #fef7e0 100%) !important;
            border-left: 3px solid #1a73e8 !important;
          }
          
          .fc-day-today .fc-daygrid-day-frame {
            border-left: 3px solid #1a73e8 !important;
          }
          
          .fc-daygrid-day-number {
            padding: 4px 8px;
            font-size: 13px;
            font-weight: 500;
            color: #3c4043;
            cursor: pointer;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 2px;
            transition: all 0.2s ease;
          }
          
          .fc-daygrid-day-number:hover {
            background-color: #e8f0fe;
            color: #1a73e8;
          }
          
          .fc-day-today .fc-daygrid-day-number {
            background: linear-gradient(135deg, #1a73e8 0%, #4285f4 100%);
            color: white;
            font-weight: 600;
            box-shadow: 0 2px 4px rgba(26, 115, 232, 0.3);
          }
          
          /* Other month days */
          .fc-day-other {
            background-color: #f8f9fa;
            opacity: 0.6;
          }
          
          .fc-day-other .fc-daygrid-day-number {
            color: #9aa0a6;
          }
          
          /* Events styling - Google Calendar style */
          .fc-event {
            border: none;
            border-radius: 6px;
            padding: 4px 8px;
            margin: 2px 0;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08);
            transition: all 0.2s ease;
            border-left: 4px solid;
          }
          
          .fc-event:hover {
            box-shadow: 0 4px 8px rgba(0,0,0,0.18), 0 2px 4px rgba(0,0,0,0.12);
            transform: translateY(-1px);
            z-index: 10;
          }
          
          .fc-event-title {
            font-weight: 500;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.4;
          }
          
          .fc-event-time {
            font-weight: 600;
            margin-right: 6px;
            opacity: 0.95;
          }
          
          /* Month view events */
          .fc-daygrid-event {
            border-left: 4px solid;
            padding-left: 6px;
            border-radius: 4px;
          }
          
          /* Week/Day view events */
          .fc-timegrid-event {
            border-left: 4px solid;
            border-radius: 6px;
            padding: 6px 10px;
          }
          
          /* Event colors - more vibrant */
          .fc-event[style*="background-color: rgb(99, 102, 241)"] {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
            border-left-color: #4f46e5 !important;
          }
          
          .fc-event[style*="background-color: rgb(245, 158, 11)"] {
            background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%) !important;
            border-left-color: #d97706 !important;
          }
          
          .fc-event[style*="background-color: rgb(16, 185, 129)"] {
            background: linear-gradient(135deg, #10b981 0%, #34d399 100%) !important;
            border-left-color: #059669 !important;
          }
          
          .fc-event[style*="background-color: rgb(59, 130, 246)"] {
            background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%) !important;
            border-left-color: #2563eb !important;
          }
          
          .fc-event[style*="background-color: rgb(107, 114, 128)"] {
            background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%) !important;
            border-left-color: #4b5563 !important;
          }
          
          .fc-event[style*="background-color: rgb(239, 68, 68)"] {
            background: linear-gradient(135deg, #ef4444 0%, #f87171 100%) !important;
            border-left-color: #dc2626 !important;
          }
          
          /* More events link */
          .fc-more-link {
            font-size: 11px;
            color: #1a73e8;
            font-weight: 600;
            padding: 4px 8px;
            margin-top: 4px;
            cursor: pointer;
            border-radius: 4px;
            transition: all 0.2s ease;
          }
          
          .fc-more-link:hover {
            background: linear-gradient(135deg, #e8f0fe 0%, #d2e3fc 100%);
            color: #1557b0;
            box-shadow: 0 1px 3px rgba(26, 115, 232, 0.2);
          }
          
          /* Week view styling */
          .fc-timegrid-slot {
            height: 48px;
            border-top: 1px solid #e8eaed;
          }
          
          .fc-timegrid-slot-label {
            font-size: 11px;
            color: #5f6368;
            padding: 0 10px;
            font-weight: 500;
          }
          
          .fc-timegrid-col {
            border-right: 1px solid #dadce0;
          }
          
          .fc-timegrid-col:hover {
            background-color: #f8f9fa;
          }
          
          /* Scrollbar styling */
          .fc-scroller {
            overflow-y: auto;
            overflow-x: hidden;
          }
          
          .fc-scroller::-webkit-scrollbar {
            width: 10px;
          }
          
          .fc-scroller::-webkit-scrollbar-track {
            background: #f1f3f4;
            border-radius: 5px;
          }
          
          .fc-scroller::-webkit-scrollbar-thumb {
            background: linear-gradient(to bottom, #dadce0 0%, #bdc1c6 100%);
            border-radius: 5px;
            border: 2px solid #f1f3f4;
          }
          
          .fc-scroller::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(to bottom, #bdc1c6 0%, #9aa0a6 100%);
          }
          
          /* Remove default borders */
          .fc-theme-standard td,
          .fc-theme-standard th {
            border-color: #dadce0;
          }
          
          /* Day grid cell */
          .fc-daygrid-day-top {
            flex-direction: row;
            justify-content: flex-start;
            padding: 4px;
          }
          
          /* Weekend styling */
          .fc-day-sat,
          .fc-day-sun {
            background-color: #fafbfc;
          }
          
          .fc-day-sat:hover,
          .fc-day-sun:hover {
            background-color: #f1f3f4;
          }
          
          /* Event container */
          .fc-daygrid-event-harness {
            margin: 1px 0;
          }
          
          /* Better spacing for events */
          .fc-daygrid-day-events {
            margin-top: 4px;
          }
        `}</style>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={view === 'month' ? 'dayGridMonth' : view === 'week' ? 'timeGridWeek' : 'timeGridDay'}
          events={events}
          datesSet={handleDatesSet}
          eventClick={handleEventClick}
          headerToolbar={false}
          height="100%"
          contentHeight="auto"
          eventDisplay="block"
          dayMaxEvents={5}
          moreLinkClick="popover"
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            hour12: false,
          }}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          slotDuration="00:30:00"
          slotLabelInterval="01:00:00"
          weekends={true}
          editable={false}
          selectable={false}
          allDaySlot={false}
          eventTextColor="#ffffff"
          eventOverlap={false}
          displayEventTime={true}
          eventShortHeight={22}
          eventMinHeight={22}
          locale={viLocale}
          firstDay={1}
          dayHeaderContent={(arg) => {
            // Custom day header with Vietnamese names
            const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
            return dayNames[arg.date.getDay()];
          }}
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
            <div className="text-gray-500 text-lg">Đang tải lịch...</div>
          </div>
        )}
      </div>
    </div>
  );
};

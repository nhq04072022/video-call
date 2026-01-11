import React, { useState, useEffect } from 'react';
import { notificationApi } from '../../../services/notificationApi';
import type { Notification } from '../../../types/calendar';
import { Button } from '../../ui/Button';

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationApi.getNotifications(true, 5, 0);
      setNotifications(response.notifications);
      setUnreadCount(response.total);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationApi.markAsRead(notificationId);
      await loadNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      await loadNotifications();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 w-full max-w-full overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-heading text-text-grey truncate">Notifications</h2>
        {unreadCount > 0 && (
          <span className="bg-primary-purple text-white text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ml-2">
            {unreadCount}
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-text-grey text-sm">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="text-text-grey/70 text-sm">No new notifications</div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {notifications.slice(0, showAll ? notifications.length : 3).map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border ${
                notification.read_at
                  ? 'bg-gray-50 border-gray-200'
                  : 'bg-purple-50 border-purple-200'
              } w-full`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-text-grey text-sm truncate">{notification.title}</div>
                  <div className="text-text-grey/70 text-xs mt-1 break-words">{notification.message}</div>
                  <div className="text-text-grey/50 text-xs mt-1">
                    {new Date(notification.created_at).toLocaleString()}
                  </div>
                </div>
                {!notification.read_at && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="flex-shrink-0"
                  >
                    Mark read
                  </Button>
                )}
              </div>
            </div>
          ))}
          {notifications.length > 3 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="w-full mt-2"
            >
              {showAll ? 'Show less' : `Show all (${notifications.length})`}
            </Button>
          )}
          {unreadCount > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="w-full mt-2"
            >
              Mark all as read
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

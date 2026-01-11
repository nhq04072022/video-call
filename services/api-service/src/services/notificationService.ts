import pool from '../db';
import { EmailService } from './emailService';

export interface NotificationJob {
  id: string;
  session_id: string;
  user_id: string;
  notification_type: '24h_before' | '1h_before' | '15min_before' | '5min_before';
  scheduled_time: Date;
  status: 'pending' | 'sent' | 'failed' | 'canceled';
}

/**
 * Create notification jobs for a session
 * Creates jobs for 24h, 1h, 15min, and 5min before the session
 */
export async function createNotificationJobs(
  sessionId: string,
  scheduledTime: Date,
  userId: string
): Promise<void> {
  try {
    const notificationTypes: Array<'24h_before' | '1h_before' | '15min_before' | '5min_before'> = [
      '24h_before',
      '1h_before',
      '15min_before',
      '5min_before',
    ];

    const timeOffsets = {
      '24h_before': 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      '1h_before': 60 * 60 * 1000, // 1 hour
      '15min_before': 15 * 60 * 1000, // 15 minutes
      '5min_before': 5 * 60 * 1000, // 5 minutes
    };

    const jobs = notificationTypes.map((type) => {
      const scheduledTimeMs = scheduledTime.getTime();
      const offset = timeOffsets[type];
      const jobScheduledTime = new Date(scheduledTimeMs - offset);

      // Only create job if scheduled time is in the future
      if (jobScheduledTime > new Date()) {
        return {
          session_id: sessionId,
          user_id: userId,
          notification_type: type,
          scheduled_time: jobScheduledTime,
          status: 'pending' as const,
        };
      }
      return null;
    }).filter((job) => job !== null);

    if (jobs.length === 0) {
      console.log(`[notificationService] No notification jobs created for session ${sessionId} (session is too soon)`);
      return;
    }

    // Insert jobs
    for (const job of jobs) {
      if (job) {
        await pool.query(
          `INSERT INTO notification_jobs (session_id, user_id, notification_type, scheduled_time, status)
           VALUES ($1, $2, $3, $4, $5)`,
          [job.session_id, job.user_id, job.notification_type, job.scheduled_time, job.status]
        );
      }
    }

    console.log(`[notificationService] Created ${jobs.length} notification jobs for session ${sessionId}`);
  } catch (error) {
    console.error('[notificationService] Error creating notification jobs:', error);
    throw error;
  }
}

/**
 * Cancel notification jobs for a session
 */
export async function cancelNotificationJobs(sessionId: string): Promise<void> {
  try {
    await pool.query(
      `UPDATE notification_jobs 
       SET status = 'canceled', updated_at = NOW()
       WHERE session_id = $1 AND status = 'pending'`,
      [sessionId]
    );
    console.log(`[notificationService] Canceled notification jobs for session ${sessionId}`);
  } catch (error) {
    console.error('[notificationService] Error canceling notification jobs:', error);
    throw error;
  }
}

/**
 * Update notification jobs when a session is rescheduled
 */
export async function updateNotificationJobs(
  sessionId: string,
  newScheduledTime: Date,
  userId: string
): Promise<void> {
  try {
    // Cancel existing jobs
    await cancelNotificationJobs(sessionId);
    // Create new jobs with new scheduled time
    await createNotificationJobs(sessionId, newScheduledTime, userId);
    console.log(`[notificationService] Updated notification jobs for session ${sessionId}`);
  } catch (error) {
    console.error('[notificationService] Error updating notification jobs:', error);
    throw error;
  }
}

/**
 * Process a notification job - send the notification
 */
export async function processNotificationJob(job: NotificationJob): Promise<void> {
  try {
    // Get user preferences
    const prefsResult = await pool.query(
      'SELECT * FROM notification_preferences WHERE user_id = $1',
      [job.user_id]
    );

    const preferences = prefsResult.rows[0] || {
      email_enabled: true,
      in_app_enabled: true,
      push_enabled: false,
      notify_24h_before: true,
      notify_1h_before: true,
      notify_15min_before: true,
      notify_5min_before: true,
    };

    // Check if this notification type is enabled
    const notificationTypeEnabled = {
      '24h_before': preferences.notify_24h_before,
      '1h_before': preferences.notify_1h_before,
      '15min_before': preferences.notify_15min_before,
      '5min_before': preferences.notify_5min_before,
    }[job.notification_type];

    if (!notificationTypeEnabled) {
      // Mark as sent (user has disabled this type)
      await pool.query(
        `UPDATE notification_jobs 
         SET status = 'sent', sent_at = NOW(), updated_at = NOW()
         WHERE id = $1`,
        [job.id]
      );
      return;
    }

    // Get session details with mentor and mentee info
    const sessionResult = await pool.query(
      `SELECT 
        s.*, 
        mentee.full_name as mentee_name,
        mentee.email as mentee_email,
        mentor.full_name as mentor_name,
        mentor.email as mentor_email
       FROM sessions s
       JOIN users mentee ON s.mentee_id = mentee.id
       JOIN users mentor ON s.mentor_id = mentor.id
       WHERE s.id = $1`,
      [job.session_id]
    );

    if (sessionResult.rows.length === 0) {
      throw new Error(`Session ${job.session_id} not found`);
    }

    const session = sessionResult.rows[0];

    // Format notification message
    const timeUntil = {
      '24h_before': '24 hours',
      '1h_before': '1 hour',
      '15min_before': '15 minutes',
      '5min_before': '5 minutes',
    }[job.notification_type];

    const scheduledTime = new Date(session.scheduled_time);
    const formattedTime = scheduledTime.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    const title = `Session Reminder: ${timeUntil} until session`;
    const message = `Your session with ${session.mentee_name} is scheduled for ${formattedTime}.`;

    // Create in-app notification if enabled
    if (preferences.in_app_enabled) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, session_id)
         VALUES ($1, 'session_reminder', $2, $3, $4)`,
        [job.user_id, title, message, job.session_id]
      );
    }

    // Send email if email_enabled
    if (preferences.email_enabled) {
      try {
        const sessionTime = new Date(session.scheduled_time);
        const emailData = {
          sessionId: job.session_id,
          sessionTime,
          menteeName: session.mentee_name,
          menteeEmail: session.mentee_email,
          mentorName: session.mentor_name,
          mentorEmail: session.mentor_email,
          sessionGoal: session.mentee_goal || undefined,
          sessionQuestions: session.mentee_questions || undefined,
        };

        // Determine which email to send based on notification type
        let emailSent = false;
        if (job.notification_type === '24h_before') {
          emailSent = await EmailService.sendSessionReminder24h(emailData);
        } else if (job.notification_type === '1h_before') {
          emailSent = await EmailService.sendSessionReminder1h(emailData);
        }

        if (emailSent) {
          console.log(`[notificationService] Email sent for notification job ${job.id}`);
        } else {
          console.warn(`[notificationService] Email failed to send for notification job ${job.id}`);
        }
      } catch (emailError) {
        console.error(`[notificationService] Error sending email for notification job ${job.id}:`, emailError);
        // Don't fail the entire job if email fails
      }
    }

    // TODO: Send push notification if push_enabled

    // Mark job as sent
    await pool.query(
      `UPDATE notification_jobs 
       SET status = 'sent', sent_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [job.id]
    );

    console.log(`[notificationService] Processed notification job ${job.id} for session ${job.session_id}`);
  } catch (error) {
    console.error(`[notificationService] Error processing notification job ${job.id}:`, error);
    // Mark job as failed
    await pool.query(
      `UPDATE notification_jobs 
       SET status = 'failed', error_message = $1, updated_at = NOW()
       WHERE id = $2`,
      [error instanceof Error ? error.message : 'Unknown error', job.id]
    );
    throw error;
  }
}

/**
 * Get pending notification jobs that are due
 */
export async function getPendingJobs(): Promise<NotificationJob[]> {
  try {
    const result = await pool.query(
      `SELECT id, session_id, user_id, notification_type, scheduled_time, status
       FROM notification_jobs
       WHERE status = 'pending' AND scheduled_time <= NOW()
       ORDER BY scheduled_time ASC
       LIMIT 100`,
      []
    );

    return result.rows.map((row: any) => ({
      id: row.id,
      session_id: row.session_id,
      user_id: row.user_id,
      notification_type: row.notification_type,
      scheduled_time: row.scheduled_time,
      status: row.status,
    }));
  } catch (error) {
    console.error('[notificationService] Error getting pending jobs:', error);
    throw error;
  }
}

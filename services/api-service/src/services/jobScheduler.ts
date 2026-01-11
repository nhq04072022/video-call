import cron from 'node-cron';
import { getPendingJobs, processNotificationJob, NotificationJob } from './notificationService';

let schedulerRunning = false;

/**
 * Start the job scheduler
 * Checks for pending notification jobs every minute
 */
export function startJobScheduler(): void {
  if (schedulerRunning) {
    console.log('[jobScheduler] Scheduler is already running');
    return;
  }

  console.log('[jobScheduler] Starting job scheduler...');

  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const pendingJobs = await getPendingJobs();

      if (pendingJobs.length === 0) {
        return;
      }

      console.log(`[jobScheduler] Processing ${pendingJobs.length} pending notification jobs`);

      // Process jobs in parallel (with limit to avoid overwhelming the system)
      const batchSize = 10;
      for (let i = 0; i < pendingJobs.length; i += batchSize) {
        const batch = pendingJobs.slice(i, i + batchSize);
        await Promise.allSettled(
          batch.map((job) => processNotificationJob(job))
        );
      }
    } catch (error) {
      console.error('[jobScheduler] Error processing jobs:', error);
    }
  });

  schedulerRunning = true;
  console.log('[jobScheduler] Job scheduler started (checking every minute)');
}

/**
 * Stop the job scheduler
 */
export function stopJobScheduler(): void {
  // Note: node-cron doesn't provide a direct way to stop a specific schedule
  // In production, you might want to use a more sophisticated scheduler
  schedulerRunning = false;
  console.log('[jobScheduler] Job scheduler stopped');
}

/**
 * Process jobs immediately (for testing or manual triggers)
 */
export async function processJobsNow(): Promise<void> {
  try {
    const pendingJobs = await getPendingJobs();
    console.log(`[jobScheduler] Processing ${pendingJobs.length} jobs immediately`);

    for (const job of pendingJobs) {
      try {
        await processNotificationJob(job);
      } catch (error) {
        console.error(`[jobScheduler] Failed to process job ${job.id}:`, error);
      }
    }
  } catch (error) {
    console.error('[jobScheduler] Error processing jobs:', error);
    throw error;
  }
}

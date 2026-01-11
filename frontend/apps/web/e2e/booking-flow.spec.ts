import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-token',
          token_type: 'bearer',
          user: {
            id: 'mentee-1',
            email: 'mentee@example.com',
            full_name: 'Test Mentee',
            role: 'mentee',
          },
        }),
      });
    });

    // Mock mentor detail
    await page.route('**/api/v1/mentors/mentor-1**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'mentor-1',
          bio: 'Experienced mentor',
          hourly_rate: 50.0,
          is_available: true,
        }),
      });
    });

    // Mock available slots
    await page.route('**/api/v1/bookings/mentors/mentor-1/available-slots**', async (route) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      
      const slots = [];
      for (let i = 0; i < 5; i++) {
        const slotTime = new Date(tomorrow);
        slotTime.setHours(10 + i, 0, 0, 0);
        slots.push({
          start_time: slotTime.toISOString(),
          end_time: new Date(slotTime.getTime() + 60 * 60 * 1000).toISOString(),
          duration_minutes: 60,
        });
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ slots }),
      });
    });

    // Mock booking creation
    await page.route('**/api/v1/bookings', async (route) => {
      if (route.request().method() === 'POST') {
        const body = await route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'booking-123',
            mentor_id: 'mentor-1',
            mentee_id: 'mentee-1',
            scheduled_start_time: body.scheduled_start_time,
            scheduled_end_time: body.scheduled_end_time || new Date(new Date(body.scheduled_start_time).getTime() + body.duration_minutes * 60 * 1000).toISOString(),
            duration_minutes: body.duration_minutes,
            status: 'pending',
            notes: body.notes,
          }),
        });
      } else {
        // GET request - list bookings
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'booking-123',
              mentor_id: 'mentor-1',
              mentee_id: 'mentee-1',
              scheduled_start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              scheduled_end_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
              duration_minutes: 60,
              status: 'pending',
            },
          ]),
        });
      }
    });

    // Mock booking detail
    await page.route('**/api/v1/bookings/booking-123**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'booking-123',
          mentor_id: 'mentor-1',
          mentee_id: 'mentee-1',
          scheduled_start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          scheduled_end_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
          duration_minutes: 60,
          status: 'pending',
        }),
      });
    });
  });

  test('should display booking page', async ({ page }) => {
    await page.goto('/mentors/mentor-1/book');
    
    await expect(page.locator('h1')).toContainText(/Book a Session/i);
    await expect(page.locator('text=Select a time slot')).toBeVisible();
  });

  test('should display available time slots', async ({ page }) => {
    await page.goto('/mentors/mentor-1/book');
    
    // Wait for slots to load
    await page.waitForSelector('text=Select Time Slot', { timeout: 5000 });
    
    // Should see at least one slot
    const slots = page.locator('button').filter({ hasText: /AM|PM/ });
    await expect(slots.first()).toBeVisible({ timeout: 5000 });
  });

  test('should select time slot and create booking', async ({ page }) => {
    await page.goto('/mentors/mentor-1/book');
    
    await page.waitForSelector('text=Select Time Slot', { timeout: 5000 });
    
    // Select first available slot
    const firstSlot = page.locator('button').filter({ hasText: /AM|PM/ }).first();
    await firstSlot.click();
    
    // Add notes
    const notesTextarea = page.locator('textarea[id="notes"]');
    await notesTextarea.fill('Looking forward to learning web development');
    
    // Submit booking
    const submitButton = page.locator('button:has-text("Confirm Booking")');
    await submitButton.click();
    
    // Should navigate to confirmation page
    await page.waitForURL(/\/bookings\/booking-123\/confirmation/, { timeout: 5000 });
    await expect(page.locator('text=Booking Confirmed!')).toBeVisible();
  });

  test('should display booking confirmation page', async ({ page }) => {
    await page.goto('/bookings/booking-123/confirmation');
    
    await expect(page.locator('text=Booking Confirmed!')).toBeVisible();
    await expect(page.locator('text=Session Date & Time')).toBeVisible();
    await expect(page.locator('button:has-text("View My Bookings")')).toBeVisible();
  });

  test('should display booking list page', async ({ page }) => {
    await page.goto('/bookings');
    
    await expect(page.locator('h1')).toContainText(/My Bookings/i);
    await expect(page.locator('text=Session with Mentor')).toBeVisible();
  });

  test('should filter bookings by status', async ({ page }) => {
    await page.goto('/bookings');
    
    // Click on Pending filter
    const pendingButton = page.locator('button:has-text("Pending")');
    await pendingButton.click();
    
    // Should still show bookings
    await page.waitForTimeout(500);
  });

  test('should navigate to booking detail page', async ({ page }) => {
    await page.goto('/bookings');
    
    await page.waitForSelector('text=View Details', { timeout: 5000 });
    
    const viewDetailsButton = page.locator('button:has-text("View Details")').first();
    await viewDetailsButton.click();
    
    await page.waitForURL(/\/bookings\/booking-123/, { timeout: 5000 });
    await expect(page.locator('h1')).toContainText(/Booking Details/i);
  });

  test('should cancel booking', async ({ page }) => {
    // Mock cancellation API
    await page.route('**/api/v1/bookings/booking-123/cancel', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'booking-123',
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        }),
      });
    });

    await page.goto('/bookings/booking-123');
    
    // Setup dialog handler
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('cancel');
      await dialog.accept();
    });
    
    const cancelButton = page.locator('button:has-text("Cancel Booking")');
    await cancelButton.click();
    
    // Should navigate back to bookings list
    await page.waitForURL(/\/bookings/, { timeout: 5000 });
  });
});

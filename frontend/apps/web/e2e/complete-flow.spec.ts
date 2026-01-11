import { test, expect } from '@playwright/test';

test.describe('Complete Mentor-Mentee Flow', () => {
  test('complete flow: register -> search mentor -> book session -> review', async ({ page }) => {
    // Step 1: Register as mentee
    await page.goto('/register');
    
    await page.route('**/api/v1/auth/register', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'test-token',
          token_type: 'bearer',
          user: {
            id: 'mentee-1',
            email: 'mentee@test.com',
            full_name: 'Test Mentee',
            role: 'mentee',
          },
        }),
      });
    });

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const nameInput = page.locator('input[name="full_name"], input[name="name"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("Register")').first();

    if (await emailInput.isVisible()) {
      await emailInput.fill('mentee@test.com');
      await passwordInput.fill('password123');
      if (await nameInput.isVisible()) {
        await nameInput.fill('Test Mentee');
      }
      await submitButton.click();
    }

    // Step 2: Search for mentors
    await page.waitForURL(/\/(mentors|sessions)/, { timeout: 5000 });
    
    await page.route('**/api/v1/mentors**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          mentors: [
            {
              id: 'mentor-1',
              bio: 'Experienced web developer',
              hourly_rate: 50.0,
              average_rating: 4.5,
              total_reviews: 10,
              is_available: true,
              expertise_areas: [{ name: 'Web Development' }],
            },
          ],
          total: 1,
          limit: 20,
          offset: 0,
        }),
      });
    });

    await page.goto('/mentors');
    await page.waitForSelector('text=Find a Mentor', { timeout: 5000 });

    // Step 3: View mentor details
    await page.route('**/api/v1/mentors/mentor-1**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'mentor-1',
          bio: 'Experienced web developer',
          hourly_rate: 50.0,
          average_rating: 4.5,
          total_reviews: 10,
          is_available: true,
        }),
      });
    });

    const mentorCard = page.locator('text=Experienced web developer').first();
    if (await mentorCard.isVisible()) {
      await mentorCard.click();
      await page.waitForURL(/\/mentors\/mentor-1/, { timeout: 5000 });
    }

    // Step 4: Book a session
    await page.route('**/api/v1/bookings/mentors/mentor-1/available-slots**', async (route) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          slots: [
            {
              start_time: tomorrow.toISOString(),
              end_time: new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString(),
              duration_minutes: 60,
            },
          ],
        }),
      });
    });

    await page.route('**/api/v1/bookings', async (route) => {
      if (route.request().method() === 'POST') {
        const body = await route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'booking-1',
            mentor_id: 'mentor-1',
            mentee_id: 'mentee-1',
            scheduled_start_time: body.scheduled_start_time,
            scheduled_end_time: new Date(new Date(body.scheduled_start_time).getTime() + body.duration_minutes * 60 * 1000).toISOString(),
            duration_minutes: body.duration_minutes,
            status: 'pending',
          }),
        });
      }
    });

    const bookButton = page.locator('button:has-text("Book a Session")');
    if (await bookButton.isVisible()) {
      await bookButton.click();
      await page.waitForURL(/\/mentors\/mentor-1\/book/, { timeout: 5000 });
      
      // Select time slot
      await page.waitForSelector('button', { timeout: 5000 });
      const slotButton = page.locator('button').filter({ hasText: /AM|PM/ }).first();
      if (await slotButton.isVisible()) {
        await slotButton.click();
        
        const confirmButton = page.locator('button:has-text("Confirm Booking")');
        await confirmButton.click();
        
        await page.waitForURL(/\/bookings\/booking-1\/confirmation/, { timeout: 5000 });
        await expect(page.locator('text=Booking Confirmed!')).toBeVisible();
      }
    }
  });
});

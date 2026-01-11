import { test, expect } from '@playwright/test';

test.describe('Mentor Discovery Flow', () => {
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
            id: 'user-1',
            email: 'test@example.com',
            full_name: 'Test User',
            role: 'mentee',
          },
        }),
      });
    });

    // Mock mentor search API
    await page.route('**/api/v1/mentors**', async (route) => {
      const url = new URL(route.request().url());
      const params = url.searchParams;
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          mentors: [
            {
              id: 'mentor-1',
              bio: 'Experienced mentor in web development',
              hourly_rate: 50.0,
              years_of_experience: 5,
              languages: ['English', 'Vietnamese'],
              profile_image_url: null,
              verification_status: 'verified',
              is_available: true,
              average_rating: 4.5,
              total_reviews: 10,
              total_sessions_completed: 50,
              expertise_areas: [
                {
                  expertise_id: 'exp-1',
                  proficiency_level: 'expert',
                  years_in_expertise: 5,
                  name: 'Web Development',
                },
              ],
            },
            {
              id: 'mentor-2',
              bio: 'Business strategy expert',
              hourly_rate: 75.0,
              years_of_experience: 10,
              languages: ['English'],
              verification_status: 'verified',
              is_available: true,
              average_rating: 4.8,
              total_reviews: 25,
              total_sessions_completed: 100,
              expertise_areas: [
                {
                  expertise_id: 'exp-2',
                  proficiency_level: 'expert',
                  years_in_expertise: 10,
                  name: 'Business Strategy',
                },
              ],
            },
          ],
          total: 2,
          limit: 20,
          offset: 0,
        }),
      });
    });

    // Mock expertise areas API
    await page.route('**/api/v1/expertise**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            expertise_id: 'exp-1',
            name: 'Web Development',
            description: 'Frontend and backend web development',
            category: 'Technology',
          },
          {
            expertise_id: 'exp-2',
            name: 'Business Strategy',
            description: 'Business planning and strategy',
            category: 'Business',
          },
        ]),
      });
    });

    // Mock mentor detail API
    await page.route('**/api/v1/mentors/mentor-1**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'mentor-1',
          bio: 'Experienced mentor in web development',
          hourly_rate: 50.0,
          years_of_experience: 5,
          languages: ['English', 'Vietnamese'],
          verification_status: 'verified',
          is_available: true,
          average_rating: 4.5,
          total_reviews: 10,
          total_sessions_completed: 50,
          expertise_areas: [
            {
              expertise_id: 'exp-1',
              proficiency_level: 'expert',
              years_in_expertise: 5,
              name: 'Web Development',
            },
          ],
        }),
      });
    });

    // Mock reviews API
    await page.route('**/api/v1/mentors/mentor-1/reviews**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reviews: [
            {
              id: 'review-1',
              booking_id: 'booking-1',
              mentor_id: 'mentor-1',
              mentee_id: 'mentee-1',
              rating: 5,
              comment: 'Great mentor! Very helpful.',
              created_at: new Date().toISOString(),
            },
          ],
          total: 1,
          limit: 10,
          offset: 0,
        }),
      });
    });
  });

  test('should display mentor search page', async ({ page }) => {
    await page.goto('/mentors');
    
    await expect(page.locator('h1')).toContainText(/Find a Mentor/i);
    await expect(page.locator('text=Connect with experienced mentors')).toBeVisible();
  });

  test('should display mentor cards', async ({ page }) => {
    await page.goto('/mentors');
    
    // Wait for mentors to load
    await page.waitForSelector('text=Found', { timeout: 5000 });
    
    // Check for mentor cards
    await expect(page.locator('text=Experienced mentor in web development')).toBeVisible();
    await expect(page.locator('text=\\$50.00/hr')).toBeVisible();
    await expect(page.locator('text=4.5')).toBeVisible();
  });

  test('should filter mentors by expertise', async ({ page }) => {
    await page.goto('/mentors');
    
    // Wait for filters to load
    await page.waitForSelector('text=Expertise Areas', { timeout: 5000 });
    
    // Click on Web Development checkbox
    const webDevCheckbox = page.locator('input[type="checkbox"]').first();
    await webDevCheckbox.check();
    
    // Click Apply Filters button
    const applyButton = page.locator('button:has-text("Apply Filters")');
    await applyButton.click();
    
    // Wait for filtered results
    await page.waitForTimeout(1000);
  });

  test('should filter mentors by price range', async ({ page }) => {
    await page.goto('/mentors');
    
    await page.waitForSelector('text=Price Range', { timeout: 5000 });
    
    // Set min price
    const minPriceInput = page.locator('input[id="min-price"]');
    await minPriceInput.fill('40');
    
    // Set max price
    const maxPriceInput = page.locator('input[id="max-price"]');
    await maxPriceInput.fill('60');
    
    // Apply filters
    const applyButton = page.locator('button:has-text("Apply Filters")');
    await applyButton.click();
    
    await page.waitForTimeout(1000);
  });

  test('should navigate to mentor detail page', async ({ page }) => {
    await page.goto('/mentors');
    
    await page.waitForSelector('text=Experienced mentor', { timeout: 5000 });
    
    // Click on first mentor card
    const mentorCard = page.locator('text=Experienced mentor').first();
    await mentorCard.click();
    
    // Should navigate to mentor detail page
    await page.waitForURL(/\/mentors\/mentor-/, { timeout: 5000 });
    await expect(page.locator('h1')).toContainText(/Mentor Profile/i);
  });

  test('should display mentor details', async ({ page }) => {
    await page.goto('/mentors/mentor-1');
    
    await expect(page.locator('text=Mentor Profile')).toBeVisible();
    await expect(page.locator('text=4.5')).toBeVisible();
    await expect(page.locator('text=10 reviews')).toBeVisible();
    await expect(page.locator('text=\\$50.00/hr')).toBeVisible();
    await expect(page.locator('text=Experienced mentor in web development')).toBeVisible();
    await expect(page.locator('text=Web Development')).toBeVisible();
  });

  test('should display reviews on mentor detail page', async ({ page }) => {
    await page.goto('/mentors/mentor-1');
    
    await page.waitForSelector('text=Reviews', { timeout: 5000 });
    await expect(page.locator('text=Great mentor! Very helpful.')).toBeVisible();
  });

  test('should navigate to booking page from mentor detail', async ({ page }) => {
    await page.goto('/mentors/mentor-1');
    
    // Mock available slots API
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

    const bookButton = page.locator('button:has-text("Book a Session")');
    await bookButton.click();
    
    await page.waitForURL(/\/mentors\/mentor-1\/book/, { timeout: 5000 });
    await expect(page.locator('h1')).toContainText(/Book a Session/i);
  });
});

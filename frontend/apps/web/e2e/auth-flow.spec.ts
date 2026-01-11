import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.locator('h1, h2')).toContainText(/Login|Sign in/i);
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
  });

  test('should login successfully', async ({ page }) => {
    // Mock login API
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-token-123',
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

    await page.goto('/login');
    
    // Fill login form
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await emailInput.fill('test@example.com');
    
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    await passwordInput.fill('password123');
    
    // Submit form
    const submitButton = page.locator('button[type="submit"], button:has-text("Login")').first();
    await submitButton.click();
    
    // Should redirect after login
    await page.waitForURL(/\/(mentors|sessions|bookings)/, { timeout: 5000 });
  });

  test('should display register page', async ({ page }) => {
    await page.goto('/register');
    
    await expect(page.locator('h1, h2')).toContainText(/Register|Sign up/i);
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
  });

  test('should register new user', async ({ page }) => {
    // Mock register API
    await page.route('**/api/v1/auth/register', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-token-456',
          token_type: 'bearer',
          user: {
            id: 'user-2',
            email: 'newuser@example.com',
            full_name: 'New User',
            role: 'mentee',
          },
        }),
      });
    });

    await page.goto('/register');
    
    // Fill registration form
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await emailInput.fill('newuser@example.com');
    
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    await passwordInput.fill('password123');
    
    const nameInput = page.locator('input[name="full_name"], input[name="name"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('New User');
    }
    
    // Select role if available
    const roleSelect = page.locator('select[name="role"], input[type="radio"][value="mentee"]').first();
    if (await roleSelect.isVisible()) {
      await roleSelect.click();
    }
    
    // Submit form
    const submitButton = page.locator('button[type="submit"], button:has-text("Register")').first();
    await submitButton.click();
    
    // Should redirect after registration
    await page.waitForURL(/\/(mentors|sessions|bookings)/, { timeout: 5000 });
  });

  test('should handle login error', async ({ page }) => {
    // Mock failed login
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Incorrect email or password',
        }),
      });
    });

    await page.goto('/login');
    
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await emailInput.fill('wrong@example.com');
    
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    await passwordInput.fill('wrongpassword');
    
    const submitButton = page.locator('button[type="submit"], button:has-text("Login")').first();
    await submitButton.click();
    
    // Should show error message
    await expect(page.locator('text=Incorrect email or password, text=error, text=Error')).toBeVisible({ timeout: 3000 });
  });
});

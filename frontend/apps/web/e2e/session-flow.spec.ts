import { test, expect } from '@playwright/test';

test.describe('Session Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API endpoints
    await page.route('/api/v1/sessions/**/join-token', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          join_token: 'mock-join-token',
          session_metadata: {},
          technical_config: {},
          participant_role: 'mentor',
        }),
      });
    });

    await page.route('/api/v1/sessions/**/start', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session_started: true,
          start_timestamp: new Date().toISOString(),
        }),
      });
    });

    await page.route('/api/v1/sessions/**/end', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session_ended: true,
          end_timestamp: new Date().toISOString(),
          session_duration: 3600,
        }),
      });
    });

    await page.route('/api/v1/sessions/**/emergency-terminate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session_terminated: true,
          termination_timestamp: new Date().toISOString(),
          emergency_incident_id: 'incident-123',
        }),
      });
    });

    await page.route('/api/v1/sessions/**/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'started',
          participants: [
            { id: 'user-1', display_name: 'You', role: 'Mentorship Provider' },
            { id: 'user-2', display_name: 'Alex Chen', role: 'Patient' },
          ],
        }),
      });
    });

    // Navigate to the app
    await page.goto('/');
  });

  test('should display session list page', async ({ page }) => {
    // Check if we're on the sessions page
    await expect(page.locator('h1')).toContainText(/Session/i);
  });

  test('should navigate to session pre-start page', async ({ page }) => {
    // This test assumes there's a way to navigate to a session
    // Adjust based on your actual routing
    const sessionLink = page.locator('text=/session/i').first();
    if (await sessionLink.isVisible()) {
      await sessionLink.click();
      // Wait for navigation
      await page.waitForURL(/prestart|session/i);
    }
  });

  test('should show session pre-start page elements', async ({ page }) => {
    // Navigate directly to pre-start page if route exists
    await page.goto('/sessions/test-session-id/prestart');
    
    // Check for key elements
    await expect(page.locator('text=Lifely')).toBeVisible();
    await expect(page.locator('text=Mentorship Session')).toBeVisible();
    await expect(page.locator('text=Start Session')).toBeVisible();
    await expect(page.locator('text=Participants')).toBeVisible();
  });

  test('should show starting modal when start session is clicked', async ({ page }) => {
    await page.goto('/sessions/test-session-id/prestart');
    
    // Wait for page to load
    await page.waitForSelector('text=Start Session');
    
    const startButton = page.locator('button:has-text("Start Session")');
    
    if (await startButton.isEnabled()) {
      await startButton.click();
      
      // Check for modal
      await expect(page.locator('text=Starting Session')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Validating participants')).toBeVisible();
    }
  });

  test('should display active session page elements', async ({ page }) => {
    // Navigate to active session page
    await page.goto('/sessions/test-session-id/active');
    
    // Wait for page to load (may have loading state)
    await page.waitForLoadState('networkidle');
    
    // Check for header elements
    await expect(page.locator('text=Lifely')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=SessionTimer')).toBeVisible();
    
    // Check for control buttons
    await expect(page.locator('button:has-text("Mute")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Video")')).toBeVisible();
    await expect(page.locator('button:has-text("End Session")')).toBeVisible();
  });

  test('should show AI Insights panel', async ({ page }) => {
    await page.goto('/sessions/test-session-id/active');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for AI Insights
    await expect(page.locator('text=AI Insights')).toBeVisible({ timeout: 10000 });
  });

  test('should toggle mute button', async ({ page }) => {
    await page.goto('/sessions/test-session-id/active');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    const muteButton = page.locator('button:has-text("Mute")');
    await expect(muteButton).toBeVisible({ timeout: 10000 });
    
    await muteButton.click();
    // Button should still be visible after click
    await expect(muteButton).toBeVisible();
  });

  test('should display emergency terminate button', async ({ page }) => {
    await page.goto('/sessions/test-session-id/active');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    const emergencyButton = page.locator('button:has-text("Emergency Terminate")');
    await expect(emergencyButton).toBeVisible({ timeout: 10000 });
  });

  test('should handle end session with confirmation', async ({ page }) => {
    await page.goto('/sessions/test-session-id/active');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Setup dialog handler
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('end the session');
      await dialog.accept();
    });
    
    const endButton = page.locator('button:has-text("End Session")');
    await expect(endButton).toBeVisible({ timeout: 10000 });
    await endButton.click();
    
    // Should navigate away after ending
    await page.waitForURL(/\/sessions/, { timeout: 5000 });
  });

  test('should handle emergency terminate with confirmation', async ({ page }) => {
    await page.goto('/sessions/test-session-id/active');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Setup dialog handler
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Emergency termination');
      await dialog.accept();
    });
    
    const emergencyButton = page.locator('button:has-text("Emergency Terminate")');
    await expect(emergencyButton).toBeVisible({ timeout: 10000 });
    await emergencyButton.click();
    
    // Should navigate away after emergency terminate
    await page.waitForURL(/\/sessions/, { timeout: 5000 });
  });
});

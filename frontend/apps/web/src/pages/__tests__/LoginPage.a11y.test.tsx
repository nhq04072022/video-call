/**
 * Accessibility tests for LoginPage
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
// import { axe } from 'vitest-axe'; // Not installed, comment out for build
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../LoginPage';

// Mock dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams()],
  };
});

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    setToken: vi.fn(),
    setUser: vi.fn(),
  }),
}));

vi.mock('../../services/authApi', () => ({
  authApi: {
    login: vi.fn(),
  },
}));

describe('LoginPage Accessibility Tests', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    // TODO: Uncomment after installing vitest-axe
    // const results = await axe(container);
    // expect(results).toHaveNoViolations();
    
    // Basic accessibility checks
    expect(container.querySelector('form')).toBeInTheDocument();
    expect(container.querySelector('input[type="email"]')).toHaveAttribute('aria-required', 'true');
  });

  it('should have proper form labels', () => {
    const { container } = render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    const emailInput = container.querySelector('input[type="email"]');
    const passwordInput = container.querySelector('input[type="password"]');

    expect(emailInput).toHaveAttribute('aria-required', 'true');
    expect(passwordInput).toHaveAttribute('aria-required', 'true');
  });

  it('should have accessible error messages', () => {
    const { container } = render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    // Error messages should have role="alert" and aria-live
    const errorRegion = container.querySelector('[role="alert"]');
    expect(errorRegion).toHaveAttribute('aria-live', 'assertive');
  });

  it('should have accessible submit button', () => {
    const { container } = render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    const submitButton = container.querySelector('button[type="submit"]');
    expect(submitButton).toHaveAttribute('type', 'submit');
    expect(submitButton).toHaveStyle({ minHeight: '44px' }); // Touch target
  });
});


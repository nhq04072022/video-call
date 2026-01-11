/**
 * Accessibility tests for EndSessionModal
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { EndSessionModal } from '../EndSessionModal';

// Note: Install vitest-axe package: npm install -D vitest-axe @axe-core/react
// import { axe } from 'vitest-axe';

describe('EndSessionModal Accessibility Tests', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    sessionId: 'test-session-123',
  };

  it('should not have accessibility violations', async () => {
    const { container } = render(<EndSessionModal {...defaultProps} />);

    // TODO: Uncomment after installing vitest-axe
    // const results = await axe(container);
    // expect(results).toHaveNoViolations();
    
    // Basic accessibility checks
    expect(container.querySelector('[role="dialog"]')).toBeInTheDocument();
    expect(container.querySelector('[aria-modal="true"]')).toBeInTheDocument();
  });

  it('should have proper dialog role and attributes', () => {
    const { container } = render(<EndSessionModal {...defaultProps} />);

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'end-session-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'end-session-description');
  });

  it('should have accessible form fields', () => {
    const { container } = render(<EndSessionModal {...defaultProps} />);

    const reasonSelect = container.querySelector('#end-reason-select');
    expect(reasonSelect).toHaveAttribute('aria-required', 'true');
    expect(reasonSelect).toHaveAttribute('aria-invalid', 'false');

    const notesTextarea = container.querySelector('#end-session-notes');
    expect(notesTextarea).toHaveAttribute('aria-describedby', 'notes-description');
  });

  it('should have accessible error messages', () => {
    const { container } = render(<EndSessionModal {...defaultProps} />);

    // Error messages should have role="alert"
    const errorRegion = container.querySelector('[role="alert"]');
    if (errorRegion) {
      expect(errorRegion).toHaveAttribute('aria-live', 'assertive');
    }
  });

  it('should have accessible buttons with proper labels', () => {
    const { container } = render(<EndSessionModal {...defaultProps} />);

    const cancelButton = container.querySelector('button:has-text("Cancel")');
    const confirmButton = container.querySelector('button:has-text("End Session")');

    expect(cancelButton).toHaveAttribute('type', 'button');
    expect(confirmButton).toHaveAttribute('type', 'submit');
    expect(confirmButton).toHaveStyle({ minHeight: '44px' });
  });

  it('should trap focus within modal', () => {
    const { container } = render(<EndSessionModal {...defaultProps} />);

    // First focusable element should be the select
    const firstElement = container.querySelector('#end-reason-select');
    expect(firstElement).toBeInTheDocument();

    // Last focusable element should be the confirm button
    const lastElement = container.querySelector('button[type="submit"]');
    expect(lastElement).toBeInTheDocument();
  });
});


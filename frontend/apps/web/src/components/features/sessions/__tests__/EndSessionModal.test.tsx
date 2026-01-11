/**
 * Integration tests for EndSessionModal
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EndSessionModal } from '../EndSessionModal';

describe('EndSessionModal Integration Tests', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnConfirm.mockResolvedValue(undefined);
  });

  it('should render modal when open', () => {
    render(
      <EndSessionModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        sessionId="test-session-123"
      />
    );

    expect(screen.getByText(/end session/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end reason/i)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <EndSessionModal
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        sessionId="test-session-123"
      />
    );

    expect(screen.queryByText(/end session/i)).not.toBeInTheDocument();
  });

  it('should require end reason before submitting', async () => {
    const user = userEvent.setup();
    render(
      <EndSessionModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        sessionId="test-session-123"
      />
    );

    // Try to submit without selecting reason
    const confirmButton = screen.getByRole('button', { name: /end session/i });
    expect(confirmButton).toBeDisabled();

    // Select a reason
    const reasonSelect = screen.getByLabelText(/end reason/i);
    await user.selectOptions(reasonSelect, 'normal_completion');

    // Button should now be enabled
    await waitFor(() => {
      expect(confirmButton).not.toBeDisabled();
    });
  });

  it('should submit form with end reason and notes', async () => {
    const user = userEvent.setup();
    render(
      <EndSessionModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        sessionId="test-session-123"
      />
    );

    // Select end reason
    const reasonSelect = screen.getByLabelText(/end reason/i);
    await user.selectOptions(reasonSelect, 'normal_completion');

    // Add notes
    const notesTextarea = screen.getByLabelText(/additional notes/i);
    await user.type(notesTextarea, 'Session completed successfully');

    // Submit
    const confirmButton = screen.getByRole('button', { name: /end session/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith('normal_completion', 'Session completed successfully');
    });
  });

  it('should close modal when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(
      <EndSessionModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        sessionId="test-session-123"
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('should close modal when Escape key is pressed', async () => {
    const user = userEvent.setup();
    render(
      <EndSessionModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        sessionId="test-session-123"
      />
    );

    await user.keyboard('{Escape}');

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should show error message when submit fails', async () => {
    const user = userEvent.setup();
    const error = new Error('Failed to end session');
    mockOnConfirm.mockRejectedValue(error);

    render(
      <EndSessionModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        sessionId="test-session-123"
      />
    );

    // Select reason and submit
    const reasonSelect = screen.getByLabelText(/end reason/i);
    await user.selectOptions(reasonSelect, 'normal_completion');

    const confirmButton = screen.getByRole('button', { name: /end session/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to end session/i)).toBeInTheDocument();
    });
  });

  it('should validate notes character limit', async () => {
    const user = userEvent.setup();
    render(
      <EndSessionModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        sessionId="test-session-123"
      />
    );

    const notesTextarea = screen.getByLabelText(/additional notes/i);
    const longText = 'a'.repeat(501); // Exceeds 500 character limit

    await user.type(notesTextarea, longText);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/notes must be less than 500 characters/i)).toBeInTheDocument();
    });
  });

  it('should trap focus within modal', async () => {
    const user = userEvent.setup();
    render(
      <EndSessionModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        sessionId="test-session-123"
      />
    );

    // Focus should start on first element (select)
    const reasonSelect = screen.getByLabelText(/end reason/i);
    expect(reasonSelect).toHaveFocus();

    // Tab through elements
    await user.tab();
    const notesTextarea = screen.getByLabelText(/additional notes/i);
    expect(notesTextarea).toHaveFocus();

    await user.tab();
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toHaveFocus();

    await user.tab();
    const confirmButton = screen.getByRole('button', { name: /end session/i });
    expect(confirmButton).toHaveFocus();

    // Tab again should cycle back to first element
    await user.tab();
    expect(reasonSelect).toHaveFocus();
  });
});


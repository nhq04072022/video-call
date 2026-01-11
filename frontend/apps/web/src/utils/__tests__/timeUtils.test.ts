/**
 * Unit tests for time utility functions
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatTime,
  formatDuration,
  formatTimestamp,
  formatTimeFromMs,
  formatRelativeTime,
} from '../timeUtils';

describe('timeUtils', () => {
  describe('formatTime', () => {
    it('should format seconds to MM:SS when less than 1 hour', () => {
      expect(formatTime(0)).toBe('00:00');
      expect(formatTime(30)).toBe('00:30');
      expect(formatTime(125)).toBe('02:05');
      expect(formatTime(3599)).toBe('59:59');
    });

    it('should format seconds to HH:MM:SS when 1 hour or more', () => {
      expect(formatTime(3600)).toBe('1:00:00');
      expect(formatTime(3661)).toBe('1:01:01');
      expect(formatTime(7323)).toBe('2:02:03');
    });

    it('should handle edge cases', () => {
      expect(formatTime(-1)).toBe('-1:00:00');
      expect(formatTime(86400)).toBe('24:00:00'); // 24 hours
    });
  });

  describe('formatDuration', () => {
    it('should format seconds to human-readable format', () => {
      expect(formatDuration(0)).toBe('0s');
      expect(formatDuration(30)).toBe('30s');
      expect(formatDuration(60)).toBe('1m 0s');
      expect(formatDuration(125)).toBe('2m 5s');
      expect(formatDuration(3600)).toBe('1h 0m 0s');
      expect(formatDuration(3661)).toBe('1h 1m 1s');
    });

    it('should handle edge cases', () => {
      expect(formatDuration(-1)).toBe('-1s');
      expect(formatDuration(86400)).toBe('24h 0m 0s'); // 24 hours
    });
  });

  describe('formatTimestamp', () => {
    beforeEach(() => {
      // Mock Date.now() for consistent testing
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T10:30:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should format ISO timestamp string', () => {
      const timestamp = '2024-01-15T10:30:00Z';
      const formatted = formatTimestamp(timestamp);
      expect(formatted).toContain('Monday');
      expect(formatted).toContain('January');
      expect(formatted).toContain('2024');
    });

    it('should format numeric timestamp', () => {
      const timestamp = 1705315800000; // Jan 15, 2024
      const formatted = formatTimestamp(timestamp);
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });
  });

  describe('formatTimeFromMs', () => {
    it('should format milliseconds to MM:SS', () => {
      expect(formatTimeFromMs(0)).toBe('0:00');
      expect(formatTimeFromMs(30000)).toBe('0:30');
      expect(formatTimeFromMs(125000)).toBe('2:05');
      expect(formatTimeFromMs(3600000)).toBe('60:00');
    });

    it('should handle edge cases', () => {
      expect(formatTimeFromMs(-1000)).toBe('-1:00');
      expect(formatTimeFromMs(59999)).toBe('0:59');
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T10:30:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should format seconds ago', () => {
      const timestamp = Date.now() - 5000; // 5 seconds ago
      expect(formatRelativeTime(timestamp)).toBe('5s ago');
    });

    it('should format minutes ago', () => {
      const timestamp = Date.now() - 120000; // 2 minutes ago
      expect(formatRelativeTime(timestamp)).toBe('2m ago');
    });

    it('should format hours ago', () => {
      const timestamp = Date.now() - 7200000; // 2 hours ago
      expect(formatRelativeTime(timestamp)).toBe('2h ago');
    });

    it('should handle edge cases', () => {
      const timestamp = Date.now() - 100; // 0.1 seconds ago
      expect(formatRelativeTime(timestamp)).toBe('0s ago');
    });
  });
});


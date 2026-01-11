/**
 * Accessibility testing setup for Vitest
 */
import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { toHaveNoViolations } from 'vitest-axe';

// Extend Vitest expect with jest-dom matchers
expect.extend(matchers);

// Extend Vitest expect with vitest-axe matchers
expect.extend(toHaveNoViolations);


# Testing Guide

This project uses **Vitest** for unit/component tests and **Playwright** for E2E automation tests.

## Setup

First, install the dependencies:

```bash
cd AI_docs/frontend/apps/web
npm install
```

## Running the Development Server

To start the development server and view the app in the browser:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Running Tests

### Unit/Component Tests (Vitest)

Run all unit tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm test -- --watch
```

Run tests with UI:
```bash
npm run test:ui
```

Run tests with coverage:
```bash
npm run test:coverage
```

### E2E Automation Tests (Playwright)

Run all E2E tests:
```bash
npm run test:e2e
```

Run E2E tests with UI:
```bash
npm run test:e2e:ui
```

Run E2E tests in headed mode (see browser):
```bash
npm run test:e2e:headed
```

## Test Structure

- **Unit Tests**: `src/**/__tests__/*.test.tsx`
- **E2E Tests**: `e2e/*.spec.ts`

## Current Test Coverage

### Unit Tests
- `SessionPreStartPage.test.tsx` - Tests for pre-start session page
- `VideoControls.test.tsx` - Tests for video control buttons

### E2E Tests
- `session-flow.spec.ts` - End-to-end tests for session management flow

## Notes

- The E2E tests will automatically start the dev server if it's not running
- Make sure the backend API is running on `http://localhost:8000` for full functionality
- Some tests may need adjustment based on your actual routing and API responses

# Repository Structure

## AI_docs/
- file_structure.md

## frontend/
- apps/
  - web/
    - app/ (Next.js App Router)
      - layout.tsx
      - page.tsx
      - login/page.tsx
      - register/page.tsx
      - meeting/page.tsx
      - globals.css
    - components/
      - meeting/ (ActiveSession, ChatPanel, PreSessionCheck, WaitingRoom)
      - ui/ (Button, Card, Input)
    - contexts/
      - LiveKitContext.tsx
    - e2e/ (Playwright tests)
    - hooks/
      - useSession.ts
    - shared/
      - types/
      - utils/
    - src/ (Vite React app)
      - components/
        - auth/
        - features/
        - layout/
        - ui/
      - config/
      - data/
      - hooks/
      - mocks/
      - pages/
      - services/
      - stores/
      - test/
      - types/
      - utils/
      - App.tsx
      - main.tsx
    - package.json
    - vite.config.ts
    - next.config.js
    - tsconfig.json
    - README.md
    - TESTING.md

## services/
- api-service/
  - src/
    - db/
      - index.ts
      - schema.sql
      - migrations/
    - middleware/
      - auth.ts
    - routes/ (auth, availability, bookings, calendar, expertise, mentors, notifications, reviews, sessions, users)
    - services/ (emailService, jobScheduler, notificationService)
    - types/
      - index.ts
    - index.ts
  - package.json
  - tsconfig.json
  - README.md
  - SETUP_DATABASE.md
  - SETUP_LIVEKIT.md

## Root
- .gitignore
- README.md
- DEPLOYMENT_GUIDE.md

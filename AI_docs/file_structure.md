# Project Structure

## Root Directory
```
Video_call/
├── AI_docs/                    # Documentation only
│   ├── file_structure.md
│   └── [task files and specs]
├── services/                   # Backend microservices
│   └── api-service/            # Main API service
│       ├── src/
│       │   ├── index.ts
│       │   ├── db/
│       │   │   ├── index.ts
│       │   │   └── schema.sql
│       │   ├── routes/
│       │   │   ├── auth.ts
│       │   │   └── sessions.ts
│       │   ├── middleware/
│       │   │   └── auth.ts
│       │   └── types/
│       │       └── index.ts
│       ├── package.json
│       ├── tsconfig.json
│       ├── .eslintrc.json
│       └── .prettierrc
├── frontend/                   # Frontend application
│   └── apps/
│       └── web/               # Main web app (Vite + React)
│           ├── src/
│           │   ├── App.tsx
│           │   ├── main.tsx
│           │   ├── index.css
│           │   ├── components/
│           │   │   ├── auth/
│           │   │   │   └── ProtectedRoute.tsx
│           │   │   ├── features/
│           │   │   │   ├── mentors/
│           │   │   │   │   ├── MentorCard.tsx
│           │   │   │   │   └── MentorFilters.tsx
│           │   │   │   ├── profile/
│           │   │   │   │   ├── AvatarUpload.tsx
│           │   │   │   │   ├── ChangePassword.tsx
│           │   │   │   │   ├── SkillsSelector.tsx
│           │   │   │   │   └── index.ts
│           │   │   │   ├── reviews/
│           │   │   │   │   ├── ReviewCard.tsx
│           │   │   │   │   └── StarRating.tsx
│           │   │   │   └── sessions/
│           │   │   │       ├── AccessibilityHelpers.tsx
│           │   │   │       ├── AIPanelSidebar.tsx
│           │   │   │       ├── DeviceTesting.tsx
│           │   │   │       ├── EndSessionModal.tsx
│           │   │   │       ├── index.ts
│           │   │   │       ├── NetworkQualityBadge.tsx
│           │   │   │       ├── ParticipantTile.tsx
│           │   │   │       ├── SessionCard.tsx
│           │   │   │       ├── SessionForm.tsx
│           │   │   │       ├── SessionStartingModal.tsx
│           │   │   │       ├── VideoControls.tsx
│           │   │   │       ├── VideoGrid.tsx
│           │   │   │       └── VideoTrack.tsx
│           │   │   ├── layout/
│           │   │   │   ├── AuthLayout.tsx
│           │   │   │   └── MainLayout.tsx
│           │   │   └── ui/
│           │   │       ├── Button.tsx
│           │   │       ├── Input.tsx
│           │   │       └── Textarea.tsx
│           │   ├── pages/
│           │   │   ├── BookingConfirmationPage.tsx
│           │   │   ├── BookingDetailPage.tsx
│           │   │   ├── BookingListPage.tsx
│           │   │   ├── BookingPage.tsx
│           │   │   ├── DashboardPage.tsx
│           │   │   ├── HomePage.tsx
│           │   │   ├── JoinSessionPage.tsx
│           │   │   ├── LoginPage.tsx
│           │   │   ├── ManageSessionsPage.tsx
│           │   │   ├── MenteeProfileEditPage.tsx
│           │   │   ├── MentorDetailPage.tsx
│           │   │   ├── MentorProfileEditPage.tsx
│           │   │   ├── MentorSearchPage.tsx
│           │   │   ├── RegisterPage.tsx
│           │   │   ├── ReviewPage.tsx
│           │   │   ├── SessionActivePage.tsx
│           │   │   ├── SessionApplyPage.tsx
│           │   │   ├── SessionCreatePage.tsx
│           │   │   ├── SessionDetailPage.tsx
│           │   │   ├── SessionJoinPage.tsx
│           │   │   ├── SessionListPage.tsx
│           │   │   ├── SessionPreStartPage.tsx
│           │   │   ├── SessionSharePage.tsx
│           │   │   ├── SessionSummaryPage.tsx
│           │   │   ├── SessionWaitingPage.tsx
│           │   │   ├── SettingsPage.tsx
│           │   │   ├── UserProfileEditPage.tsx
│           │   │   └── UserProfilePage.tsx
│           │   ├── services/
│           │   │   ├── api.ts
│           │   │   ├── authApi.ts
│           │   │   ├── bookingApi.ts
│           │   │   ├── mentorApi.ts
│           │   │   ├── reviewApi.ts
│           │   │   └── userApi.ts
│           │   ├── stores/
│           │   │   ├── authStore.ts
│           │   │   └── sessionStore.ts
│           │   ├── hooks/
│           │   │   ├── useAuth.ts
│           │   │   ├── useBookings.ts
│           │   │   ├── useLiveKit.ts
│           │   │   ├── useMentors.ts
│           │   │   └── useSessionStatus.ts
│           │   ├── types/
│           │   │   ├── api.ts
│           │   │   ├── booking.ts
│           │   │   ├── mentor.ts
│           │   │   ├── review.ts
│           │   │   ├── session.ts
│           │   │   └── user.ts
│           │   ├── utils/
│           │   │   ├── timeUtils.ts
│           │   │   └── validationUtils.ts
│           │   ├── config/
│           │   │   └── session.ts
│           │   ├── data/
│           │   │   └── mockAIInsights.ts
│           │   ├── mocks/
│           │   │   ├── browser.ts
│           │   │   ├── handlers.ts
│           │   │   └── storage/
│           │   └── test/
│           │       ├── a11y-setup.ts
│           │       ├── api-mocks.ts
│           │       ├── livekit-mocks.ts
│           │       └── setup.ts
│           ├── e2e/
│           │   ├── auth-flow.spec.ts
│           │   ├── booking-flow.spec.ts
│           │   ├── complete-flow.spec.ts
│           │   ├── mentor-discovery.spec.ts
│           │   └── session-flow.spec.ts
│           ├── public/
│           │   └── mockServiceWorker.js
│           ├── index.html
│           ├── package.json
│           ├── tsconfig.json
│           ├── tsconfig.node.json
│           ├── vite.config.ts
│           ├── vitest.config.ts
│           ├── playwright.config.ts
│           ├── tailwind.config.js
│           ├── postcss.config.js
│           └── TESTING.md
└── .gitignore
```


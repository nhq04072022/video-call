# Frontend-Backend Connection Verification

## ✅ API Endpoints Mapping

### Authentication
| Frontend | Backend | Status |
|----------|---------|--------|
| `authApi.register()` | `POST /api/auth/register` | ✅ Match |
| `authApi.login()` | `POST /api/auth/login` | ✅ Match |

### Sessions
| Frontend | Backend | Status |
|----------|---------|--------|
| `sessionApi.createSession()` | `POST /api/sessions/create` | ✅ Match |
| `sessionApi.getSessionDetail()` | `GET /api/sessions/:sessionId` | ✅ Match |
| `sessionApi.listSessions()` | `GET /api/sessions` | ✅ Match |
| `sessionApi.getJoinToken()` | `GET /api/sessions/join-token` | ✅ Match |
| `sessionApi.startSession()` | `POST /api/sessions/start` | ✅ Match |
| `sessionApi.endSession()` | `POST /api/sessions/end` | ✅ Match |
| `sessionApi.getSessionStatus()` | `GET /api/sessions/status` | ✅ Match |

## ✅ Configuration

### Backend
- Port: 3001
- CORS: Enabled
- Routes: `/api/auth`, `/api/sessions`
- Health Check: `/health`

### Frontend
- Port: 5173
- Vite Proxy: `/api` → `http://localhost:3001`
- Base URL: `http://localhost:3001` (all API services)

### LiveKit
- Port: 7880 (WebSocket)
- Port: 7881 (HTTP)
- Port: 7882 (UDP)

## ✅ Request/Response Mapping

### Create Session
- Frontend sends: `{ mentor_id, mentee_id, mentee_goal, mentee_questions, scheduled_time }`
- Backend expects: ✅ Match
- Backend returns: `{ id, mentor_id, mentee_id, status, livekit_room_name, ... }`
- Frontend maps to: ✅ Correct

### Start Session
- Frontend sends: `{ sessionId }` in body
- Backend expects: `sessionId` in body or query ✅
- Backend updates: DB (status=ACTIVE, start_time) ✅

### End Session
- Frontend sends: `{ sessionId }` in body
- Backend expects: `sessionId` in body or query ✅
- Backend updates: DB (status=ENDED, end_time, duration_minutes) ✅

## ✅ Authentication Flow

1. Login → Backend returns `{ token, user }`
2. Frontend stores `access_token` in authStore
3. API interceptor adds `Authorization: Bearer {token}` ✅
4. Backend middleware verifies token ✅

## ✅ All Connections Verified



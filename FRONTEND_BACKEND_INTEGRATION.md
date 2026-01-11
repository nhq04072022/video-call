# Frontend-Backend Integration Guide

## Tổng quan
Frontend mới đã được tích hợp với backend hiện tại. Tài liệu này mô tả cách chúng hoạt động cùng nhau.

## API Endpoints Mapping

### 1. Authentication (`/api/auth`)

**Backend Endpoints:**
- `POST /api/auth/register` - Đăng ký user mới
- `POST /api/auth/login` - Đăng nhập

**Backend Response Format:**
```json
{
  "token": "jwt-token-string",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "full_name": "User Name",
    "role": "MENTOR" | "MENTEE"
  }
}
```

**Frontend Mapping:**
- File: `frontend/apps/web/src/services/authApi.ts`
- Converts `token` → `access_token`
- Converts `MENTOR`/`MENTEE` → `mentor`/`mentee`
- Stores token in `authStore` via `setToken(response.access_token)`

### 2. Sessions (`/api/sessions`)

**Backend Endpoints:**
- `GET /api/sessions/join-token` - Lấy LiveKit join token
- `POST /api/sessions/start` - Bắt đầu session (Mentor only)
- `POST /api/sessions/end` - Kết thúc session
- `GET /api/sessions/status` - Lấy trạng thái session

**Backend Response Format cho `/join-token`:**
```json
{
  "token": "livekit-jwt-token",
  "url": "ws://localhost:7880",
  "roomName": "main-meeting-room"
}
```

**Frontend Mapping:**
- File: `frontend/apps/web/src/services/api.ts`
- Converts backend response to frontend format:
  ```typescript
  {
    join_token: response.data.token,
    session_metadata: {
      room_name: response.data.roomName,
      room_id: response.data.roomName,
      url: response.data.url,
    },
    technical_config: {
      livekit_url: response.data.url,
      url: response.data.url,
      room_id: response.data.roomName,
      room_name: response.data.roomName,
    },
    participant_role: 'mentor',
    session_features: {},
    emergency_controls: {},
  }
  ```

## Authentication Flow

1. **Login:**
   - User submits login form → `authApi.login(email, password)`
   - Backend returns `{ token, user }`
   - Frontend converts to `{ access_token, user }`
   - Stores in `authStore` via `setToken()` and `setUser()`

2. **API Calls:**
   - All API calls use `apiClient` (axios instance)
   - Token được tự động thêm vào header: `Authorization: Bearer {token}`
   - Interceptor trong `api.ts` lấy token từ `authStore.getState().token`

3. **Token Storage:**
   - Token được lưu trong `localStorage` qua Zustand persist middleware
   - Key: `auth-storage`

## LiveKit Integration

1. **Get Join Token:**
   - Frontend gọi `sessionApi.getJoinToken()`
   - Backend trả về `{ token, url, roomName }`
   - Frontend map sang format mà `useLiveKit` hook cần

2. **Connection:**
   - `useLiveKit` hook sử dụng token và URL từ API response
   - Connects to LiveKit server tại URL từ backend
   - Room name được lấy từ `technical_config.room_id` hoặc `session_metadata.room_name`

## Configuration

### Backend Environment Variables:
```env
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=devsecret
JWT_SECRET=your-jwt-secret
DATABASE_URL=postgresql://...
```

### Frontend Environment Variables:
```env
VITE_API_URL=http://localhost:3001
VITE_LIVEKIT_URL=ws://localhost:7880  # Fallback nếu API không trả về URL
```

## Error Handling

- **401 Unauthorized:** Auto logout và redirect về login
- **500 Server Error:** Hiển thị error message phù hợp
- **Network Errors:** Retry logic và user-friendly messages

## Files Modified

1. `frontend/apps/web/src/services/api.ts` - API client và session APIs
2. `frontend/apps/web/src/services/authApi.ts` - Authentication APIs
3. `frontend/apps/web/src/hooks/useLiveKit.ts` - LiveKit integration
4. `frontend/apps/web/src/stores/authStore.ts` - Token storage

## Testing

Để test integration:
1. Start backend: `cd services/api-service && npm run dev`
2. Start frontend: `cd frontend/apps/web && npm run dev`
3. Start LiveKit: `docker run -d --name livekit-server -p 7880:7880 -p 7881:7881 -p 7882:7882/udp -e LIVEKIT_KEYS="devkey: devsecret" livekit/livekit-server --dev`
4. Login với user đã đăng ký
5. Navigate to session page và test LiveKit connection




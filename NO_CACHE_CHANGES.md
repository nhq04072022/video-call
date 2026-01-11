# No Cache - All Data in Database Changes

## Tóm Tắt Thay Đổi

Đã thực hiện các thay đổi để **loại bỏ cache** và **lưu tất cả thông tin vào database**.

## 1. Database Schema

### Tạo Table `session_participants`

Thêm table mới để track participants trong session:

```sql
CREATE TABLE session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMP DEFAULT NOW() NOT NULL,
    left_at TIMESTAMP,
    connection_count INTEGER DEFAULT 1 NOT NULL, -- Track reconnection attempts
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(session_id, user_id, joined_at)
);

-- Indexes
CREATE INDEX idx_session_participants_session_id ON session_participants(session_id);
CREATE INDEX idx_session_participants_user_id ON session_participants(user_id);
CREATE INDEX idx_session_participants_joined_at ON session_participants(joined_at);
```

**File thay đổi:** `services/api-service/src/db/schema.sql`

**Cách áp dụng:**
```sql
-- Chạy SQL trong PostgreSQL
-- Hoặc chạy file schema.sql mới
```

## 2. Backend API Changes

### 2.1. Session Routes - Participant Tracking

**File:** `services/api-service/src/routes/sessions.ts`

#### Join Token - Log Participant Join
- Khi user request join token, tự động log participant join vào DB
- Track reconnection attempts (tăng `connection_count` nếu đã join trước đó)

#### New Endpoints:
1. **POST `/api/sessions/:sessionId/leave`**
   - Log participant leave event vào DB
   - Mark `left_at = NOW()` trong `session_participants`

2. **GET `/api/sessions/:sessionId/participants`**
   - Lấy danh sách participants hiện tại từ DB (không cache)
   - Return: `{ session_id, participants: [], total: number }`

#### End Session - Mark All Participants as Left
- Khi session end, tự động mark tất cả participants là `left_at = NOW()`

### 2.2. Authentication - httpOnly Cookies

**File:** `services/api-service/src/routes/auth.ts`

- **Login/Register:** Set httpOnly cookie `auth_token` thay vì chỉ return token trong body
- Vẫn return token trong body để backward compatibility
- Cookie options:
  - `httpOnly: true` (không thể access từ JavaScript)
  - `secure: true` (production - HTTPS only)
  - `sameSite: 'strict'`
  - `maxAge: 7 days` (matches JWT expiration)

**File:** `services/api-service/src/middleware/auth.ts`

- Update `authenticateToken` middleware để đọc token từ:
  1. Cookie `auth_token` (ưu tiên - httpOnly)
  2. Authorization header `Bearer TOKEN` (fallback - backward compatibility)

**File:** `services/api-service/src/index.ts`

- Thêm `cookie-parser` middleware
- Update CORS để allow credentials (cookies)

**Package cần install:**
```bash
cd services/api-service
npm install cookie-parser @types/cookie-parser
```

## 3. Frontend Changes

### 3.1. API Client - Participant Leave Logging

**File:** `frontend/apps/web/src/services/api.ts`

Thêm 2 functions mới:

1. **`logParticipantLeave(sessionId: string)`**
   - Gọi `POST /api/sessions/:sessionId/leave` để log participant leave vào DB

2. **`getSessionParticipants(sessionId: string)`**
   - Gọi `GET /api/sessions/:sessionId/participants` để lấy participants từ DB

### 3.2. useLiveKit Hook - Auto Log Leave

**File:** `frontend/apps/web/src/hooks/useLiveKit.ts`

- Update `disconnect()` function để tự động gọi `logParticipantLeave()` trước khi disconnect
- Log participant leave vào DB (không cache)

### 3.3. localStorage Usage

**Note:** Frontend vẫn đang dùng `localStorage` cho token trong một số file:
- `frontend/apps/web/app/login/page.tsx`
- `frontend/apps/web/app/register/page.tsx`
- `frontend/apps/web/app/meeting/page.tsx`
- `frontend/apps/web/shared/utils/api.ts`

**Khuyến nghị:**
- Backend đã set httpOnly cookie, frontend có thể bỏ `localStorage.setItem('token', ...)`
- Frontend chỉ cần đọc user info từ response, không cần lưu token
- Token sẽ tự động được gửi qua cookie trong mọi request

## 4. Database Migration

### Cách áp dụng thay đổi:

1. **Connect to PostgreSQL:**
```bash
psql -U postgres -d video_call_db
```

2. **Run migration SQL:**
```sql
-- Copy nội dung từ services/api-service/src/db/schema.sql
-- Hoặc chạy trực tiếp:
CREATE TABLE session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMP DEFAULT NOW() NOT NULL,
    left_at TIMESTAMP,
    connection_count INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(session_id, user_id, joined_at)
);

CREATE INDEX idx_session_participants_session_id ON session_participants(session_id);
CREATE INDEX idx_session_participants_user_id ON session_participants(user_id);
CREATE INDEX idx_session_participants_joined_at ON session_participants(joined_at);
```

## 5. Testing Checklist

- [ ] Install cookie-parser package: `cd services/api-service && npm install cookie-parser @types/cookie-parser`
- [ ] Run database migration để tạo table `session_participants`
- [ ] Test login/register - verify httpOnly cookie được set
- [ ] Test join session - verify participant được log vào DB
- [ ] Test leave session - verify `left_at` được set trong DB
- [ ] Test end session - verify tất cả participants được mark as left
- [ ] Test get participants - verify lấy từ DB (không cache)
- [ ] Test reconnection - verify `connection_count` tăng

## 6. Summary

### Đã loại bỏ:
- ✅ Memory cache trong backend (không có)
- ✅ localStorage cho token (chuyển sang httpOnly cookie)
- ✅ Cache participant list (lấy từ DB)

### Đã thêm:
- ✅ Table `session_participants` để track participants
- ✅ API endpoints để log join/leave events
- ✅ httpOnly cookie cho authentication
- ✅ Auto-log participant join khi request join token
- ✅ Auto-log participant leave khi disconnect

### Tất cả thông tin được lưu vào DB:
- ✅ Participant join/leave events
- ✅ Connection count (reconnection tracking)
- ✅ Session status (start/end)
- ✅ User authentication (token trong cookie, user info trong DB)

# API Services Documentation

## Backend API Integration Status

### ✅ Implemented Endpoints (Backend có sẵn)

#### Authentication (`/api/auth`)
- `POST /api/auth/register` - Đăng ký user mới
- `POST /api/auth/login` - Đăng nhập
- **File:** `authApi.ts`
- **Status:** ✅ Fully integrated

#### Sessions (`/api/sessions`)
- `GET /api/sessions/join-token` - Lấy LiveKit join token
- `POST /api/sessions/start` - Bắt đầu session (Mentor only)
- `POST /api/sessions/end` - Kết thúc session
- `GET /api/sessions/status` - Lấy trạng thái session
- **File:** `api.ts` (sessionApi)
- **Status:** ✅ Fully integrated

### ⚠️ Not Yet Implemented (Backend chưa có)

#### Bookings (`/api/v1/bookings`)
- **File:** `bookingApi.ts`
- **Status:** ⚠️ Endpoints return 404 - Backend chưa implement
- **Note:** Tất cả calls sẽ fail với 404 cho đến khi backend implement

#### Mentors (`/api/v1/mentors`)
- **File:** `mentorApi.ts`
- **Status:** ⚠️ Endpoints return 404 - Backend chưa implement
- **Note:** Tất cả calls sẽ fail với 404 cho đến khi backend implement

#### Reviews (`/api/v1/reviews`)
- **File:** `reviewApi.ts`
- **Status:** ⚠️ Endpoints return 404 - Backend chưa implement
- **Note:** Tất cả calls sẽ fail với 404 cho đến khi backend implement

#### Users (`/api/v1/users`)
- **File:** `userApi.ts`
- **Status:** ⚠️ Endpoints return 404 - Backend chưa implement
- **Note:** Tất cả calls sẽ fail với 404 cho đến khi backend implement

## Configuration

Tất cả API services sử dụng:
- **Base URL:** `VITE_API_URL` environment variable hoặc `http://localhost:3001`
- **Authentication:** Bearer token từ `authStore` (tự động thêm vào headers)
- **Error Handling:** Auto logout nếu nhận 401 Unauthorized

## Usage

```typescript
import { authApi } from './services/authApi';
import { sessionApi } from './services/api';
import { bookingApi } from './services/bookingApi'; // ⚠️ Will fail - not implemented

// ✅ Works - Backend has this
const response = await authApi.login(email, password);

// ✅ Works - Backend has this
const joinToken = await sessionApi.getJoinToken();

// ⚠️ Will return 404 - Backend doesn't have this yet
const bookings = await bookingApi.listBookings();
```

## Adding New Endpoints

Khi backend thêm endpoints mới:
1. Update corresponding API service file
2. Remove warning comments
3. Test integration
4. Update this README




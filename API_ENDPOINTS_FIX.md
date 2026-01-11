# API Endpoints Fix

## Problem
Frontend was calling `/api/v1/users/me` and `/api/v1/mentors/:mentorId` but backend only had `/api/auth` and `/api/sessions`.

## Solution

### Backend Changes

1. **Created `/api/users` routes** (`services/api-service/src/routes/users.ts`):
   - `GET /api/users/me` - Get current user profile
   - `PUT /api/users/me` - Update current user profile
   - `GET /api/users/:userId` - Get user by ID

2. **Created `/api/mentors` routes** (`services/api-service/src/routes/mentors.ts`):
   - `GET /api/mentors` - List/search mentors
   - `GET /api/mentors/:mentorId` - Get mentor by ID

3. **Added backward compatibility** in `services/api-service/src/index.ts`:
   - `/api/v1/users/*` → `/api/users/*`
   - `/api/v1/mentors/*` → `/api/mentors/*`

### Frontend Changes

1. **Updated `userApi.ts`**:
   - Try `/api/users/me` first, fallback to `/api/v1/users/me` if 404

2. **Updated `mentorApi.ts`**:
   - Try `/api/mentors` first, fallback to `/api/v1/mentors` if 404

3. **Updated `UserProfilePage.tsx`**:
   - Fallback to `authStore` user if API call fails

## Next Steps

**Restart backend service** to apply the new routes:
```powershell
# Stop current backend (Ctrl+C in backend window)
# Then restart using start-all-services.ps1 or manually
```

## Testing

After restart, these endpoints should work:
- ✅ `GET /api/users/me` - No more 404
- ✅ `GET /api/mentors/:mentorId` - No more 404
- ✅ `GET /api/v1/users/me` - Backward compatible
- ✅ `GET /api/v1/mentors/:mentorId` - Backward compatible



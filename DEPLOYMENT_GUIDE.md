# Hướng Dẫn Deploy Video Call Platform (100% FREE)

## Tổng Quan Stack

- **Database:** Supabase PostgreSQL (FREE) ✅ (Đã setup)
- **Backend:** Render.com (FREE tier)
- **Frontend:** Vercel (FREE tier)
- **Video:** LiveKit Cloud (FREE tier)

---

## BƯỚC 1: Deploy Backend lên Render.com

### 1.1. Truy cập Render.com

1. Đăng nhập: https://render.com/
2. Sign in với GitHub account

### 1.2. Tạo Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect repository:
   - Click **"Connect account"** nếu chưa connect GitHub
   - Chọn repository: `nhq04072022/video-call`
   - Click **"Connect"**

3. Cấu hình service:
   - **Name:** `video-call-api` (hoặc tên bạn muốn)
   - **Region:** `Singapore` (hoặc gần bạn nhất)
   - **Branch:** `main`
   - **Root Directory:** `services/api-service` ⚠️ **QUAN TRỌNG!**
   - **Runtime:** `Node`
   - **Build Command:** `NODE_ENV=development npm ci && npm run build`
     - ⚠️ **QUAN TRỌNG:** Set `NODE_ENV=development` để đảm bảo install cả `devDependencies` (bao gồm `@types/node` cần cho TypeScript build)
     - Nếu vẫn lỗi, thử: `npm install --include=dev && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** `Free`

### 1.3. Environment Variables

Vào tab **"Environment"**, thêm các variables sau:

```env
# Database (từ Supabase)
DATABASE_URL=postgresql://postgres:Quangnguyen@04072022@db.rmrxqcpkwpnnelilnadn.supabase.co:5432/postgres

# LiveKit (từ LiveKit Cloud)
LIVEKIT_URL=wss://videocall-uppti52t.livekit.cloud
LIVEKIT_API_KEY=APIC4NvbNcWY6LV
LIVEKIT_API_SECRET=4wSxe4xLvNiDC7qfLjL5QEUJhWe335fA5aaBRN8T2HuB

# JWT Secret
JWT_SECRET=scTNSXfmfrs7LnGpf8A7ng5w368jC4AKTBE22iEisfTeVbMkJbIeK9yDpy3Zk3Je

# Frontend URL (sẽ cập nhật sau khi deploy frontend)
# Format: https://your-frontend.vercel.app (hoặc nhiều URLs cách nhau bởi dấu phẩy)
# Ví dụ: FRONTEND_URL=https://video-call-ten-coral.vercel.app,http://localhost:5173
FRONTEND_URL=http://localhost:5173

# Node
NODE_ENV=production
PORT=3001
```

### 1.4. Cấu hình Build

**QUAN TRỌNG:** Đảm bảo Render install `devDependencies` để build TypeScript:

1. Trong Render Dashboard → Service Settings:
   - **Build Command:** `npm install && npm run build`
   - Hoặc nếu đã có build command, đảm bảo nó chạy `npm install` trước `npm run build`

2. Render mặc định sẽ install cả `dependencies` và `devDependencies` khi chạy `npm install`

### 1.5. Cấu hình Database Connection

**QUAN TRỌNG:** Nếu gặp lỗi `ENETUNREACH` hoặc không kết nối được database:

1. **Dùng Connection Pooling URL từ Supabase:**
   - Vào Supabase Dashboard → Project Settings → Database
   - Tìm **"Connection Pooling"** section
   - Copy **Connection String** (port 6543, có `?pgbouncer=true`)
   - Format: `postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:6543/postgres?pgbouncer=true`
   - Cập nhật `DATABASE_URL` trong Render Environment Variables

2. **Hoặc nếu vẫn lỗi IPv6:**
   - Thử dùng direct connection với IPv4: `postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres`
   - Đảm bảo Supabase cho phép connections từ Render IPs

### 1.6. Deploy

1. Click **"Create Web Service"**
2. Đợi build (3-5 phút)
3. Xem logs để kiểm tra
4. Khi deploy xong, bạn sẽ có URL: `https://video-call-api.onrender.com`
5. Test: `https://video-call-api.onrender.com/health`

**Lưu ý:** Nếu thấy lỗi database connection trong logs nhưng server vẫn chạy, đó là do job scheduler. Server vẫn hoạt động bình thường cho API requests.

**Kết quả mong đợi:**
```json
{
  "status": "ok",
  "message": "API service is running"
}
```

### 1.6. Lưu ý Render Free Tier

- Service sẽ **sleep** sau 15 phút không có traffic
- Lần request đầu sau khi sleep mất ~30 giây để wake up
- Job scheduler (node-cron) **không chạy** khi sleep
- Đủ cho testing, production nên upgrade

---

## BƯỚC 2: Setup LiveKit Cloud ✅ (Đã có sẵn)

LiveKit Cloud đã được setup với thông tin sau:

- **Server URL:** `wss://videocall-uppti52t.livekit.cloud`
- **API Key:** `APIC4NvbNcWY6LV`
- **API Secret:** `4wSxe4xLvNiDC7qfLjL5QEUJhWe335fA5aaBRN8T2HuB`

Các thông tin này đã được cấu hình trong Environment Variables của Render (xem BƯỚC 1.3).

---

## BƯỚC 3: Deploy Frontend lên Vercel

### 3.1. Truy cập Vercel

1. Đăng nhập: https://vercel.com/
2. Sign in với GitHub account

### 3.2. Tạo Project

1. Click **"Add New..."** → **"Project"**
2. Import repository:
   - Chọn repository: `nhq04072022/video-call`
   - Click **"Import"**

3. Cấu hình project:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend/apps/web` ⚠️ **QUAN TRỌNG!**
   - **Build Command:** `npm run build` (auto detect)
   - **Output Directory:** `dist` (auto detect)
   - **Install Command:** `npm install` (auto detect)

### 3.3. Environment Variables

Vào **"Environment Variables"**, thêm:

```env
VITE_API_URL=https://video-call-api.onrender.com
VITE_LIVEKIT_URL=wss://videocall-uppti52t.livekit.cloud
```

**Lưu ý:**
- Thay `video-call-api.onrender.com` bằng URL Render backend của bạn (sẽ có sau khi deploy)

### 3.4. Deploy

1. Click **"Deploy"**
2. Đợi build (2-3 phút)
3. Vercel tự động generate domain: `your-app-xxxxx.vercel.app`

### 3.5. Cập nhật CORS ở Backend

Quay lại **Render** → **Environment** → cập nhật:

```env
FRONTEND_URL=https://your-app-xxxxx.vercel.app
```

Render sẽ tự động restart (đợi 1-2 phút).

---

## BƯỚC 4: Kiểm Tra Toàn Bộ Hệ Thống

### 4.1. Test Backend

```bash
# Health check (nếu sleep, đợi ~30s)
curl https://video-call-api.onrender.com/health
```

**Kết quả mong đợi:**
```json
{
  "status": "ok",
  "message": "API service is running"
}
```

### 4.2. Test Frontend

1. Truy cập: `https://your-app-xxxxx.vercel.app`
2. Thử đăng ký tài khoản mới
3. Mở DevTools (F12) → Console, kiểm tra lỗi
4. Thử đăng nhập

### 4.3. Test Database (Supabase)

1. Vào Supabase → Table Editor
2. Kiểm tra table `users` có data mới không
3. Nếu có → Database kết nối OK ✅

### 4.4. Test LiveKit

1. Đăng nhập vào app
2. Tạo/join session
3. Kiểm tra video call hoạt động

---

## Tổng Kết URLs Sau Khi Deploy

- **Backend API:** `https://video-call-api.onrender.com` (sẽ có sau khi deploy)
- **Frontend:** `https://your-app-xxxxx.vercel.app` (sẽ có sau khi deploy)
- **Database:** Supabase (internal) - `db.rmrxqcpkwpnnelilnadn.supabase.co`
- **LiveKit:** `wss://videocall-uppti52t.livekit.cloud` ✅

---

## Troubleshooting

### Backend không connect được Database

- ✅ Kiểm tra `DATABASE_URL` đúng format
- ✅ Kiểm tra password đúng
- ✅ Supabase yêu cầu SSL (connection string đã có SSL)
- ✅ Kiểm tra pool config: `max: 10` (đã optimize)

### Backend sleep trên Render

- ⚠️ Đây là bình thường với free tier
- ⚠️ Lần request đầu sau khi sleep mất ~30s
- 💡 Có thể dùng cron job bên ngoài để ping mỗi 10 phút (optional)

### Frontend không connect được Backend

- ✅ Kiểm tra `VITE_API_URL` đúng URL backend
- ✅ Kiểm tra CORS: `FRONTEND_URL` trong backend match với Vercel domain
- ✅ Render có thể đang sleep → đợi ~30s

### Video call không hoạt động

- ✅ Kiểm tra LiveKit Cloud project đang active
- ✅ Kiểm tra browser console xem có lỗi WebSocket
- ✅ Kiểm tra token từ backend có hợp lệ

---

## Checklist Deploy

- [ ] Deploy backend lên Render.com
- [ ] Cấu hình env vars trong Render (DATABASE_URL, LIVEKIT, JWT_SECRET)
- [ ] Test backend health endpoint
- [ ] Setup LiveKit Cloud (nếu chưa có)
- [ ] Deploy frontend lên Vercel
- [ ] Cấu hình env vars trong Vercel (VITE_API_URL, VITE_LIVEKIT_URL)
- [ ] Cập nhật FRONTEND_URL trong Render
- [ ] Test đăng ký/đăng nhập
- [ ] Test video call

---

## Chi Phí (FREE Tier)

- ✅ **Supabase:** FREE (500MB, 2GB bandwidth)
- ✅ **Render:** FREE (sleep sau 15 phút idle)
- ✅ **Vercel:** FREE (unlimited)
- ✅ **LiveKit Cloud:** FREE tier (có giới hạn)

**Tổng:** $0/tháng (đủ cho testing)

---

## Next Steps (Sau Khi Deploy)

1. ✅ Test toàn bộ tính năng
2. 📊 Monitor logs (Render & Vercel)
3. 🔒 Setup custom domain (optional)
4. 📈 Upgrade plans khi cần (production)

# Hướng Dẫn Setup LiveKit

## Tại Sao Cần LiveKit?

LiveKit là một open-source WebRTC server được sử dụng để cung cấp tính năng video call real-time trong ứng dụng. Để sử dụng tính năng meeting, bạn cần setup LiveKit server.

## Các Tùy Chọn Setup

### Option 1: Sử dụng LiveKit Cloud (Dễ nhất - Khuyến nghị cho testing)

1. Đăng ký tài khoản tại: https://cloud.livekit.io/
2. Tạo một project mới
3. Lấy thông tin:
   - **Server URL**: `wss://your-project.livekit.cloud`
   - **API Key**: Từ dashboard
   - **API Secret**: Từ dashboard

4. Cập nhật file `.env`:
```
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key-here
LIVEKIT_API_SECRET=your-api-secret-here
```

### Option 2: Chạy LiveKit Server Local (Cho development)

1. Cài đặt Docker
2. Chạy LiveKit server:
```bash
docker run --rm \
  -p 7880:7880 \
  -p 7881:7881 \
  -p 7882:7882/udp \
  -e LIVEKIT_KEYS="devkey: devsecret" \
  livekit/livekit-server --dev
```

3. Cập nhật file `.env`:
```
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=devsecret
```

### Option 3: Self-hosted LiveKit Server

Xem hướng dẫn chi tiết tại: https://docs.livekit.io/home/self-hosting/

## Sau Khi Setup

1. Restart backend server
2. Test lại tính năng join meeting

## Lưu Ý

- LiveKit Cloud có free tier với giới hạn nhất định
- Cho development, có thể dùng Docker local server
- Production nên dùng LiveKit Cloud hoặc self-hosted với cấu hình phù hợp


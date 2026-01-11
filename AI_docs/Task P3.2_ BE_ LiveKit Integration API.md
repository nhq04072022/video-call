# Task P3.2: BE: LiveKit Integration API

**Mô Tả:** Triển khai các endpoint API để tương tác với LiveKit Server, quản lý trạng thái phiên và tạo token tham gia.

**Team:** Backend
**Ước Tính:** 2.5 Person-Days

## Công Việc Cần Thực Hiện

1.  **Cấu hình LiveKit:** Thiết lập kết nối và xác thực với LiveKit Server (API Key, Secret).
2.  **Endpoint Lấy Join Token (`GET /api/v1/sessions/:sessionId/join-token`):**
    *   Yêu cầu xác thực (Bearer Token).
    *   Xác minh người dùng là Mentor hoặc Mentee của Session.
    *   Sử dụng LiveKit SDK để tạo một **Access Token** cho người dùng, sử dụng `livekit_room_name` của Session.
    *   Trả về token cho Frontend.
3.  **Endpoint Bắt đầu Phiên (`POST /api/v1/sessions/:sessionId/start`):**
    *   Yêu cầu xác thực và chỉ cho phép **Mentor** thực hiện.
    *   Cập nhật `start_time` và trạng thái Session trong DB thành `ACTIVE`.
4.  **Endpoint Kết thúc Phiên (`POST /api/v1/sessions/:sessionId/end`):**
    *   Yêu cầu xác thực.
    *   Cập nhật `end_time`, tính toán `duration_minutes`, và đặt trạng thái Session thành `ENDED`.
5.  **Endpoint Lấy Trạng thái (`GET /api/v1/sessions/:sessionId/status`):**
    *   Trả về trạng thái hiện tại của Session (dùng cho việc polling/kiểm tra).

## Tiêu Chí Hoàn Thành
*   Frontend có thể lấy LiveKit Token hợp lệ để tham gia phòng.
*   Chỉ Mentor mới có thể kích hoạt endpoint `/start`.
*   Trạng thái Session được cập nhật chính xác trong DB sau khi `/start` và `/end` được gọi.

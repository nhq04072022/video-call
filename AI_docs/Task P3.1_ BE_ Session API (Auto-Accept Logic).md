# Task P3.1: BE: Session API (Auto-Accept Logic)

**Mô Tả:** Triển khai endpoint tạo Session với logic tự động chấp nhận (Auto-Accept) để ưu tiên kiểm thử Live Session.

**Team:** Backend
**Ước Tính:** 2.0 Person-Days

## Công Việc Cần Thực Hiện

1.  **Endpoint Tạo Session (`POST /api/v1/sessions/create`):**
    *   Nhận `mentor_id`, `mentee_goal`, `mentee_questions`, `scheduled_time` (thời gian đề xuất).
    *   **Logic Auto-Accept (FR-3.2):** Sau khi tạo bản ghi Session trong DB, ngay lập tức đặt trạng thái là `ACCEPTED`.
    *   Tạo một `livekit_room_name` duy nhất cho phiên này.
    *   Gửi thông báo (email/in-app) cho cả Mentor và Mentee về Session mới đã được chấp nhận (FR-3.3).
2.  **Endpoint Lấy Session (`GET /sessions/:sessionId`):**
    *   Yêu cầu xác thực (Bearer Token).
    *   Chỉ cho phép Mentor hoặc Mentee của phiên đó truy cập (BRD NFR 6.3.3).
    *   Trả về chi tiết Session, bao gồm `livekit_room_name`.

## Tiêu Chí Hoàn Thành
*   Endpoint `/sessions/create` hoạt động và tự động đặt trạng thái Session là `ACCEPTED`.
*   Mỗi Session được tạo có một `livekit_room_name` duy nhất.
*   Chỉ Mentor và Mentee liên quan mới có thể lấy thông tin chi tiết Session.

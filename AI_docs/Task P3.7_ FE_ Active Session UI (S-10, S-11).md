# Task P3.7: FE: Active Session UI (S-10, S-11)

**Mô Tả:** Xây dựng giao diện Video Call 1:1 và logic điều khiển phiên.

**Team:** Frontend
**Ước Tính:** 2.5 Person-Days

## Công Việc Cần Thực Hiện

1.  **Giao diện Active Session (S-10):**
    *   Thiết kế bố cục Video Grid 1:1 (FR-4.3.1).
    *   Xây dựng Thanh Điều khiển (Control Bar) với các nút: Mic, Video, Share Screen, End Session (FR-4.3.2).
    *   Hiển thị Đồng hồ đếm thời gian phiên và Chỉ báo Chất lượng Kết nối Mạng (FR-4.3.3).
2.  **Logic Điều khiển:**
    *   Sử dụng LiveKit SDK để bật/tắt Mic, Video, và Chia sẻ Màn hình.
    *   Triển khai logic Kết thúc Phiên: Khi nhấn "End Session", hiển thị Modal xác nhận (S-11) và gọi API `/end` (P3.2).
3.  **Xử lý Ngắt kết nối:** Xử lý các trường hợp ngắt kết nối đột ngột và chuyển hướng người dùng đến màn hình Tóm tắt.

## Tiêu Chí Hoàn Thành
*   Video call 1:1 hoạt động ổn định, có thể bật/tắt mic, video, và chia sẻ màn hình.
*   Đồng hồ đếm thời gian hoạt động chính xác.
*   Người dùng có thể kết thúc phiên và gọi API `/end` thành công.

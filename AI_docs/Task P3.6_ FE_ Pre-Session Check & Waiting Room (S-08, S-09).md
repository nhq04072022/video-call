# Task P3.6: FE: Pre-Session Check & Waiting Room (S-08, S-09)

**Mô Tả:** Xây dựng giao diện và logic cho màn hình Kiểm tra Thiết bị và Phòng Chờ.

**Team:** Frontend
**Ước Tính:** 2.0 Person-Days

## Công Việc Cần Thực Hiện

1.  **Màn hình Kiểm tra Thiết bị (S-08):**
    *   Sử dụng LiveKit SDK để truy cập camera và microphone.
    *   Hiển thị video preview và chỉ báo âm thanh (FR-4.1.1).
    *   Triển khai logic Đồng ý (Consent) và kích hoạt nút "Join Session" (FR-4.1.2, FR-4.1.3).
2.  **Màn hình Phòng Chờ (S-09):**
    *   Sử dụng LiveKit SDK để kết nối vào phòng (chỉ ở chế độ chờ).
    *   Hiển thị trạng thái kết nối của cả hai bên (FR-4.2.1).
    *   Hiển thị nút "Start Session" **chỉ cho Mentor** và chỉ kích hoạt khi cả hai bên đã sẵn sàng (FR-4.2.2).
    *   Tích hợp với API `/start` (P3.2) khi Mentor nhấn nút.

## Tiêu Chí Hoàn Thành
*   Người dùng có thể kiểm tra thiết bị và thấy video/audio preview của mình.
*   Mentor có thể bắt đầu phiên từ Phòng Chờ khi Mentee đã tham gia.
*   Trạng thái phòng chờ được hiển thị chính xác.

# Task P3.4: FE: Dashboard (S-06)

**Mô Tả:** Xây dựng giao diện Dashboard cho Mentor và Mentee để xem và quản lý các phiên của họ.

**Team:** Frontend
**Ước Tính:** 1.5 Person-Days

## Công Việc Cần Thực Hiện

1.  **Xây dựng UI Dashboard (S-06):** Thiết kế bố cục Dashboard chung, có thể phân biệt hiển thị cho Mentor và Mentee.
2.  **Tích hợp API:**
    *   Tạo API Backend để lấy danh sách Sessions liên quan đến người dùng hiện tại (Upcoming, Active, Ended).
    *   Sử dụng API này để hiển thị danh sách Sessions.
3.  **Hiển thị Sessions:**
    *   Mỗi Session hiển thị các thông tin cơ bản: Tên đối tác, Thời gian, Trạng thái.
    *   Nút hành động: Nút "Join Session" cho các phiên `ACCEPTED` sắp tới.

## Tiêu Chí Hoàn Thành
*   Dashboard hiển thị danh sách Sessions chính xác cho vai trò người dùng (Mentor/Mentee).
*   Nút "Join Session" hoạt động và chuyển hướng đến màn hình Kiểm tra Thiết bị (S-08).

# Task P1.5: FE: Authentication Screens

**Mô Tả:** Xây dựng giao diện người dùng cho các màn hình Đăng ký và Đăng nhập, và tích hợp với API Backend.

**Team:** Frontend
**Ước Tính:** 2.0 Person-Days

## Công Việc Cần Thực Hiện

1.  **Xây dựng UI Đăng ký (S-01):**
    *   Thiết kế form theo TDD S-01 (Email, Password, Confirm Password, Role).
    *   Áp dụng các component đã tạo ở P1.4.
2.  **Xây dựng UI Đăng nhập (S-02):**
    *   Thiết kế form theo TDD S-02 (Email, Password).
3.  **Tích hợp API:**
    *   Sử dụng API `/register` và `/login` từ P1.3.
    *   Xử lý lỗi và hiển thị thông báo cho người dùng.
    *   Lưu trữ JWT nhận được sau khi đăng nhập thành công (ví dụ: trong HttpOnly Cookie hoặc Local Storage an toàn).
4.  **Định tuyến:** Thiết lập định tuyến để chuyển hướng người dùng đến `/dashboard` sau khi đăng nhập thành công.

## Tiêu Chí Hoàn Thành
*   Người dùng có thể đăng ký và đăng nhập thành công qua giao diện.
*   Validation phía Frontend hoạt động chính xác.
*   Sau khi đăng nhập, JWT được lưu trữ và người dùng được chuyển hướng đến Dashboard.

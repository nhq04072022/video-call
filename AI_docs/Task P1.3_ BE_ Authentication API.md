# Task P1.3: BE: Authentication API

**Mô Tả:** Triển khai các endpoint API cho luồng đăng ký và đăng nhập bằng email/mật khẩu.

**Team:** Backend
**Ước Tính:** 1.5 Person-Days

## Công Việc Cần Thực Hiện

1.  **Endpoint Đăng ký (`POST /register`):**
    *   Nhận `email`, `password`, `full_name`, `role` (Mentor/Mentee).
    *   Kiểm tra tính hợp lệ của dữ liệu đầu vào (validation).
    *   Hash mật khẩu (sử dụng bcrypt hoặc thư viện tương đương).
    *   Lưu thông tin người dùng vào bảng `users`.
    *   Nếu là Mentor, tạo một bản ghi cơ bản trong `mentor_profiles` với `is_public = TRUE` (FR-1.4).
2.  **Endpoint Đăng nhập (`POST /login`):**
    *   Nhận `email`, `password`.
    *   Xác thực người dùng bằng cách so sánh hash mật khẩu.
    *   Tạo và trả về một **Bearer Token** (JWT) chứa `user_id` và `role`.
3.  **Middleware Xác thực:** Tạo một middleware để bảo vệ các endpoint yêu cầu đăng nhập bằng cách kiểm tra và giải mã Bearer Token.

## Tiêu Chí Hoàn Thành
*   Người dùng có thể đăng ký thành công và mật khẩu được hash an toàn.
*   Người dùng có thể đăng nhập và nhận được JWT hợp lệ.
*   Một endpoint thử nghiệm được bảo vệ bởi middleware xác thực hoạt động chính xác.

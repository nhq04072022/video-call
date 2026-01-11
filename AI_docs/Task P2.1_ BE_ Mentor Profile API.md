# Task P2.1: BE: Mentor Profile API

**Mô Tả:** Triển khai các endpoint API cho việc tạo, đọc, cập nhật (CRUD) thông tin Hồ sơ Mentor và Kỹ năng/Lĩnh vực chuyên môn.

**Team:** Backend
**Ước Tính:** 2.0 Person-Days

## Công Việc Cần Thực Hiện

1.  **Endpoint Cập nhật Hồ sơ (`PUT /profiles/mentor`):**
    *   Yêu cầu xác thực (Bearer Token).
    *   Cho phép Mentor cập nhật các trường trong `mentor_profiles` (bio, title, experience, achievements).
2.  **Endpoint Quản lý Kỹ năng (`POST/DELETE /profiles/mentor/skills`):**
    *   Cho phép Mentor thêm/xóa các kỹ năng/lĩnh vực chuyên môn vào bảng `mentor_skills`.
3.  **Endpoint Lấy Hồ sơ Công khai (`GET /profiles/:userId`):**
    *   Endpoint công khai (không cần xác thực).
    *   Trả về thông tin chi tiết của Mentor (từ `users`, `mentor_profiles`, `mentor_skills`).
4.  **Logic Onboarding (FR-1.4):** Đảm bảo rằng khi Mentor đăng ký (P1.3), một hồ sơ cơ bản được tạo và tự động công khai.

## Tiêu Chí Hoàn Thành
*   Mentor có thể cập nhật hồ sơ và kỹ năng của mình thành công.
*   Hồ sơ Mentor có thể được truy cập công khai qua endpoint GET.
*   Dữ liệu được lưu trữ chính xác trong các bảng `mentor_profiles` và `mentor_skills`.

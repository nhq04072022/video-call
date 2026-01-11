# Task P1.2: BE: Database Setup (PostgreSQL Schema)

**Mô Tả:** Thiết lập cơ sở dữ liệu PostgreSQL và tạo các bảng cần thiết theo TDD, bao gồm cả việc tạo các kiểu dữ liệu `ENUM` và ràng buộc khóa ngoại.

**Team:** Backend
**Ước Tính:** 1.5 Person-Days

## Công Việc Cần Thực Hiện

1.  **Cài đặt và Cấu hình PostgreSQL:** Đảm bảo BE có thể kết nối và quản lý schema.
2.  **Tạo Kiểu Dữ liệu ENUM:**
    *   Tạo `ENUM` cho cột `role` trong bảng `users`: `('MENTOR', 'MENTEE')`.
    *   Tạo `ENUM` cho cột `status` trong bảng `sessions`: `('PENDING', 'ACCEPTED', 'DECLINED', 'ACTIVE', 'ENDED', 'CANCELED')`.
3.  **Tạo Bảng `users`:** Áp dụng schema chi tiết từ TDD (bao gồm `UUID` cho `id`, `UNIQUE` cho `email`).
4.  **Tạo Bảng `mentor_profiles`:** Thiết lập khóa ngoại tới `users.id`.
5.  **Tạo Bảng `mentor_skills`:** Thiết lập khóa ngoại tới `users.id`.
6.  **Tạo Bảng `sessions`:** Thiết lập khóa ngoại tới `users.id` (cho `mentor_id` và `mentee_id`).

## Tiêu Chí Hoàn Thành
*   Tất cả 4 bảng chính (`users`, `mentor_profiles`, `mentor_skills`, `sessions`) được tạo thành công trong PostgreSQL.
*   Các kiểu dữ liệu `ENUM` được định nghĩa và sử dụng đúng.
*   Tất cả các ràng buộc `NOT NULL`, `UNIQUE`, và `FOREIGN KEY` được áp dụng chính xác theo TDD.

# Task P2.5: FE: Profile Management (S-07)

**Mô Tả:** Xây dựng giao diện Dashboard/Settings cho phép Mentor và Mentee cập nhật thông tin cá nhân và chuyên môn.

**Team:** Frontend
**Ước Tính:** 1.5 Person-Days

## Công Việc Cần Thực Hiện

1.  **Xây dựng UI Quản lý Hồ sơ (S-07):**
    *   Form chung cho Mentee: Cập nhật tên, avatar, mật khẩu.
    *   Form bổ sung cho Mentor: Cập nhật Bio, Title, Experience, Achievements, và quản lý danh sách Skills (Multi-select).
2.  **Tích hợp API:**
    *   Sử dụng API `PUT /profiles/mentor` (P2.1) để gửi dữ liệu cập nhật.
    *   Sử dụng API `POST/DELETE /profiles/mentor/skills` (P2.1) để quản lý kỹ năng.
3.  **Xử lý Trạng thái:** Hiển thị thông báo thành công/thất bại sau khi cập nhật.

## Tiêu Chí Hoàn Thành
*   Mentor có thể cập nhật tất cả các trường thông tin chuyên môn và kỹ năng.
*   Mentee có thể cập nhật thông tin cá nhân cơ bản.
*   Dữ liệu được gửi và lưu trữ thành công ở Backend.

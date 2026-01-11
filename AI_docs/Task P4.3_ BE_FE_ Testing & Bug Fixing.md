# Task P4.3: BE/FE: Testing & Bug Fixing

**Mô Tả:** Thực hiện kiểm thử End-to-End (E2E) toàn bộ luồng người dùng và sửa các lỗi phát sinh.

**Team:** All (BE/FE)
**Ước Tính:** 0.5 Person-Day

## Công Việc Cần Thực Hiện

1.  **Kiểm thử E2E Luồng chính:**
    *   Đăng ký Mentee -> Đăng ký Mentor -> Mentor cập nhật Profile -> Mentee tìm kiếm Mentor -> Mentee Apply (Auto-Accept) -> Cả hai Join Session -> Mentor Start Session -> End Session.
2.  **Kiểm thử Bảo mật:**
    *   Kiểm tra phân quyền truy cập (chỉ Mentor/Mentee liên quan mới vào được Session).
    *   Kiểm tra xác thực API (Bearer Token).
3.  **Kiểm thử Hiệu suất:**
    *   Kiểm tra độ trễ video (Latency) trong phiên (BRD NFR 6.2.2).
    *   Kiểm tra khả năng chịu tải của API.
4.  **Sửa lỗi:** Sửa các lỗi nghiêm trọng (Critical/Major) được tìm thấy trong quá trình kiểm thử.

## Tiêu Chí Hoàn Thành
*   Tất cả các tiêu chí chấp nhận (Acceptance Criteria) trong BRD đều được đáp ứng.
*   Không còn lỗi nghiêm trọng nào được ghi nhận.
*   Hệ thống hoạt động ổn định trong các luồng chính.

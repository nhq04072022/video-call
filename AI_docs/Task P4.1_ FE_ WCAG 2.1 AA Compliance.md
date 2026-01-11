# Task P4.1: FE: WCAG 2.1 AA Compliance

**Mô Tả:** Kiểm tra và sửa lỗi toàn bộ giao diện Frontend để đảm bảo tuân thủ tiêu chuẩn Khả năng Truy cập Web (WCAG) 2.1 mức AA.

**Team:** Frontend
**Ước Tính:** 2.5 Person-Days

## Công Việc Cần Thực Hiện

1.  **Kiểm tra Điều hướng Bàn phím (FR-6.1.1):**
    *   Đảm bảo tất cả các thành phần tương tác (nút, link, form) có thể được truy cập và điều khiển bằng phím `Tab`, `Enter`, `Space`.
    *   Sửa lỗi thứ tự tab index và bẫy focus trong các modal (S-05, S-11).
2.  **Kiểm tra Trình đọc Màn hình (FR-6.1.2):**
    *   Thêm/Điều chỉnh các thuộc tính `aria-label`, `aria-describedby`, `role` cho các thành phần UI phức tạp (đặc biệt là Control Bar trong Live Session S-10).
    *   Đảm bảo các thông báo trạng thái (ví dụ: kết nối thành công) được đọc bởi trình đọc màn hình.
3.  **Kiểm tra Độ tương phản (FR-6.1.4):**
    *   Sử dụng công cụ kiểm tra độ tương phản (ví dụ: Axe DevTools) để quét toàn bộ ứng dụng.
    *   Điều chỉnh màu sắc văn bản và nền nếu cần để đạt tỷ lệ 4.5:1 (văn bản) và 3:1 (UI components).

## Tiêu Chí Hoàn Thành
*   Ứng dụng vượt qua kiểm tra tự động của các công cụ WCAG (ví dụ: Lighthouse, Axe).
*   Người dùng có thể hoàn thành luồng chính (Đăng nhập -> Apply -> Join Session) chỉ bằng bàn phím.
*   Tất cả các lỗi tương phản màu sắc đã được khắc phục.

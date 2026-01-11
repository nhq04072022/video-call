# Task P2.3: FE: Trang Chủ/Discovery (S-03)

**Mô Tả:** Xây dựng giao diện Trang Chủ và màn hình Danh sách Mentor, bao gồm thanh tìm kiếm và bộ lọc.

**Team:** Frontend
**Ước Tính:** 2.5 Person-Days

## Công Việc Cần Thực Hiện

1.  **Xây dựng UI Trang Chủ (S-03):** Thiết kế giao diện tương tự Menteelogy, hiển thị danh sách Mentor nổi bật và các thẻ Mentor.
2.  **Thẻ Mentor Component:** Tạo component hiển thị tóm tắt thông tin Mentor (ảnh, tên, chức danh, lĩnh vực chính).
3.  **Tích hợp API Discovery:**
    *   Sử dụng API `/mentors` (P2.2) để hiển thị danh sách.
    *   Triển khai logic tìm kiếm và lọc phía Frontend, gửi request tương ứng đến Backend.
4.  **Xử lý Phân trang (Pagination):** Triển khai cơ chế tải thêm Mentor khi cuộn hoặc chuyển trang.
5.  **Đảm bảo UX:** Đảm bảo tốc độ tải trang nhanh (BRD NFR 6.2.1) và thiết kế đáp ứng (Responsive Design).

## Tiêu Chí Hoàn Thành
*   Trang Chủ hiển thị danh sách Mentor và các thẻ Mentor được định dạng đẹp mắt.
*   Chức năng tìm kiếm và lọc hoạt động, cập nhật danh sách Mentor theo thời gian thực.
*   Giao diện đáp ứng tốt trên cả mobile và desktop.

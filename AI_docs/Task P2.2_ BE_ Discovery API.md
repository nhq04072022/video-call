# Task P2.2: BE: Discovery API

**Mô Tả:** Triển khai API cho phép Mentee tìm kiếm, lọc và xem danh sách Mentor.

**Team:** Backend
**Ước Tính:** 2.0 Person-Days

## Công Việc Cần Thực Hiện

1.  **Endpoint Danh sách Mentor (`GET /mentors`):**
    *   Trả về danh sách các Mentor có `is_public = TRUE`.
    *   Sử dụng phân trang (Pagination) để quản lý lượng dữ liệu lớn.
2.  **Logic Tìm kiếm:**
    *   Cho phép tìm kiếm theo tên Mentor (`full_name`) hoặc chức danh (`title`).
3.  **Logic Lọc:**
    *   Cho phép lọc theo Kỹ năng/Lĩnh vực (`mentor_skills`).
    *   Cho phép lọc theo các tiêu chí khác (ví dụ: kinh nghiệm, đánh giá - mặc dù đánh giá chưa được implement, cần chuẩn bị trường này).
4.  **Tối ưu hóa Query:** Đảm bảo các truy vấn tìm kiếm và lọc được tối ưu hóa (sử dụng index, JOIN hiệu quả) để đảm bảo tốc độ tải trang nhanh (BRD NFR 6.2.1).

## Tiêu Chí Hoàn Thành
*   Endpoint `/mentors` trả về danh sách Mentor đã được phân trang.
*   Chức năng tìm kiếm và lọc hoạt động chính xác dựa trên các tham số query.
*   Tốc độ phản hồi của API dưới 500ms.

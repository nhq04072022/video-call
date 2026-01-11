# Task P3.3: FE: Session Application Form (S-05)

**Mô Tả:** Xây dựng giao diện Form Đăng ký Phiên và tích hợp với API Auto-Accept.

**Team:** Frontend
**Ước Tính:** 1.5 Person-Days

## Công Việc Cần Thực Hiện

1.  **Xây dựng UI Form (S-05):**
    *   Thiết kế form theo TDD S-05: `Mục tiêu Phiên`, `Câu hỏi Cụ thể`, `Thời gian Đề xuất`.
    *   Đảm bảo form có thiết kế đáp ứng và tuân thủ WCAG.
2.  **Tích hợp API:**
    *   Sử dụng API `POST /api/v1/sessions/create` (P3.1).
    *   Gửi `mentor_id` (từ URL), `mentee_goal`, `mentee_questions`, và `scheduled_time`.
3.  **Xử lý Hậu Đăng ký:**
    *   Sau khi nhận phản hồi thành công (Session đã được `ACCEPTED`), chuyển hướng người dùng đến trang Dashboard hoặc trang Session mới được tạo (FR-3.4).

## Tiêu Chí Hoàn Thành
*   Form được hiển thị khi Mentee nhấn "Apply" trên trang Hồ sơ Mentor.
*   Dữ liệu được gửi thành công và Session được tạo/chấp nhận tự động.
*   Người dùng được chuyển hướng chính xác sau khi đăng ký thành công.

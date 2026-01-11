# Tài liệu Thiết Kế Kỹ Thuật (Technical Design Document - TDD)

## Tên Dự Án: Nền Tảng Kết Nối Mentor-Mentee 1:1 (Project M&M)
**Phiên bản:** 1.1
**Ngày Phát Hành:** 25/12/2025
**Người Soạn Thảo:** Manus (Senior Tech Lead)

---

## 1. Tổng Quan

Tài liệu này mô tả chi tiết các yêu cầu về giao diện người dùng (Frontend Screens) và cấu trúc cơ sở dữ liệu (ERD) cho Project M&M, dựa trên Tài liệu Yêu cầu Kinh doanh (BRD) phiên bản 1.1.

## 2. Thiết Kế Giao Diện Người Dùng (Frontend Screens)

Các màn hình được thiết kế để hỗ trợ toàn bộ luồng người dùng, từ đăng ký, khám phá Mentor, đến thực hiện phiên video trực tiếp.

### 2.1. Màn Hình Xác Thực (Authentication Screens)

| ID | Tên Màn Hình | URL (Ví dụ) | Mô Tả Chi Tiết | Form Nhập Liệu & Validation |
| :--- | :--- | :--- | :--- | :--- |
| **S-01** | **Đăng Ký (Registration)** | `/register` | Cho phép người dùng mới tạo tài khoản. Chỉ hỗ trợ đăng ký bằng email/mật khẩu. | **Email:** Bắt buộc, định dạng email hợp lệ. **Password:** Bắt buộc, tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và số. **Confirm Password:** Bắt buộc, phải khớp với Password. **Role:** Radio button/Dropdown chọn Mentor hoặc Mentee. |
| **S-02** | **Đăng Nhập (Login)** | `/login` | Cho phép người dùng đã có tài khoản truy cập hệ thống. | **Email:** Bắt buộc. **Password:** Bắt buộc. |

### 2.2. Màn Hình Khám Phá & Hồ Sơ (Discovery & Profile Screens)

| ID | Tên Màn Hình | URL (Ví dụ) | Mô Tả Chi Tiết | Form Nhập Liệu & Validation |
| :--- | :--- | :--- | :--- | :--- |
| **S-03** | **Trang Chủ / Danh sách Mentor** | `/` | Hiển thị danh sách Mentor nổi bật. Giao diện tương tự Menteelogy. | **Search Bar:** Text input để tìm kiếm theo tên, chức danh. **Filter Controls:** Checkbox/Dropdown cho Lĩnh vực (Career, Study, Life), Kinh nghiệm, Đánh giá. |
| **S-04** | **Hồ Sơ Mentor** | `/profile/:mentorId` | Hiển thị thông tin chi tiết của Mentor. Bao gồm các tab: "About Me" (mặc định), "Sessions" (Lịch sử/Đánh giá). | **Nút "Apply":** Kích hoạt Modal/Chuyển hướng đến S-05. |
| **S-05** | **Form Đăng Ký Phiên (Modal/Page)** | `/profile/:mentorId/apply` | Form Mentee điền để gửi yêu cầu phiên tư vấn đến Mentor. **Lưu ý:** Phiên sẽ được tự động chấp nhận ngay lập tức để ưu tiên kiểm thử chức năng Session. | **Mục tiêu Phiên:** Textarea, bắt buộc, tối đa 500 ký tự. **Câu hỏi Cụ thể:** Textarea, bắt buộc, tối đa 1000 ký tự. **Thời gian Đề xuất:** Date/Time Picker đơn giản (chỉ để ghi nhận thời gian mong muốn). |

### 2.3. Màn Hình Quản Lý (Management Screens)

| ID | Tên Màn Hình | URL (Ví dụ) | Mô Tả Chi Tiết | Form Nhập Liệu & Validation |
| :--- | :--- | :--- | :--- | :--- |
| **S-06** | **Dashboard** | `/dashboard` | Điểm truy cập chính sau khi đăng nhập. Hiển thị danh sách các phiên (Upcoming, Pending, Completed) và các yêu cầu mới (chỉ Mentor). | **Nút "Accept/Decline"** (chỉ Mentor): Hành động xét duyệt yêu cầu phiên. |
| **S-07** | **Quản lý Hồ sơ** | `/settings/profile` | Cho phép người dùng cập nhật thông tin cá nhân và Mentor cập nhật thông tin chuyên môn. | **Thông tin Cơ bản:** Text inputs (Tên, Bio, Chức danh). **Thông tin Mentor:** Textarea (Kinh nghiệm, Thành tựu), Multi-select (Kỹ năng, Lĩnh vực). |

### 2.4. Màn Hình Phiên Video (Live Session Screens)

| ID | Tên Màn Hình | URL (Ví dụ) | Mô Tả Chi Tiết | Form Nhập Liệu & Validation |
| :--- | :--- | :--- | :--- | :--- |
| **S-08** | **Kiểm tra Thiết bị (Pre-Session Check)** | `/session/:sessionId/check` | Yêu cầu kiểm tra Camera, Microphone, Loa. Hiển thị video preview. | **Consent Checkbox:** Bắt buộc phải chọn. **Nút "Join Session":** Chỉ kích hoạt khi kiểm tra thiết bị thành công và đã đồng ý. |
| **S-09** | **Phòng Chờ (Waiting Room)** | `/session/:sessionId/wait` | Hiển thị trạng thái kết nối của cả hai bên ("2/2 Ready"). | **Nút "Start Session":** Chỉ hiển thị và kích hoạt cho Mentor khi cả hai đã sẵn sàng. |
| **S-10** | **Phiên Hoạt Động (Active Session)** | `/session/:sessionId/live` | Giao diện video call 1:1. Bao gồm Video Grid, Control Bar (Mic, Video, Share Screen, End Session), và Sidebar (AI Panel - Mentor only). | **Nút "End Session":** Kích hoạt Modal S-11. |
| **S-11** | **Modal Kết Thúc Phiên** | (Modal trên S-10) | Yêu cầu người dùng cung cấp lý do kết thúc phiên. | **Reason Dropdown:** Bắt buộc chọn một lý do (ví dụ: Time's up, Technical issue, Completed goal). |
| **S-12** | **Tóm tắt Phiên (Summary)** | `/session/:sessionId/summary` | Hiển thị thời lượng phiên. | N/A |

## 3. Thiết Kế Cơ Sở Dữ Liệu (Database Design)

Hệ thống sẽ sử dụng **PostgreSQL** làm cơ sở dữ liệu quan hệ. Thiết kế này tập trung vào các thực thể cốt lõi: Người dùng (User), Hồ sơ Mentor (MentorProfile), Phiên (Session), và Lịch trống (Availability).

### 3.1. Sơ Đồ Quan Hệ Thực Thể (Entity-Relationship Diagram - ERD)

Dưới đây là sơ đồ ERD mô tả mối quan hệ giữa các thực thể chính trong cơ sở dữ liệu PostgreSQL:

![Entity-Relationship Diagram](https://private-us-east-1.manuscdn.com/sessionFile/ll1EqftXh2LBUl2bnqsOLH/sandbox/TKLsQZ3tACWH9yD6RqhuRo-images_1766654990990_na1fn_L2hvbWUvdWJ1bnR1L2VyZA.png?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvbGwxRXFmdFhoMkxCVWwyYm5xc09MSC9zYW5kYm94L1RLTHNRWjN0QUNXSDl5RDZScWh1Um8taW1hZ2VzXzE3NjY2NTQ5OTA5OTBfbmExZm5fTDJodmJXVXZkV0oxYm5SMUwyVnlaQS5wbmciLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=saEAx1QM2dP2J-LJ0RrCpnKYKcZ6u5S1C3am~JkJQzpOMmfqA33ofzWX2B0XIjQBlui3f2uEz6WbGZaYJSmpE0SD-chErjdBcOOCt-Qn81DOReCIljHdvCcLouDjbESnZYGgvw9u6TJkmlKbwhm-qQwk5p0Qg3n9fInYAqWudbwQt2M65-vvrJ5NL0ZKaRRi~knBsEzwy9DOIs3uaWta5ZvW~zWIZm~P9fKM3dWN1WpUARpU7KWRb2aVWrbFuapHYwSo2-AaqL5948vQ68pDLXD0FNed4ndriJte-Z3SwYTZgp2Q6MrAbmXaw9MF-7l~YRwEuY12o6lGr9LPZpv0Lg__)

### 3.2. Mô Tả Cấu Trúc Bảng (Table Schema)

#### 1. Bảng `users` (Quản lý Người dùng)

| Tên Cột | Kiểu Dữ Liệu | Mô Tả | Ràng Buộc |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Khóa chính | `PRIMARY KEY` |
| `email` | `VARCHAR(255)` | Email người dùng | `UNIQUE`, `NOT NULL` |
| `password_hash` | `VARCHAR(255)` | Hash mật khẩu | `NOT NULL` |
| `full_name` | `VARCHAR(255)` | Tên đầy đủ | `NOT NULL` |
| `role` | `ENUM('MENTOR', 'MENTEE')` | Vai trò người dùng | `NOT NULL` |
| `avatar_url` | `VARCHAR(255)` | URL ảnh đại diện | `NULLABLE` |
| `created_at` | `TIMESTAMP` | Thời gian tạo | `DEFAULT NOW()` |
| `updated_at` | `TIMESTAMP` | Thời gian cập nhật | `DEFAULT NOW()` |

#### 2. Bảng `mentor_profiles` (Hồ sơ Mentor)

| Tên Cột | Kiểu Dữ Liệu | Mô Tả | Ràng Buộc |
| :--- | :--- | :--- | :--- |
| `user_id` | `UUID` | Khóa ngoại tới `users.id` | `PRIMARY KEY`, `FOREIGN KEY` |
| `bio` | `TEXT` | Giới thiệu bản thân | `NULLABLE` |
| `title` | `VARCHAR(255)` | Chức danh hiện tại | `NULLABLE` |
| `experience` | `TEXT` | Chi tiết kinh nghiệm làm việc | `NULLABLE` |
| `achievements` | `TEXT` | Các thành tựu nổi bật | `NULLABLE` |
| `is_public` | `BOOLEAN` | Trạng thái hiển thị công khai | `DEFAULT TRUE` (theo FR-1.4) |
| `average_rating` | `NUMERIC(2, 1)` | Điểm đánh giá trung bình | `DEFAULT 0.0` |

#### 3. Bảng `mentor_skills` (Kỹ năng/Lĩnh vực chuyên môn của Mentor)

| Tên Cột | Kiểu Dữ Liệu | Mô Tả | Ràng Buộc |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | Khóa chính | `PRIMARY KEY` |
| `mentor_id` | `UUID` | Khóa ngoại tới `users.id` | `FOREIGN KEY`, `NOT NULL` |
| `skill_name` | `VARCHAR(100)` | Tên kỹ năng/lĩnh vực | `NOT NULL` |

#### 4. Bảng `sessions` (Quản lý Phiên)

| Tên Cột | Kiểu Dữ Liệu | Mô Tả | Ràng Buộc |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Khóa chính | `PRIMARY KEY` |
| `mentor_id` | `UUID` | Khóa ngoại tới `users.id` | `FOREIGN KEY`, `NOT NULL` |
| `mentee_id` | `UUID` | Khóa ngoại tới `users.id` | `FOREIGN KEY`, `NOT NULL` |
| `status` | `ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'ACTIVE', 'ENDED', 'CANCELED')` | Trạng thái phiên | `NOT NULL` |
| `scheduled_time` | `TIMESTAMP` | Thời gian dự kiến | `NOT NULL` |
| `start_time` | `TIMESTAMP` | Thời gian bắt đầu thực tế | `NULLABLE` |
| `end_time` | `TIMESTAMP` | Thời gian kết thúc thực tế | `NULLABLE` |
| `duration_minutes` | `INTEGER` | Tổng thời lượng phiên | `NULLABLE` |
| `mentee_goal` | `TEXT` | Mục tiêu phiên của Mentee (từ form apply) | `NOT NULL` |
| `mentee_questions` | `TEXT` | Câu hỏi cụ thể của Mentee | `NOT NULL` |
| `livekit_room_name` | `VARCHAR(255)` | Tên phòng LiveKit | `UNIQUE`, `NULLABLE` |





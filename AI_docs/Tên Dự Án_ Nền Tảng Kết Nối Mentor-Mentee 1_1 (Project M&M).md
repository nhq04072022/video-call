Tài liệu Mô Tả Yêu Cầu Kinh Doanh (Business Requirements Document - BRD)

## Tên Dự Án: Nền Tảng Kết Nối Mentor-Mentee 1:1 (Project M&M)
**Phiên bản:** 1.2
**Ngày Phát Hành:** 25/12/2025
**Người Soạn Thảo:** Manus (Senior Tech Lead)

---

## 1. Tóm Tắt Điều Hành (Executive Summary)

Dự án **Project M&M** được khởi xướng nhằm xây dựng một nền tảng web chuyên biệt, hiện đại, tập trung vào việc kết nối hiệu quả giữa các **Mentor** (người hướng dẫn) và **Mentee** (người được hướng dẫn) thông qua các phiên tư vấn 1:1 trực tuyến. Mục tiêu chiến lược của nền tảng là cung cấp một trải nghiệm người dùng **liền mạch và chất lượng cao**, bao gồm toàn bộ chu trình từ việc khám phá Mentor, đăng ký phiên tư vấn, đến việc thực hiện phiên họp video trực tiếp.

Về mặt giao diện, website sẽ lấy cảm hứng từ cấu trúc và tính năng của nền tảng Menteelogy (Ybox) cho các trang công khai như Trang chủ và Hồ sơ Mentor. Về mặt kỹ thuật, dự án đặc biệt chú trọng vào hệ thống **Quản lý Phiên (Session Management)** và **Tích hợp Video Call Trực Tiếp (Live Video Integration)**, với các yêu cầu nghiêm ngặt về tính bảo mật, hiệu suất, và khả năng truy cập theo tiêu chuẩn **WCAG 2.1 AA**. Tài liệu này đóng vai trò là bản mô tả chi tiết các yêu cầu kinh doanh và kỹ thuật, làm cơ sở cho các giai đoạn thiết kế và phát triển tiếp theo.

## 2. Mục Tiêu Kinh Doanh (Business Objectives)

Các mục tiêu kinh doanh cốt lõi của Project M&M được xác định như sau:

| ID | Mục Tiêu | Mô Tả |
| :--- | :--- | :--- |
| **BO-01** | **Tăng cường Tỷ lệ Kết nối** | Cung cấp các công cụ tìm kiếm và lọc hiệu quả để Mentee dễ dàng tìm kiếm và kết nối với Mentor phù hợp nhất, từ đó tối đa hóa số lượng phiên tư vấn thành công. |
| **BO-02** | **Đảm bảo Chất lượng Dịch vụ** | Triển khai một giải pháp video call 1:1 **ổn định, bảo mật**, và đầy đủ chức năng (chia sẻ màn hình) để đảm bảo chất lượng nội dung và trải nghiệm trong suốt phiên tư vấn. |
| **BO-03** | **Tối ưu hóa Trải nghiệm Người dùng** | Thiết kế giao diện trực quan, dễ sử dụng, tuân thủ các tiêu chuẩn thiết kế hiện đại và các yêu cầu nghiêm ngặt về **Khả năng Truy cập (WCAG)**. |
| **BO-04** | **Xây dựng Thương hiệu Đáng tin cậy** | Tạo ra một nền tảng chuyên nghiệp, minh bạch và đáng tin cậy, thu hút cả Mentor và Mentee chất lượng cao, góp phần xây dựng cộng đồng bền vững. |

## 3. Phạm Vi Dự Án (Project Scope)

Phạm vi dự án được xác định rõ ràng để tập trung nguồn lực vào các tính năng cốt lõi (MVP):

| Phạm Vi | Mô Tả Chi Tiết |
| :--- | :--- |
| **Trong Phạm Vi (In-Scope)** | Quản lý người dùng (Đăng ký/Đăng nhập), Phân quyền Mentor/Mentee, Danh sách Mentor, Trang Hồ sơ Mentor, Quy trình Đăng ký phiên (Apply - **Tự động chấp nhận**), Hệ thống Quản lý Phiên (Session Management), Tích hợp Video Call 1:1 (LiveKit/WebRTC), Dashboard cơ bản cho Mentor/Mentee để theo dõi phiên. |
| **Ngoài Phạm Vi (Out-of-Scope)** | **Tích hợp cổng thanh toán (Payment Gateway)**, **Quản lý lịch trống của Mentor**, **Chức năng đánh giá/xếp hạng phiên**, Ứng dụng di động Native (iOS/Android), Hệ thống quản lý nội dung (CMS) phức tạp, Các tính năng AI nâng cao. |

## 4. Yêu Cầu Chức Năng (Functional Requirements - FRs)

### FR 1.0 - Quản Lý Người Dùng và Hồ Sơ

| ID | Chức Năng | Mô Tả | Vai Trò |
| :--- | :--- | :--- | :--- |
| **FR-1.1** | Đăng ký/Đăng nhập | Hỗ trợ đăng ký/đăng nhập bằng email/mật khẩu. **Loại bỏ đăng nhập qua mạng xã hội.** | All |
| **FR-1.2** | Quản lý Hồ sơ | Cho phép người dùng chỉnh sửa thông tin cá nhân. Mentor có thể cập nhật chi tiết hồ sơ chuyên môn. | All |
| **FR-1.3** | Phân quyền | Hệ thống phải duy trì hai vai trò chính: **Mentor** và **Mentee**. | System |
| **FR-1.4** | Onboarding Mentor | Hồ sơ Mentor sẽ được **tự động đăng công khai** ngay sau khi đăng ký. | System |

### FR 2.0 - Khám Phá Mentor và Trang Hồ Sơ

| ID | Chức Năng | Mô Tả | Vai Trò |
| :--- | :--- | :--- | :--- |
| **FR-2.1** | Trang chủ | Hiển thị danh sách Mentor nổi bật và cơ chế tìm kiếm/lọc. | All |
| **FR-2.2** | Tìm kiếm & Lọc | Cho phép tìm kiếm theo tên, lĩnh vực, chuyên môn. | Mentee |
| **FR-2.3** | Trang Hồ sơ Mentor | Hiển thị chi tiết thông tin Mentor. Bao gồm các tab/phần: **"About Me"** và **"Sessions"** (Lịch sử phiên). | All |
| **FR-2.4** | Nút "Apply" | Nút hành động chính trên trang Hồ sơ, kích hoạt quy trình đăng ký phiên 1:1. | Mentee |

### FR 3.0 - Quy Trình Đăng Ký và Quản Lý Phiên (Session Application & Management)

| ID | Chức Năng | Mô Tả | Vai Trò |
| :--- | :--- | :--- | :--- |
| **FR-3.1** | Form Đăng ký | Mentee điền form chi tiết: Mục tiêu, Câu hỏi cụ thể, và thời gian đề xuất. | Mentee |
| **FR-3.2** | **Tự động Tạo & Chấp nhận Phiên** | Sau khi Mentee gửi form, hệ thống **tự động tạo** một Session mới với trạng thái là **`ACCEPTED`**. | System |
| **FR-3.3** | Thông báo | Gửi thông báo (email và in-app) cho cả hai bên khi Session được tạo thành công. | System |
| **FR-3.4** | Chuyển hướng | Khi Session được tạo, Mentee được chuyển hướng đến trang Quản lý Session, nơi có thể tham gia cuộc gọi. | System |

### FR 4.0 - Quản Lý Phiên Video Trực Tiếp (Live Video Session Management)

#### FR 4.1 - Giai Đoạn Tiền Phiên (Pre-Session)

| ID | Chức Năng | Mô Tả | Vai Trò |
| :--- | :--- | :--- | :--- |
| **FR-4.1.1** | Kiểm tra Thiết bị | Yêu cầu người dùng kiểm tra Camera/Microphone/Loa. | All |
| **FR-4.1.2** | Đồng ý (Consent) | Yêu cầu xác nhận đồng ý với các điều khoản trước khi tham gia. | All |
| **FR-4.1.3** | Nút "Join Session" | Chỉ được kích hoạt sau khi kiểm tra thiết bị thành công và đã đồng ý. | All |

#### FR 4.2 - Phòng Chờ (Waiting Room)

| ID | Chức Năng | Mô Tả | Vai Trò |
| :--- | :--- | :--- | :--- |
| **FR-4.2.1** | Trạng thái Sẵn sàng | Hiển thị trạng thái kết nối của cả hai bên ("2/2 Ready"). | All |
| **FR-4.2.2** | Bắt đầu Phiên | Khi cả hai bên đã sẵn sàng, **chỉ Mentor** mới có thể nhấn nút "Start Session". | Mentor |

#### FR 4.3 - Phiên Hoạt Động (Active Session)

| ID | Chức Năng | Mô Tả | Vai Trò |
| :--- | :--- | :--- | :--- |
| **FR-4.3.1** | Bố cục Video | Hiển thị lưới video 2 người. | All |
| **FR-4.3.2** | Thanh Điều khiển | Cung cấp các nút điều khiển: Tắt/Bật Mic, Tắt/Bật Video, Chia sẻ Màn hình, Kết thúc Phiên. | All |
| **FR-4.3.3** | Chỉ báo | Hiển thị: **Đồng hồ đếm thời gian phiên**, **Chất lượng Kết nối Mạng**. | All |

#### FR 4.4 - Kết Thúc Phiên (End Session)

| ID | Chức Năng | Mô Tả | Vai Trò |
| :--- | :--- | :--- | :--- |
| **FR-4.4.1** | Hành động Kết thúc | Khi người dùng nhấn "End Session", hiển thị modal xác nhận. | All |
| **FR-4.4.2** | Màn hình Tóm tắt | Chuyển hướng đến màn hình Tóm tắt, hiển thị **Thời lượng phiên**. | All |

## 5. Luồng Người Dùng (User Flows)

### 5.1. Luồng Đăng Ký Phiên (Auto-Accept Flow)

| Bước | Hành Động | Hệ Thống Phản Hồi | Trạng Thái Phiên |
| :--- | :--- | :--- | :--- |
| **1** | Mentee truy cập Hồ sơ Mentor và click **"Apply"**. | Hiển thị Form Đăng ký Phiên. | N/A |
| **2** | Mentee điền Form và Gửi. | Gửi yêu cầu đến Backend. | `ACCEPTED` |
| **3** | Hệ thống gửi thông báo cho cả hai bên. | Mentee được chuyển hướng đến trang Session. | `ACCEPTED` |
| **4** | Cả hai người dùng truy cập trang Session. | Hiển thị thông tin phiên và nút **"Join Session"**. | `ACCEPTED` |

## 6. Yêu Cầu Phi Chức Năng (Non-Functional Requirements - NFRs)

(Không thay đổi so với phiên bản trước)

## 7. Yêu Cầu Kỹ Thuật & Tích Hợp (Technical & Integration Requirements)

(Không thay đổi so với phiên bản trước)

## 8. Tiêu Chí Chấp Nhận (Acceptance Criteria)

| ID | Yêu Cầu | Tiêu Chí Chấp Nhận |
| :--- | :--- | :--- |
| **AC-01** | Trang Hồ sơ | Trang Hồ sơ Mentor phải hiển thị đầy đủ thông tin và nút "Apply" phải hoạt động. |
| **AC-02** | Tạo Phiên Tự động | Sau khi Mentee gửi form, một Session phải được **tự động tạo** với trạng thái `Accepted` và hiển thị trên Dashboard của cả hai bên. |
| **AC-03** | Video Call | Người dùng có thể tham gia phòng chờ, kiểm tra thiết bị, và Mentor có thể bắt đầu phiên. Video call 1:1 phải hoạt động ổn định. |
| **AC-04** | Kết thúc Phiên | Khi phiên kết thúc, người dùng phải được chuyển hướng đến màn hình tóm tắt, hiển thị thời lượng phiên. |
| **AC-05** | WCAG Compliance | Hệ thống phải vượt qua kiểm tra tự động và thủ công về khả năng truy cập WCAG 2.1 AA. |

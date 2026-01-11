# Kế Hoạch Triển Khai (Implementation Plan - IP)

## Tên Dự Án: Nền Tảng Kết Nối Mentor-Mentee 1:1 (Project M&M)
**Phiên bản:** 1.0
**Ngày Phát Hành:** 25/12/2025
**Người Soạn Thảo:** Manus (Senior Tech Lead)

---

## 1. Tổng Quan và Mục Tiêu

Tài liệu này phác thảo kế hoạch triển khai chi tiết cho Project M&M, nhằm chuyển đổi các yêu cầu từ BRD và thiết kế từ TDD thành một sản phẩm hoạt động. Kế hoạch này được chia thành các giai đoạn rõ ràng, ưu tiên các tính năng cốt lõi (MVP) để nhanh chóng đạt được khả năng kiểm thử chức năng Live Session.

**Mục tiêu chính của Kế hoạch:**
*   Đảm bảo tính nhất quán giữa BRD, TDD và quá trình phát triển.
*   Phân bổ công việc hiệu quả giữa đội ngũ Frontend và Backend.
*   Tập trung nguồn lực vào tính năng cốt lõi: **Quản lý Phiên và Video Call 1:1**.

## 2. Công Nghệ Sử Dụng (Technology Stack)

| Lớp | Công Nghệ | Mục Đích |
| :--- | :--- | :--- |
| **Frontend** | Next.js/React, TypeScript, TailwindCSS | Xây dựng giao diện người dùng hiện đại, đáp ứng và tuân thủ WCAG. |
| **Backend** | Node.js/Python (hoặc ngôn ngữ phù hợp), REST API | Xử lý logic nghiệp vụ, xác thực, và quản lý dữ liệu. |
| **Database** | **PostgreSQL** | Lưu trữ dữ liệu quan hệ (User, Profile, Session). |
| **Real-time Video** | LiveKit SDK (WebRTC) | Cung cấp chức năng video call 1:1 ổn định và chất lượng cao. |

## 3. Kế Hoạch Triển Khai Theo Giai Đoạn (Phased Implementation)

Dự án được chia thành 4 giai đoạn chính, với tổng thời gian ước tính là **7.5 Tuần** (dựa trên đội ngũ nhỏ, chuyên trách).

| Giai Đoạn | Tên Giai Đoạn | Thời Gian Ước Tính | Mục Tiêu Chính |
| :--- | :--- | :--- | :--- |
| **P1** | **Foundation & Authentication** | 1.5 Tuần | Thiết lập môi trường, cơ sở dữ liệu, và hoàn thành luồng đăng ký/đăng nhập cơ bản. |
| **P2** | **Discovery & Profile** | 2.0 Tuần | Hoàn thành các màn hình công khai (Trang chủ, Hồ sơ Mentor) và quản lý hồ sơ. |
| **P3** | **Session Core & Live Video MVP** | 3.0 Tuần | Triển khai tính năng cốt lõi: Đăng ký phiên (Auto-Accept), Dashboard, và toàn bộ luồng Live Video Call (từ Pre-Check đến End Session). |
| **P4** | **Polish, WCAG & Deployment** | 1.0 Tuần | Tối ưu hóa hiệu suất, đảm bảo tuân thủ WCAG 2.1 AA, và chuẩn bị triển khai. |

## 4. Phân Tích Chi Tiết Công Việc (Detailed Task Breakdown)

Thời gian ước tính được tính bằng **Person-Days (PD)**.

### Giai Đoạn 1: Foundation & Authentication (1.5 Tuần / 7.5 PD)

| ID | Mô Tả Công Việc | Team | Ước Tính (PD) | Liên Kết TDD |
| :--- | :--- | :--- | :--- | :--- |
| **P1.1** | **Setup Project** (Repo, CI/CD, Dev Environment) | BE/FE | 1.0 | N/A |
| **P1.2** | **BE: Database Setup** (PostgreSQL, Schema Migration cho `users`, `mentor_profiles`, `mentor_skills`, `sessions`) | BE | 1.5 | TDD 3.2 |
| **P1.3** | **BE: Authentication API** (Register/Login - Email/Pass) | BE | 1.5 | TDD S-01, S-02 |
| **P1.4** | **FE: Setup Design System** (Tailwind, Typography, Component cơ bản: Button, Card) | FE | 1.5 | BRD NFR 6.4 |
| **P1.5** | **FE: Authentication Screens** (Login/Register UI & Integration) | FE | 2.0 | TDD S-01, S-02 |

### Giai Đoạn 2: Discovery & Profile (2.0 Tuần / 10 PD)

| ID | Mô Tả Công Việc | Team | Ước Tính (PD) | Liên Kết TDD |
| :--- | :--- | :--- | :--- | :--- |
| **P2.1** | **BE: Mentor Profile API** (CRUD cho Profile, Skills) | BE | 2.0 | TDD 3.2 |
| **P2.2** | **BE: Discovery API** (Listing, Search, Filter) | BE | 2.0 | TDD S-03 |
| **P2.3** | **FE: Trang Chủ/Discovery** (UI, Filter/Search Logic & Integration) | FE | 2.5 | TDD S-03 |
| **P2.4** | **FE: Mentor Profile Screen** (UI, Tab "About Me", Integration) | FE | 2.0 | TDD S-04 |
| **P2.5** | **FE: Profile Management** (Form cập nhật thông tin Mentor/Mentee) | FE | 1.5 | TDD S-07 |

### Giai Đoạn 3: Session Core & Live Video MVP (3.0 Tuần / 15 PD)

Đây là giai đoạn quan trọng nhất, tập trung vào tính năng cốt lõi.

| ID | Mô Tả Công Việc | Team | Ước Tính (PD) | Liên Kết TDD |
| :--- | :--- | :--- | :--- | :--- |
| **P3.1** | **BE: Session API** (Endpoint `/sessions/create` - **Auto-Accept Logic**) | BE | 2.0 | BRD FR 3.2 |
| **P3.2** | **BE: LiveKit Integration API** (Endpoint `/join-token`, `/start`, `/end`) | BE | 2.5 | BRD NFR 7.2 |
| **P3.3** | **FE: Session Application Form** (UI & Integration) | FE | 1.5 | TDD S-05 |
| **P3.4** | **FE: Dashboard** (Hiển thị Sessions, Navigation) | FE | 1.5 | TDD S-06 |
| **P3.5** | **FE: LiveKit Setup** (Kết nối SDK, Context/Hooks) | FE | 2.0 | BRD NFR 7.1 |
| **P3.6** | **FE: Pre-Session Check & Waiting Room** (UI & Logic) | FE | 2.0 | TDD S-08, S-09 |
| **P3.7** | **FE: Active Session UI** (Video Grid, Control Bar, Start/End Logic) | FE | 2.5 | TDD S-10, S-11 |
| **P3.8** | **FE: Session Summary Screen** (UI) | FE | 1.0 | TDD S-12 |

### Giai Đoạn 4: Polish, WCAG & Deployment (1.0 Tuần / 5 PD)

| ID | Mô Tả Công Việc | Team | Ước Tính (PD) | Liên Kết TDD |
| :--- | :--- | :--- | :--- | :--- |
| **P4.1** | **FE: WCAG 2.1 AA Compliance** (Keyboard Nav, ARIA Labels, Contrast Check) | FE | 2.5 | BRD NFR 6.1 |
| **P4.2** | **FE: Responsiveness & Final UI Polish** | FE | 1.5 | BRD NFR 6.4 |
| **P4.3** | **BE/FE: Testing & Bug Fixing** (End-to-End Testing) | All | 0.5 | N/A |
| **P4.4** | **Deployment & Monitoring Setup** | BE | 0.5 | N/A |

## 5. Tổng Kết Ước Tính Thời Gian

| Team | Tổng Ước Tính (PD) | Tổng Ước Tính (Tuần) |
| :--- | :--- | :--- |
| **Backend (BE)** | 8.5 PD | ~1.7 Tuần |
| **Frontend (FE)** | 18.0 PD | ~3.6 Tuần |
| **Tổng Cộng** | **26.5 PD** | **~5.3 Tuần** |

*Lưu ý: Ước tính này giả định 1 ngày làm việc = 5 Person-Days (PD) và không bao gồm thời gian chờ đợi, họp hành, hoặc các rủi ro không lường trước. Kế hoạch 7.5 tuần ở mục 3 là khung thời gian an toàn hơn cho toàn bộ dự án.*

## 6. Rủi Ro Tiềm Ẩn và Giảm Thiểu (Risks and Mitigation)

| Rủi Ro | Mức Độ | Chiến Lược Giảm Thiểu |
| :--- | :--- | :--- |
| **R-01** | **Tích hợp LiveKit phức tạp** | Cao | Dành thời gian riêng (P3.5) để nghiên cứu sâu LiveKit SDK. Sử dụng các thư viện React Hooks chính thức để đơn giản hóa. |
| **R-02** | **Tuân thủ WCAG 2.1 AA** | Trung bình | Bắt đầu áp dụng các tiêu chuẩn (Color Contrast, ARIA) ngay từ Giai đoạn 1 (P1.4) và dành một giai đoạn riêng (P4.1) để kiểm tra và sửa lỗi chuyên sâu. |
| **R-03** | **Hiệu suất Video** | Trung bình | Thường xuyên kiểm tra hiệu suất video trên các môi trường mạng khác nhau trong Giai đoạn 3. |
| **R-04** | **Thay đổi yêu cầu** | Thấp | BRD và TDD đã được chốt. Mọi thay đổi tiếp theo sẽ được đánh giá lại về phạm vi và thời gian. |

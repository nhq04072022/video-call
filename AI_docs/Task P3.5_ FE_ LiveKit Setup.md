# Task P3.5: FE: LiveKit Setup

**Mô Tả:** Thiết lập môi trường Frontend để sử dụng LiveKit SDK, bao gồm việc tạo các Context và Hooks cần thiết để quản lý trạng thái kết nối và luồng video.

**Team:** Frontend
**Ước Tính:** 2.0 Person-Days

## Công Việc Cần Thực Hiện

1.  **Cài đặt LiveKit SDK:** Cài đặt thư viện LiveKit Frontend (ví dụ: `livekit-client`, `livekit-react`).
2.  **Tạo LiveKit Context:** Xây dựng một React Context để quản lý kết nối phòng (Room Connection) và trạng thái người tham gia.
3.  **Tạo Custom Hooks:** Xây dựng các hooks để đơn giản hóa việc truy cập trạng thái phòng, danh sách người tham gia, và trạng thái thiết bị (mic/camera).
4.  **Kiểm tra Kết nối Cơ bản:** Viết một component thử nghiệm đơn giản để kết nối vào một phòng LiveKit tĩnh (sử dụng token thử nghiệm) và hiển thị log kết nối thành công.

## Tiêu Chí Hoàn Thành
*   LiveKit SDK được cài đặt và cấu hình thành công.
*   Các hooks và context cần thiết được tạo ra và hoạt động.
*   Component thử nghiệm có thể kết nối và ngắt kết nối khỏi phòng LiveKit.

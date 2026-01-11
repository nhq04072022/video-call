# Hướng Dẫn Setup Database

## Yêu Cầu
- PostgreSQL đã được cài đặt và chạy

## Các Bước Setup

### 1. Tạo Database
```sql
CREATE DATABASE video_call_db;
```

### 2. Chạy Schema
```bash
psql -U postgres -d video_call_db -f src/db/schema.sql
```

Hoặc copy nội dung file `src/db/schema.sql` và chạy trong psql.

### 3. Cấu Hình Connection String
Cập nhật file `.env`:
```
DATABASE_URL=postgresql://username:password@localhost:5432/video_call_db
```

Thay `username` và `password` bằng thông tin PostgreSQL của bạn.

### 4. Test Connection
Sau khi setup, restart backend server và thử đăng ký tài khoản mới.


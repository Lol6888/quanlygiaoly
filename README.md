# Quản lý Giáo lý

Ứng dụng web quản lý lớp giáo lý cho giáo xứ: quản lý học viên (thiếu nhi), lớp học, giáo lý viên, điểm danh, điểm số, và bốc thăm ngẫu nhiên học sinh lên trả bài.

## Công nghệ

- **Backend**: Node.js + Express + SQLite (better-sqlite3), xác thực JWT
- **Frontend**: React + Vite + React Router

## Chức năng

- 🔐 Đăng nhập & phân quyền (Quản trị / Giáo lý viên)
- 👦 Quản lý học viên/thiếu nhi (thêm, sửa, xóa, tìm kiếm, lọc theo lớp)
- 🏫 Quản lý lớp học & phân công giáo lý viên
- ✅ Điểm danh theo lớp và theo ngày (có mặt / vắng / trễ)
- 📊 Nhập & theo dõi điểm số từng học viên
- 🎲 Chọn ngẫu nhiên học sinh lên trả bài (có tùy chọn không lặp lại)
- 🎮 Game học giáo lý *(bổ sung sau)*

## Cài đặt & chạy

Yêu cầu: Node.js >= 18.

```bash
# Cài dependencies cho cả root, server và client
npm run install:all

# Chạy đồng thời backend (cổng 4000) và frontend (cổng 5173)
npm run dev
```

Mở trình duyệt tại http://localhost:5173

### Tài khoản mặc định

Lần chạy đầu tiên, hệ thống tự tạo tài khoản quản trị:

- Tên đăng nhập: `admin`
- Mật khẩu: `admin123`

> Hãy đổi mật khẩu/ tạo tài khoản mới sau khi đăng nhập lần đầu.

## Cấu trúc dự án

```
quanlygiaoly/
├── server/          # API backend (Express + SQLite)
│   └── src/
│       ├── index.js       # điểm khởi động server
│       ├── db.js          # khởi tạo CSDL + seed admin
│       ├── auth.js        # JWT + middleware phân quyền
│       └── routes/        # các endpoint API
└── client/          # Giao diện React (Vite)
    └── src/
        ├── pages/         # các trang chức năng
        ├── components/    # layout dùng chung
        ├── api.js         # cấu hình axios
        └── auth.jsx       # context xác thực
```

## Ghi chú triển khai

- Cơ sở dữ liệu SQLite được lưu tại `server/data/quanlygiaoly.db` (đã bỏ qua trong git).
- Đặt biến môi trường `JWT_SECRET` trong `server/.env` cho môi trường production (xem `server/.env.example`).
- Build frontend: `npm run build` → kết quả tại `client/dist`.

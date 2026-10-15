# RoomConnect

Nền tảng đăng tin cho thuê phòng trọ và diễn đàn cộng đồng.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)

## ✨ Tính năng

### Cho khách (Guest)
- Xem danh sách phòng trọ đã duyệt
- Tìm kiếm theo từ khoá, tỉnh/thành, giá, diện tích, tiện nghi
- Sắp xếp theo mới nhất / giá tăng / giá giảm
- Xem chi tiết phòng, gallery ảnh, thông tin liên hệ

### Cho thành viên (Member)
- Đăng ký, đăng nhập, khôi phục mật khẩu
- Quản lý hồ sơ cá nhân, avatar
- Đăng tin cho thuê, upload tối đa 10 ảnh
- Gửi duyệt, theo dõi trạng thái, sửa bản chỉnh sửa
- Like, favorite, bình luận, báo cáo
- Nhận thông báo realtime khi có tương tác

### Cho Moderator
- Dashboard riêng với queue duyệt bài
- Realtime + âm thanh báo khi có bài pending mới
- Duyệt / từ chối bài kèm lý do
- Duyệt bản chỉnh sửa (revision) của bài đã publish
- Xử lý báo cáo vi phạm

### Cho Admin
- Toàn bộ quyền của Moderator
- Quản lý user: cấp/thu vai trò, ban/unban
- Dashboard thống kê, top tỉnh/thành
- Audit log các hành động quản trị
- Quản lý danh mục tiện nghi

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Validation**: Zod + react-hook-form
- **Icons**: Lucide React
- **Toast**: Sonner

## 🚀 Cài đặt

### Yêu cầu

- Node.js >= 20
- Docker Desktop (cho Supabase Local)
- Git

### Bước 1: Clone repo

```bash
git clone https://github.com/<username>/roomconnect.git
cd roomconnect
```

### Bước 2: Cài dependencies

```bash
npm install
```

### Bước 3: Cấu hình Supabase

**Cách A — Supabase Cloud (khuyến nghị cho production):**

1. Tạo project tại https://supabase.com
2. Vào Project Settings → API → copy `URL` + `anon key`
3. Tạo file `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
4. Push schema lên cloud:
   ```bash
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```

**Cách B — Supabase Local (cho dev offline):**

1. Mở Docker Desktop
2. Chạy:
   ```bash
   npx supabase start
   ```
3. Đợi Supabase khởi động, copy `anon key` từ output
4. Tạo file `.env.local` với URL + anon key local
5. Apply migrations:
   ```bash
   npx supabase db reset
   ```

### Bước 4: Chạy dev

```bash
npm run dev
```

Mở http://localhost:3000

## 📁 Cấu trúc

```
src/
├─ app/                       # Next.js App Router
│  ├─ (auth)/                # Route group cho auth
│  ├─ admin/                 # Dashboard admin
│  ├─ moderator/             # Dashboard mod
│  ├─ phong/                 # Danh sách + chi tiết phòng
│  ├─ tin-moi/               # Form đăng tin
│  ├─ tin-cua-toi/           # Quản lý tin của member
│  ├─ ho-so/                 # Hồ sơ cá nhân
│  ├─ thong-bao/             # Thông báo
│  ├─ auth/callback/         # Route handler cho OAuth
│  └─ layout.tsx             # Root layout
├─ components/
│  ├─ ui/                    # shadcn/ui
│  ├─ layout/                # Header, Footer, UserMenu
│  └─ features/              # PostCard, ...
├─ lib/
│  ├─ actions/               # Server actions
│  ├─ queries/               # Server-side queries
│  ├─ supabase/              # Supabase clients
│  ├─ validations/           # Zod schemas
│  └─ utils/                 # Helpers
└─ types/
   ├─ database.ts            # Sinh từ Supabase
   └─ app.ts                 # Business types

supabase/
├─ migrations/               # SQL migrations
├─ seed.sql                  # Seed data (dev)
└─ config.toml
```

## 🗄️ Database

Schema gồm **15 bảng**:
- `profiles`, `user_roles`, `user_restrictions`
- `posts`, `post_revisions`, `post_images`
- `amenities`, `post_amenities`, `post_reviews`
- `post_likes`, `favorites`, `comments`
- `reports`, `notifications`, `audit_logs`

Chi tiết: xem `docs/02-erd.md` và `docs/03-data-dictionary.md`.

## 🔒 Bảo mật

- **RLS** bật trên tất cả bảng
- **Role-based access**: member / moderator / admin
- **Storage policies**: user chỉ upload/xoá file trong folder của mình
- **Trigger** chặn member tự approve bài mình
- **Audit log** ghi mọi hành động admin/mod

## 📜 Scripts

```bash
npm run dev          # Chạy dev server
npm run build        # Build production
npm run start        # Chạy production server
npm run lint         # ESLint
npx tsc --noEmit     # Type check

# Supabase
npx supabase start   # Chạy local
npx supabase stop    # Tắt local
npx supabase db reset           # Reset DB local
npx supabase db push            # Đẩy migrations lên cloud
npx supabase gen types typescript --linked > src/types/database.ts
```

## 🌐 Deploy Production

### Vercel

1. Push code lên GitHub
2. Vào https://vercel.com → Import project
3. Thêm Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` = domain Vercel
4. Deploy

### Cấu hình Supabase Auth

Sau khi deploy, thêm domain Vercel vào:
- Authentication → URL Configuration → Site URL
- Redirect URLs: `https://your-domain.vercel.app/**`

## 📝 License

MIT
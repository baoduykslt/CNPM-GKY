# RoomConnect — Kế hoạch Giai đoạn 3–10

## Giai đoạn 3 — Schema, Migrations, RLS, Storage

**Mục tiêu:** Database sẵn sàng, RLS khoá chặt, Storage bucket có policy.

**Migrations dự kiến** (đặt trong `supabase/migrations/`):

1. `0001_init_extensions.sql` — bật `pgcrypto`, `citext`.
2. `0002_enums.sql` — tất cả enum types.
3. `0003_tables.sql` — 15+ bảng.
4. `0004_indexes.sql` — index quan trọng.
5. `0005_triggers.sql` — `set_updated_at`, `handle_new_user`, `log_post_status_change`.
6. `0006_rls_policies.sql` — bật RLS + policy cho từng bảng.
7. `0007_storage.sql` — bucket `post-images`, `avatars` + policy.
8. `0008_seed_amenities.sql` — tiện nghi mặc định.
9. `seed.sql` — dữ liệu dev (KHÔNG chạy prod).

**Test:** dùng Supabase Studio xem bảng, chạy query mẫu, test RLS bằng 2 user.

## Giai đoạn 4 — Next.js + Supabase client

**Việc làm:**
- Cài shadcn/ui, Lucide, Zod, `@supabase/supabase-js`, `@supabase/ssr`, `sonner`, `date-fns`.
- Cấu hình `src/lib/supabase/{client,server,middleware}.ts`.
- `.env.local` + `.env.example`.
- Layout cơ bản: Header, Footer.
- Trang `/` tạm hiển thị "RoomConnect đang khởi động".

**Test:** `npm run dev` → mở `localhost:3000` OK.

## Giai đoạn 5 — Auth & Profile

**Việc làm:**
- Trang `/dang-ky`, `/dang-nhap`, `/quen-mat-khau`, `/dat-lai-mat-khau`.
- Middleware bảo vệ route.
- Trang `/ho-so` cho member sửa full_name, phone, avatar, bio.
- Upload avatar lên Storage bucket `avatars`.
- Trigger `handle_new_user` tự tạo profile khi signup.

**Test:** đăng ký → login → logout → sửa profile → upload avatar.

## Giai đoạn 6 — Đăng tin, Upload ảnh, Kiểm duyệt

**Việc làm:**
- `/tin-moi` — form tạo tin (Zod validate).
- `/tin-cua-toi` — danh sách tin của member, filter theo status.
- `/tin-cua-toi/[id]/sua` — sửa tin.
- Upload ảnh lên bucket `post-images`, lưu path vào `post_images`.
- Action server: submit, approve, reject, hide.
- Revision flow cho tin đã published (chỉ text, không ảnh).

**Test:** tạo → gửi → duyệt → thấy trên trang chủ.

## Giai đoạn 7 — Tìm kiếm, Lọc, Chi tiết

**Việc làm:**
- `/` — trang chủ: hero search + danh sách tin mới.
- `/phong` — danh sách + filter (giá, diện tích, tỉnh, tiện nghi, loại).
- `/phong/[slug]` — chi tiết, gallery, liên hệ, nút like/favorite/comment.
- Pagination (dùng cursor hoặc offset).
- SEO metadata.

**Test:** filter, sort, search, responsive mobile.

## Giai đoạn 8 — Tương tác & Thông báo

**Việc làm:**
- Like, favorite (optimistic UI).
- Comment + reply (nested 1 cấp).
- Report dialog.
- Notification: trigger DB khi có sự kiện → insert `notifications`.
- Trang `/thong-bao` với realtime updates.

**Test:** user A comment tin user B → B nhận thông báo realtime.

## Giai đoạn 9 — Dashboard Moderator & Admin

**Việc làm:**
- `/moderator` — queue tin pending (realtime count + âm thanh).
- `/moderator/bao-cao` — queue report.
- `/admin` — dashboard stats.
- `/admin/nguoi-dung` — quản lý user, role, restriction.
- `/admin/tien-nghi` — CRUD amenities.
- `/admin/nhat-ky` — audit logs.
- Nút bật/tắt âm thanh (lưu trong DB hoặc cookie, không localStorage làm nguồn chính).

**Test:** 2 tab — user gửi tin, mod thấy realtime + nghe tiếng.

## Giai đoạn 10 — Test, GitHub, Vercel

**Việc làm:**
- Test RLS với 3 tài khoản (2 member + 1 mod).
- Test upload, rate limit, validation.
- `npm run lint`, `npm run build`.
- README tiếng Việt đầy đủ.
- `.gitignore` chuẩn, không commit `.env.local`.
- Hướng dẫn deploy Vercel + Supabase Cloud.

**Test:** build pass, deploy staging chạy được.
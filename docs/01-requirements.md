# RoomConnect — Yêu cầu nghiệp vụ

## 1. Tổng quan

RoomConnect là nền tảng web cho thuê phòng trọ và diễn đàn cộng đồng.
Người dùng có thể: tìm phòng, đăng tin cho thuê, tương tác (like, comment,
favorite), báo cáo nội dung xấu. Hệ thống có kiểm duyệt trước khi tin được
xuất bản, đảm bảo chất lượng và giảm lừa đảo.

## 2. Vai trò

| Vai trò | Mô tả | Nguồn |
|---|---|---|
| Guest | Khách chưa đăng nhập | Mặc định |
| Member | Người dùng đã đăng ký | Đăng ký tự do |
| Moderator | Kiểm duyệt viên | Admin cấp |
| Admin | Quản trị viên toàn hệ thống | Seed / Admin khác cấp |

Một user có thể có nhiều vai trò (bảng `user_roles`, hỗ trợ n-n).
Quyền hạn = hợp (union) của tất cả vai trò.

## 3. User Stories

### 3.1. Guest

- **G-01**: Là Guest, tôi muốn xem danh sách tin đã duyệt và còn hiệu lực,
  để tìm phòng phù hợp.
  - AC: Chỉ hiện tin `status = 'published'` và `expires_at > now()` và
    `availability_status = 'available'`.
- **G-02**: Là Guest, tôi muốn tìm kiếm theo từ khóa (tiêu đề, mô tả, địa chỉ).
  - AC: Từ khóa ≥ 2 ký tự, tìm kiếm không phân biệt hoa thường.
- **G-03**: Là Guest, tôi muốn lọc theo tỉnh/thành, phường/xã, giá, diện tích,
  loại phòng, tiện nghi, trạng thái.
- **G-04**: Là Guest, tôi muốn sắp xếp theo mới nhất / giá tăng / giá giảm.
- **G-05**: Là Guest, tôi muốn xem chi tiết tin: gallery ảnh, mô tả đầy đủ,
  tiện nghi, ngày đăng, thông tin liên hệ công khai.
- **G-06**: Là Guest, khi bấm thích / lưu / bình luận / liên hệ, tôi được
  yêu cầu đăng nhập.

### 3.2. Member

**Tài khoản & hồ sơ**
- **M-01**: Đăng ký bằng email + mật khẩu.
  - AC: Email hợp lệ, mật khẩu ≥ 8 ký tự, xác nhận email (tuỳ cấu hình Auth).
- **M-02**: Đăng nhập, đăng xuất.
- **M-03**: Khôi phục mật khẩu qua email.
- **M-04**: Cập nhật hồ sơ: họ tên, SĐT, avatar, bio.
  - AC: Không được đổi `id`, không được tự đổi vai trò.

**Đăng tin**
- **M-05**: Tạo tin mới, lưu nháp (`status = 'draft'`).
- **M-06**: Upload nhiều ảnh (tối đa 10 ảnh, mỗi ảnh ≤ 5MB, JPEG/PNG/WebP).
- **M-07**: Gửi tin để kiểm duyệt (`draft` → `pending`).
  - AC: Chỉ gửi khi có ≥ 1 ảnh, tiêu đề ≥ 10 ký tự, mô tả ≥ 30 ký tự,
    giá > 0, diện tích > 0, có tỉnh/thành và phường/xã.
- **M-08**: Sửa tin.
  - Nếu tin đang `draft` hoặc `rejected`: sửa trực tiếp, gửi lại khi sẵn sàng.
  - Nếu tin đang `published`: sửa → tạo **bản chỉnh sửa** (revision) ở trạng
    thái `pending`. Tin gốc **vẫn public** nội dung cũ cho tới khi bản chỉnh
    sửa được duyệt. Nếu bị từ chối, nội dung cũ vẫn giữ nguyên.
  - **Lưu ý**: Không cho sửa ảnh khi tin đã `published`. Muốn đổi ảnh phải
    xoá tin cũ + tạo tin mới.
- **M-09**: Xem trạng thái tin và lý do từ chối (nếu có).
- **M-10**: Đánh dấu tin đã cho thuê (`availability_status = 'rented'`) hoặc
  ngừng cho thuê (`availability_status = 'hidden'`).
- **M-11**: Xoá mềm tin của mình (set `deleted_at`).

**Tương tác**
- **M-12**: Thả tim / bỏ tim tin (`post_likes`, unique user-post).
- **M-13**: Lưu / bỏ lưu tin vào yêu thích (`favorites`, unique user-post).
- **M-14**: Bình luận tin, trả lời bình luận (nested 1 cấp qua `parent_id`).
- **M-15**: Sửa / xoá mềm bình luận của mình.
- **M-16**: Báo cáo tin / bình luận (chọn lý do, mô tả tuỳ chọn).

**Thông báo**
- **M-17**: Nhận thông báo khi: tin được duyệt, tin bị từ chối (kèm lý do),
  có bình luận mới vào tin của mình, có reply vào bình luận của mình,
  có người like tin mình (tuỳ chọn), báo cáo của mình được xử lý.
- **M-18**: Xem danh sách thông báo, đánh dấu đã đọc / tất cả đã đọc.

**Thống kê**
- **M-19**: Xem số lượt xem, tim, favorite, bình luận cho từng tin của mình.

### 3.3. Moderator

- **MOD-01**: Xem hàng đợi tin `pending` (realtime).
  - AC: Chỉ user có role `moderator` hoặc `admin` truy cập được.
- **MOD-02**: Duyệt tin → `published`, set `published_at`, `expires_at`
  (mặc định +30 ngày).
- **MOD-03**: Từ chối tin kèm lý do (bắt buộc) → `rejected`.
- **MOD-04**: Ẩn tin đã public vi phạm → `availability_status = 'hidden'`
  hoặc `status = 'archived'` (tuỳ mức độ).
- **MOD-05**: Duyệt / từ chối **bản chỉnh sửa** của tin đã published.
- **MOD-06**: Xử lý báo cáo: xem, ghi chú, đánh dấu đã xử lý / bỏ qua.
- **MOD-07**: Xem lịch sử kiểm duyệt (`post_reviews`).

**Moderator KHÔNG có quyền:**
- Đổi vai trò user khác.
- Xoá vĩnh viễn tin / user.
- Tạo user mới.
- Truy cập trang quản trị user (chỉ xem công khai).

### 3.4. Admin

Kế thừa toàn bộ quyền Moderator, cộng thêm:

- **A-01**: Quản lý user: xem, tìm kiếm, cấp/thu vai trò, vô hiệu hoá.
- **A-02**: Hạn chế user: cấm đăng tin / cấm đăng nhập / khoá toàn bộ,
  có thời hạn hoặc vĩnh viễn (`user_restrictions`).
- **A-03**: Quản lý tiện nghi: thêm / sửa / ẩn `amenities`.
- **A-04**: Tạo tin thay mặt hệ thống (author là chính admin, có badge "Ban QT").
- **A-05**: Xoá cứng tin / bình luận khi thật cần thiết (có xác nhận).
- **A-06**: Xem dashboard thống kê: số user, số tin theo trạng thái, số báo
  cáo đang chờ, top tỉnh/thành có nhiều tin.
- **A-07**: Xem `audit_logs` — nhật ký mọi hành động quản trị.
- **A-08**: Mọi hành động nguy hiểm (xoá cứng, khoá user, đổi vai trò) phải
  có **hộp thoại xác nhận nhập chữ** (ví dụ gõ "XOA" hoặc tên user).

## 4. Business Rules

| ID | Quy tắc |
|---|---|
| BR-01 | Tin chỉ được hiển thị public khi `status = 'published'`, `expires_at > now()`, `availability_status = 'available'`, `deleted_at IS NULL`. |
| BR-02 | Member chỉ sửa/xoá tin của mình. |
| BR-03 | Member không được tự chuyển `status` sang `published`. Chỉ `pending → published/rejected` do moderator/admin thực hiện. |
| BR-04 | Tin đã published khi sửa **field quan trọng** (tiêu đề, mô tả, giá, diện tích, địa chỉ) → bản sửa vào `post_revisions`, bản gốc vẫn hiển thị đến khi duyệt. **Ảnh không được sửa khi đã published.** |
| BR-05 | Một user có thể có nhiều role. Khi check quyền, dùng union. |
| BR-06 | Mỗi user chỉ like 1 lần / 1 tin, favorite 1 lần / 1 tin (unique constraint). |
| BR-07 | Bình luận nested tối đa 1 cấp (reply của reply sẽ gắn vào cha gốc). |
| BR-08 | Ảnh: tối đa 10 ảnh / tin, mỗi ảnh ≤ 5MB, định dạng JPEG/PNG/WebP. |
| BR-09 | Tin hết hạn (`expires_at < now()`) tự động không còn hiển thị public; member có thể gia hạn (tạo revision mới hoặc action "gia hạn"). |
| BR-10 | User bị `post_ban` không thể tạo/gửi tin trong thời hạn. |
| BR-11 | User bị `login_ban` bị chặn đăng nhập. |
| BR-12 | Mọi thao tác admin/mod đều ghi vào `audit_logs`. |
| BR-13 | Xoá mềm = set `deleted_at`. Xoá cứng = chỉ admin, có xác nhận. |
| BR-14 | Rate limit: tối đa 5 tin / ngày / user; 20 bình luận / giờ / user. |
| BR-15 | Giá thuê đơn vị VNĐ, lưu dạng `bigint`, hiển thị format "3.500.000 đ". |

## 5. Acceptance Criteria mẫu cho luồng kiểm duyệt

**Luồng happy path:**
1. Member tạo tin → `draft`.
2. Member upload 3 ảnh → `post_images` có 3 dòng, storage path hợp lệ.
3. Member bấm "Gửi duyệt" → `status = 'pending'`, `submitted_at = now()`.
4. Moderator thấy tin trong queue (realtime).
5. Moderator duyệt → `status = 'published'`, `published_at = now()`,
   `expires_at = now() + 30 ngày`.
6. Tin hiện trên trang chủ.
7. Member nhận thông báo "Tin đã được duyệt".

**Luồng từ chối:**
1–4 tương tự.
5. Moderator từ chối kèm lý do "Ảnh mờ, thiếu thông tin địa chỉ".
6. `status = 'rejected'`, `post_reviews` ghi 1 dòng.
7. Member nhận thông báo kèm lý do, có thể sửa và gửi lại.
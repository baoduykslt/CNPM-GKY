# RoomConnect — Data Dictionary

Quy ước chung:
- Mọi bảng có `created_at timestamptz NOT NULL DEFAULT now()`.
- Bảng có `updated_at` dùng trigger `set_updated_at()`.
- UUID dùng `gen_random_uuid()` (có sẵn từ PG 13+).

## 1. profiles

| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | uuid | NO | — | PK, = auth.users.id |
| username | text | NO | — | Unique, 3–30 ký tự, lowercase |
| full_name | text | YES | — | Họ tên |
| phone | text | YES | — | SĐT, regex VN |
| avatar_url | text | YES | — | URL ảnh đại diện |
| bio | text | YES | — | Giới thiệu ngắn ≤ 500 ký tự |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | Trigger |

Constraint: `username ~ '^[a-z0-9_]{3,30}$'`.

## 2. user_roles

| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | — | FK profiles.id |
| role | app_role | NO | — | member/moderator/admin |
| granted_by | uuid | YES | — | FK profiles.id |
| granted_at | timestamptz | NO | now() | |

Unique: `(user_id, role)`.

## 3. user_restrictions

| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | — | FK profiles.id |
| restriction_type | restriction_type | NO | — | post_ban/login_ban/full_ban |
| reason | text | NO | — | Lý do |
| starts_at | timestamptz | NO | now() | |
| ends_at | timestamptz | YES | — | NULL = vĩnh viễn |
| created_by | uuid | YES | — | FK profiles.id |
| created_at | timestamptz | NO | now() | |

Check: `ends_at IS NULL OR ends_at > starts_at`.

## 4. posts

| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK |
| author_id | uuid | NO | — | FK profiles.id |
| title | text | NO | — | 10–200 ký tự |
| description | text | NO | — | ≥ 30 ký tự |
| price | bigint | NO | — | VNĐ/tháng, > 0 |
| area | numeric(6,2) | NO | — | m², > 0 |
| address | text | NO | — | Số nhà, đường |
| province | text | NO | — | Tỉnh/thành |
| ward | text | NO | — | Phường/xã |
| room_type | room_type | NO | — | |
| status | post_status | NO | 'draft' | |
| availability_status | availability_status | NO | 'available' | |
| view_count | int | NO | 0 | |
| submitted_at | timestamptz | YES | — | Lần gửi duyệt gần nhất |
| published_at | timestamptz | YES | — | |
| expires_at | timestamptz | YES | — | |
| deleted_at | timestamptz | YES | — | Soft delete |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | Trigger |

Check: `price > 0`, `area > 0`, `char_length(title) BETWEEN 10 AND 200`,
`char_length(description) >= 30`.

## 5. post_revisions

Lưu **bản chỉnh sửa** của tin đã published. Khi member sửa field văn bản quan
trọng, tạo 1 dòng revision `pending`. Tin gốc vẫn public nội dung cũ. Khi duyệt
revision → copy nội dung revision vào post, xoá revision.

**Lưu ý:** Revision chỉ chứa text fields. Ảnh không được sửa khi tin đã published.

| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK |
| post_id | uuid | NO | — | FK posts.id |
| title | text | NO | — | |
| description | text | NO | — | |
| price | bigint | NO | — | |
| area | numeric(6,2) | NO | — | |
| address | text | NO | — | |
| province | text | NO | — | |
| ward | text | NO | — | |
| room_type | room_type | NO | — | |
| status | revision_status | NO | 'pending' | |
| reviewer_id | uuid | YES | — | FK profiles.id |
| review_note | text | YES | — | Lý do từ chối |
| created_at | timestamptz | NO | now() | |
| reviewed_at | timestamptz | YES | — | |

## 6. post_images

| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK |
| post_id | uuid | NO | — | FK posts.id |
| storage_path | text | NO | — | Đường dẫn trong bucket `post-images` |
| alt_text | text | YES | — | Alt SEO/a11y |
| sort_order | int | NO | 0 | Thứ tự hiển thị |
| created_at | timestamptz | NO | now() | |

## 7. amenities

| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK |
| name | text | NO | — | Tên hiển thị, unique |
| slug | text | NO | — | Unique, dùng URL/lọc |
| icon | text | YES | — | Tên icon Lucide |
| category | text | YES | — | Nhóm (tiện ích, an ninh…) |
| is_active | boolean | NO | true | |
| created_at | timestamptz | NO | now() | |

## 8. post_amenities

| Cột | Kiểu | Null | Default |
|---|---|---|---|
| post_id | uuid | NO | — |
| amenity_id | uuid | NO | — |

PK: `(post_id, amenity_id)`. FK CASCADE cả 2 chiều.

## 9. post_reviews

| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK |
| post_id | uuid | NO | — | FK posts.id |
| revision_id | uuid | YES | — | FK post_revisions.id (nếu review revision) |
| moderator_id | uuid | YES | — | FK profiles.id |
| action | review_action | NO | — | |
| reason | text | YES | — | Bắt buộc nếu action = rejected |
| created_at | timestamptz | NO | now() | |

## 10. post_likes

| Cột | Kiểu | Null | Default |
|---|---|---|---|
| user_id | uuid | NO | — |
| post_id | uuid | NO | — |
| created_at | timestamptz | NO | now() |

PK: `(user_id, post_id)`.

## 11. favorites

| Cột | Kiểu | Null | Default |
|---|---|---|---|
| user_id | uuid | NO | — |
| post_id | uuid | NO | — |
| created_at | timestamptz | NO | now() |

PK: `(user_id, post_id)`.

## 12. comments

| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK |
| post_id | uuid | NO | — | FK posts.id |
| author_id | uuid | YES | — | FK profiles.id, SET NULL khi user xoá |
| parent_id | uuid | YES | — | FK comments.id |
| content | text | NO | — | 1–1000 ký tự |
| is_hidden | boolean | NO | false | Mod ẩn |
| deleted_at | timestamptz | YES | — | Soft delete |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | Trigger |

## 13. reports

| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK |
| reporter_id | uuid | YES | — | FK profiles.id, SET NULL |
| target_type | report_target | NO | — | post/comment/user |
| target_id | uuid | NO | — | ID đối tượng bị báo cáo |
| reason | text | NO | — | Lý do ngắn |
| description | text | YES | — | Mô tả thêm |
| status | report_status | NO | 'pending' | |
| resolved_by | uuid | YES | — | FK profiles.id |
| resolved_at | timestamptz | YES | — | |
| resolution_note | text | YES | — | |
| created_at | timestamptz | NO | now() | |

## 14. notifications

| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | — | FK profiles.id |
| type | notification_type | NO | — | |
| title | text | NO | — | |
| message | text | YES | — | |
| link | text | YES | — | Deep link nội bộ |
| is_read | boolean | NO | false | |
| created_at | timestamptz | NO | now() | |

## 15. audit_logs

| Cột | Kiểu | Null | Default | Mô tả |
|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK |
| actor_id | uuid | YES | — | FK profiles.id, SET NULL |
| action | text | NO | — | VD: 'post.approve', 'user.ban' |
| target_type | text | YES | — | 'post' / 'user' / 'comment' |
| target_id | uuid | YES | — | |
| metadata | jsonb | YES | — | Chi tiết thay đổi |
| ip_address | inet | YES | — | |
| created_at | timestamptz | NO | now() | |
-- =====================================================================
-- RoomConnect - Migration 0008
-- Mục đích: Seed danh mục tiện nghi mặc định
-- Idempotent: dùng ON CONFLICT để chạy lại không lỗi
-- =====================================================================

INSERT INTO public.amenities (name, slug, icon, category) VALUES
  -- Tiện ích cơ bản
  ('Wifi',              'wifi',              'wifi',         'tien-ich'),
  ('Điều hoà',          'dieu-hoa',          'snowflake',    'tien-ich'),
  ('Nóng lạnh',         'nong-lanh',         'shower-head',  'tien-ich'),
  ('Tủ lạnh',           'tu-lanh',           'refrigerator', 'tien-ich'),
  ('Máy giặt',          'may-giat',          'washing-machine', 'tien-ich'),
  ('Bếp nấu ăn',        'bep-nau-an',        'cooking-pot',  'tien-ich'),
  ('Tivi',              'tivi',              'tv',           'tien-ich'),
  ('Máy lạnh',          'may-lanh',          'air-vent',     'tien-ich'),

  -- Nội thất
  ('Giường',            'giuong',            'bed',          'noi-that'),
  ('Tủ quần áo',        'tu-quan-ao',        'shirt',        'noi-that'),
  ('Bàn làm việc',      'ban-lam-viec',      'lamp-desk',    'noi-that'),
  ('Ghế',               'ghe',               'armchair',     'noi-that'),

  -- An ninh
  ('Camera an ninh',    'camera-an-ninh',    'cctv',         'an-ninh'),
  ('Bảo vệ 24/7',       'bao-ve-24-7',       'shield',       'an-ninh'),
  ('Khoá vân tay',      'khoa-van-tay',      'fingerprint',  'an-ninh'),
  ('Cổng khoá',         'cong-khoa',         'door-closed',  'an-ninh'),

  -- Môi trường
  ('Chỗ đậu xe',        'cho-dau-xe',        'bike',         'moi-truong'),
  ('Ban công',          'ban-cong',          'building',     'moi-truong'),
  ('Cửa sổ thoáng',     'cua-so-thoang',     'wind',         'moi-truong'),
  ('Sân thượng',        'san-thuong',        'sun',          'moi-truong'),

  -- Dịch vụ
  ('Điện nước giá dân', 'dien-nuoc-gia-dan', 'zap',          'dich-vu'),
  ('Dọn vệ sinh',       'don-ve-sinh',       'sparkles',     'dich-vu'),
  ('Giữ xe miễn phí',   'giu-xe-mien-phi',   'car',          'dich-vu')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================================
-- Kết thúc migration 0008
-- 23 tiện nghi mặc định
-- =====================================================================
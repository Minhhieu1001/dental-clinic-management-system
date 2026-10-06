-- =========================================================================
-- SQL INSERT DATA FOR POSTGRESQL (DENTAL CLINIC PROMOTIONS)
-- Crown Dental - 11 chương trình ưu đãi đa dạng chuẩn Entity Model
-- =========================================================================

-- 0. Xóa dữ liệu ưu đãi cũ
DELETE FROM promotion_services;
DELETE FROM promotions;

-- ── Ưu đãi 1: Niềng răng trẻ em - Giảm 10% (Mã: KIDDENTAL10) ──
WITH inserted_promo AS (
  INSERT INTO promotions (
    id, title, coupon_code, category, description, image_url, 
    promotion_type, discount_percent, discount_amount, max_discount_amount, 
    usage_limit, used_count, status, created_at, start_date, end_date
  )
  VALUES (
    gen_random_uuid(),
    'Gói can thiệp sớm các lệch lạc tiền tăng trưởng - 2 năm',
    'KIDDENTAL10',
    'Niềng răng trẻ em',
    'Can thiệp sớm các lệch lạc răng mặt ở trẻ em giúp định hướng xương hàm phát triển hài hòa, tạo khoảng trống cho răng vĩnh viễn mọc đúng vị trí. Giảm thiểu tối đa việc phải nhổ răng hay phẫu thuật xương hàm sau này. Gói điều trị 2 năm toàn diện.',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
    'DISCOUNT_PERCENT', 10.00, 0.00, 1000000.00, 100, 0, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days'
  ) RETURNING id
)
INSERT INTO promotion_services (id, promotion_id, service_id)
SELECT gen_random_uuid(), inserted_promo.id, services.id
FROM inserted_promo, services WHERE services.service_name = 'Gói can thiệp sớm các lệch lạc tiền tăng trưởng - 2 năm (Trẻ em)';

-- ── Ưu đãi 2: ClearCorrect bổ sung - Giảm 20% (Mã: CLEAR20) ──
WITH inserted_promo AS (
  INSERT INTO promotions (
    id, title, coupon_code, category, description, image_url, 
    promotion_type, discount_percent, discount_amount, max_discount_amount, 
    usage_limit, used_count, status, created_at, start_date, end_date
  )
  VALUES (
    gen_random_uuid(),
    'Khay ClearCorrect bổ sung - Tinh chỉnh hoàn hảo',
    'CLEAR20',
    'Niềng răng ClearCorrect',
    'Khay ClearCorrect bổ sung thiết kế riêng để tinh chỉnh và hoàn thiện các bước dịch chuyển răng cuối cùng. Đảm bảo kết quả nụ cười hoàn hảo nhất sau liệu trình chính. Ưu đãi áp dụng cho khách hàng đang điều trị tại Crown Dental.',
    'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=800&q=80',
    'DISCOUNT_PERCENT', 20.00, 0.00, 2000000.00, 100, 0, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days'
  ) RETURNING id
)
INSERT INTO promotion_services (id, promotion_id, service_id)
SELECT gen_random_uuid(), inserted_promo.id, services.id
FROM inserted_promo, services WHERE services.service_name = 'Niềng răng trong suốt ClearCorrect';

-- ── Ưu đãi 3: Hàm duy trì ClearCorrect - Giảm 20% (Mã: RETAIN20) ──
WITH inserted_promo AS (
  INSERT INTO promotions (
    id, title, coupon_code, category, description, image_url, 
    promotion_type, discount_percent, discount_amount, max_discount_amount, 
    usage_limit, used_count, status, created_at, start_date, end_date
  )
  VALUES (
    gen_random_uuid(),
    'Hàm duy trì ClearCorrect - Ổn định kết quả niềng răng',
    'RETAIN20',
    'Niềng răng ClearCorrect',
    'Hàm duy trì ClearCorrect quan trọng sau khi kết thúc chỉnh nha, ổn định vị trí răng trong 6-12 tháng. Vật liệu cao cấp, trong suốt, thoải mái khi đeo và dễ vệ sinh. An toàn tiêu chuẩn y tế quốc tế.',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=800&q=80',
    'DISCOUNT_PERCENT', 20.00, 0.00, 1500000.00, 100, 0, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days'
  ) RETURNING id
)
INSERT INTO promotion_services (id, promotion_id, service_id)
SELECT gen_random_uuid(), inserted_promo.id, services.id
FROM inserted_promo, services WHERE services.service_name = 'Niềng răng trong suốt ClearCorrect';

-- ── Ưu đãi 4: Invisalign bổ sung - Giảm 20% (Mã: INVIS20) ──
WITH inserted_promo AS (
  INSERT INTO promotions (
    id, title, coupon_code, category, description, image_url, 
    promotion_type, discount_percent, discount_amount, max_discount_amount, 
    usage_limit, used_count, status, created_at, start_date, end_date
  )
  VALUES (
    gen_random_uuid(),
    'Khay Invisalign bổ sung - Hoàn thiện nụ cười',
    'INVIS20',
    'Niềng răng trong suốt Invisalign',
    'Khay Invisalign bổ sung tinh chỉnh các dịch chuyển răng nhỏ chưa đạt yêu cầu sau đợt khay chính thức. Công nghệ ClinCheck 3D theo dõi từng bước, đảm bảo hàm răng đạt độ đều khít hoàn hảo.',
    'https://images.unsplash.com/photo-1513415277900-a62401e5084d?auto=format&fit=crop&w=800&q=80',
    'DISCOUNT_PERCENT', 20.00, 0.00, 3000000.00, 100, 0, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days'
  ) RETURNING id
)
INSERT INTO promotion_services (id, promotion_id, service_id)
SELECT gen_random_uuid(), inserted_promo.id, services.id
FROM inserted_promo, services WHERE services.service_name = 'Invisalign Lite (<= 14 khay)';

-- ── Ưu đãi 5: Invisalign toàn hàm - Giảm 15% (Mã: INVIS15) ──
WITH inserted_promo AS (
  INSERT INTO promotions (
    id, title, coupon_code, category, description, image_url, 
    promotion_type, discount_percent, discount_amount, max_discount_amount, 
    usage_limit, used_count, status, created_at, start_date, end_date
  )
  VALUES (
    gen_random_uuid(),
    'Ưu đãi Niềng răng Invisalign - Hệ thống số 1 thế giới',
    'INVIS15',
    'Niềng răng trong suốt Invisalign',
    'Niềng răng Invisalign công nghệ khay trong suốt nhập khẩu từ Mỹ, điều trị cá nhân hóa 100% bằng phần mềm ClinCheck 3D. Ưu đãi 15% nhân dịp kỷ niệm thành lập Crown Dental. Crown là Red Diamond Invisalign Provider - cấp cao nhất toàn cầu.',
    'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=800&q=80',
    'DISCOUNT_PERCENT', 15.00, 0.00, 5000000.00, 100, 0, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '45 days'
  ) RETURNING id
)
INSERT INTO promotion_services (id, promotion_id, service_id)
SELECT gen_random_uuid(), inserted_promo.id, services.id
FROM inserted_promo, services WHERE services.service_name = 'Invisalign Lite (<= 14 khay)';

-- ── Ưu đãi 6: Răng sứ Veneer - Giảm 25% (Mã: VENEER25) ──
WITH inserted_promo AS (
  INSERT INTO promotions (
    id, title, coupon_code, category, description, image_url, 
    promotion_type, discount_percent, discount_amount, max_discount_amount, 
    usage_limit, used_count, status, created_at, start_date, end_date
  )
  VALUES (
    gen_random_uuid(),
    'Răng sứ Veneer thẩm mỹ - Nụ cười rạng rỡ tức thì',
    'VENEER25',
    'Răng sứ thẩm mỹ',
    'Mặt dán sứ Veneer siêu mỏng chỉ 0.3-0.5mm, bảo tồn tối đa men răng thật. Nụ cười trắng sáng, tự nhiên và bền bỉ đến 15-20 năm. Ưu đãi 25% nhân dịp mùa cưới, áp dụng cho khách hàng đặt lịch trong tháng.',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=800&q=80',
    'DISCOUNT_PERCENT', 25.00, 0.00, 3000000.00, 100, 0, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '45 days'
  ) RETURNING id
)
INSERT INTO promotion_services (id, promotion_id, service_id)
SELECT gen_random_uuid(), inserted_promo.id, services.id
FROM inserted_promo, services WHERE services.service_name = 'Mặt dán sứ Veneer e.max siêu mỏng';

-- ── Ưu đãi 7: Trồng răng Implant - Giảm 10% (Mã: IMPLANT10) ──
WITH inserted_promo AS (
  INSERT INTO promotions (
    id, title, coupon_code, category, description, image_url, 
    promotion_type, discount_percent, discount_amount, max_discount_amount, 
    usage_limit, used_count, status, created_at, start_date, end_date
  )
  VALUES (
    gen_random_uuid(),
    'Trồng răng Implant - Phục hồi hoàn hảo như răng thật',
    'IMPLANT10',
    'Cấy ghép Implant',
    'Cấy ghép Implant phục hồi toàn diện cả chân răng và thân răng, ăn nhai thoải mái và thẩm mỹ tự nhiên. Ưu đãi 10% cho khách hàng cấy ghép 2 trụ trở lên. Trụ Implant nhập khẩu chính hãng, bảo hành 10 năm.',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80',
    'DISCOUNT_PERCENT', 10.00, 0.00, 4000000.00, 100, 0, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '60 days'
  ) RETURNING id
)
INSERT INTO promotion_services (id, promotion_id, service_id)
SELECT gen_random_uuid(), inserted_promo.id, services.id
FROM inserted_promo, services WHERE services.service_name = 'Implant Osstem (Hàn Quốc)';

-- ── Ưu đãi 8: Tẩy trắng răng Zoom 2 - Giảm 30% (Mã: ZOOM30) ──
WITH inserted_promo AS (
  INSERT INTO promotions (
    id, title, coupon_code, category, description, image_url, 
    promotion_type, discount_percent, discount_amount, max_discount_amount, 
    usage_limit, used_count, status, created_at, start_date, end_date
  )
  VALUES (
    gen_random_uuid(),
    'Tẩy trắng răng Zoom 2 - Sáng lên 8 tông chỉ trong 45 phút',
    'ZOOM30',
    'Tẩy trắng răng',
    'Công nghệ Zoom Laser thế hệ mới, nâng tông răng 8 tông sau 1 lần 45 phút. An toàn tuyệt đối cho men răng, không ê buốt. Ưu đãi 30% cho khách hàng mới trong tháng. Tặng kèm bộ tẩy trắng tại nhà miễn phí.',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
    'DISCOUNT_PERCENT', 30.00, 0.00, 1000000.00, 100, 0, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days'
  ) RETURNING id
)
INSERT INTO promotion_services (id, promotion_id, service_id)
SELECT gen_random_uuid(), inserted_promo.id, services.id
FROM inserted_promo, services WHERE services.service_name = 'Tẩy trắng răng Zoom 2 (Mỹ)';

-- ── Ưu đãi 9: Voucher giảm 200k trực tiếp (Mã: SUMMER200K) ──
WITH inserted_promo AS (
  INSERT INTO promotions (
    id, title, coupon_code, category, description, image_url, 
    promotion_type, discount_percent, discount_amount, max_discount_amount, 
    usage_limit, used_count, status, created_at, start_date, end_date
  )
  VALUES (
    gen_random_uuid(),
    'Voucher Mùa Hè - Giảm trực tiếp 200.000đ',
    'SUMMER200K',
    'Khám & Điều trị',
    'Voucher giảm trực tiếp 200.000đ cho mọi hóa đơn dịch vụ thanh toán tại Crown Dental trong mùa hè này. Áp dụng cho tất cả dịch vụ nha khoa.',
    'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=800&q=80',
    'VOUCHER', 0.00, 200000.00, 200000.00, 500, 0, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '60 days'
  ) RETURNING id
)
INSERT INTO promotion_services (id, promotion_id, service_id)
SELECT gen_random_uuid(), inserted_promo.id, services.id
FROM inserted_promo, services WHERE services.service_name = 'Khám răng tổng quát & tư vấn chuyên sâu';

-- ── Ưu đãi 10: Giảm 10% Tổng Hóa Đơn (Mã: DENTAL10) ──
WITH inserted_promo AS (
  INSERT INTO promotions (
    id, title, coupon_code, category, description, image_url, 
    promotion_type, discount_percent, discount_amount, max_discount_amount, 
    usage_limit, used_count, status, created_at, start_date, end_date
  )
  VALUES (
    gen_random_uuid(),
    'Ưu Đãi Khách Hàng Thân Thiết - Giảm 10% Hóa Đơn',
    'DENTAL10',
    'Khám & Điều trị',
    'Ưu đãi 10% cho khách hàng sử dụng dịch vụ nha khoa tổng quát và chỉnh nha tại nha khoa Crown Dental. Tối đa 500.000đ.',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
    'DISCOUNT_PERCENT', 10.00, 0.00, 500000.00, 500, 0, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '90 days'
  ) RETURNING id
)
INSERT INTO promotion_services (id, promotion_id, service_id)
SELECT gen_random_uuid(), inserted_promo.id, services.id
FROM inserted_promo, services WHERE services.service_name = 'Khám răng tổng quát & tư vấn chuyên sâu';

-- ── Ưu đãi 11: Ưu đãi VIP Member - Giảm 15% (Mã: VIPMEM) ──
WITH inserted_promo AS (
  INSERT INTO promotions (
    id, title, coupon_code, category, description, image_url, 
    promotion_type, discount_percent, discount_amount, max_discount_amount, 
    usage_limit, used_count, status, created_at, start_date, end_date
  )
  VALUES (
    gen_random_uuid(),
    'Ưu đãi Thành viên VIP - Giảm 15% Hóa Đơn',
    'VIPMEM',
    'Khám & Điều trị',
    'Ưu đãi dành riêng cho khách hàng VIP của nha khoa Crown Dental. Giảm 15% tổng hóa đơn thanh toán các dịch vụ, tối đa 1.000.000đ.',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
    'DISCOUNT_PERCENT', 15.00, 0.00, 1000000.00, 200, 0, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '90 days'
  ) RETURNING id
)
INSERT INTO promotion_services (id, promotion_id, service_id)
SELECT gen_random_uuid(), inserted_promo.id, services.id
FROM inserted_promo, services WHERE services.service_name = 'Nhổ răng khôn mọc lệch bằng Piezotome';

-- =========================================================================
-- Kiểm tra kết quả
-- =========================================================================
SELECT 
  p.coupon_code AS ma_voucher,
  p.title,
  p.category,
  p.promotion_type,
  p.discount_percent || '%' AS discount_pct,
  TO_CHAR(p.discount_amount, 'FM999,999,999') || 'd' AS discount_amt,
  TO_CHAR(p.max_discount_amount, 'FM999,999,999') || 'd' AS max_discount,
  TO_CHAR(p.end_date, 'DD/MM/YYYY') AS het_han
FROM promotions p
ORDER BY p.coupon_code;

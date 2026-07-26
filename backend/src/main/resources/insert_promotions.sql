-- =========================================================================
-- SQL INSERT DATA FOR POSTGRESQL (DENTAL CLINIC PROMOTIONS)
-- Crown Dental - 10 chương trình ưu đãi đa dạng
-- =========================================================================

-- 0. Xóa dữ liệu ưu đãi cũ
DELETE FROM promotion_services;
DELETE FROM promotions;

-- ── Ưu đãi 1: Niềng răng trẻ em - Giảm 10% ──
WITH inserted_promo AS (
  INSERT INTO promotions (id, title, category, description, image_url, discount_percent, start_date, end_date)
  VALUES (
    gen_random_uuid(),
    'Gói can thiệp sớm các lệch lạc tiền tăng trưởng - 2 năm',
    'Niềng răng trẻ em',
    'Can thiệp sớm các lệch lạc răng mặt ở trẻ em giúp định hướng xương hàm phát triển hài hòa, tạo khoảng trống cho răng vĩnh viễn mọc đúng vị trí. Giảm thiểu tối đa việc phải nhổ răng hay phẫu thuật xương hàm sau này. Gói điều trị 2 năm toàn diện.',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
    10.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days'
  ) RETURNING id
)
INSERT INTO promotion_services (id, promotion_id, service_id)
SELECT gen_random_uuid(), inserted_promo.id, services.id
FROM inserted_promo, services WHERE services.service_name = 'Niềng răng trẻ em';

-- ── Ưu đãi 2: ClearCorrect bổ sung - Giảm 20% ──
WITH inserted_promo AS (
  INSERT INTO promotions (id, title, category, description, image_url, discount_percent, start_date, end_date)
  VALUES (
    gen_random_uuid(),
    'Khay ClearCorrect bổ sung - Tinh chỉnh hoàn hảo',
    'Niềng răng ClearCorrect',
    'Khay ClearCorrect bổ sung thiết kế riêng để tinh chỉnh và hoàn thiện các bước dịch chuyển răng cuối cùng. Đảm bảo kết quả nụ cười hoàn hảo nhất sau liệu trình chính. Ưu đãi áp dụng cho khách hàng đang điều trị tại Crown Dental.',
    'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=800&q=80',
    20.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days'
  ) RETURNING id
)
INSERT INTO promotion_services (id, promotion_id, service_id)
SELECT gen_random_uuid(), inserted_promo.id, services.id
FROM inserted_promo, services WHERE services.service_name = 'Niềng răng ClearCorrect bổ sung';

-- ── Ưu đãi 3: Hàm duy trì ClearCorrect - Giảm 20% ──
WITH inserted_promo AS (
  INSERT INTO promotions (id, title, category, description, image_url, discount_percent, start_date, end_date)
  VALUES (
    gen_random_uuid(),
    'Hàm duy trì ClearCorrect - Ổn định kết quả niềng răng',
    'Niềng răng ClearCorrect',
    'Hàm duy trì ClearCorrect quan trọng sau khi kết thúc chỉnh nha, ổn định vị trí răng trong 6-12 tháng. Vật liệu cao cấp, trong suốt, thoải mái khi đeo và dễ vệ sinh. An toàn tiêu chuẩn y tế quốc tế.',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=800&q=80',
    20.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days'
  ) RETURNING id
)
INSERT INTO promotion_services (id, promotion_id, service_id)
SELECT gen_random_uuid(), inserted_promo.id, services.id
FROM inserted_promo, services WHERE services.service_name = 'Niềng răng ClearCorrect duy trì';

-- ── Ưu đãi 4: Invisalign bổ sung - Giảm 20% ──
WITH inserted_promo AS (
  INSERT INTO promotions (id, title, category, description, image_url, discount_percent, start_date, end_date)
  VALUES (
    gen_random_uuid(),
    'Khay Invisalign bổ sung - Hoàn thiện nụ cười',
    'Niềng răng trong suốt Invisalign',
    'Khay Invisalign bổ sung tinh chỉnh các dịch chuyển răng nhỏ chưa đạt yêu cầu sau đợt khay chính thức. Công nghệ ClinCheck 3D theo dõi từng bước, đảm bảo hàm răng đạt độ đều khít hoàn hảo.',
    'https://images.unsplash.com/photo-1513415277900-a62401e5084d?auto=format&fit=crop&w=800&q=80',
    20.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days'
  ) RETURNING id
)
INSERT INTO promotion_services (id, promotion_id, service_id)
SELECT gen_random_uuid(), inserted_promo.id, services.id
FROM inserted_promo, services WHERE services.service_name = 'Niềng răng Invisalign bổ sung';

-- ── Ưu đãi 5: Invisalign toàn hàm - Giảm 15% ──
WITH inserted_promo AS (
  INSERT INTO promotions (id, title, category, description, image_url, discount_percent, start_date, end_date)
  VALUES (
    gen_random_uuid(),
    'Ưu đãi Niềng răng Invisalign - Hệ thống số 1 thế giới',
    'Niềng răng trong suốt Invisalign',
    'Niềng răng Invisalign công nghệ khay trong suốt nhập khẩu từ Mỹ, điều trị cá nhân hóa 100% bằng phần mềm ClinCheck 3D. Ưu đãi 15% nhân dịp kỷ niệm thành lập Crown Dental. Crown là Red Diamond Invisalign Provider - cấp cao nhất toàn cầu.',
    'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=800&q=80',
    15.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '45 days'
  ) RETURNING id
)
INSERT INTO promotion_services (id, promotion_id, service_id)
SELECT gen_random_uuid(), inserted_promo.id, services.id
FROM inserted_promo, services WHERE services.service_name = 'Niềng răng Invisalign';

-- ── Ưu đãi 6: Răng sứ Veneer - Giảm 25% ──
WITH inserted_promo AS (
  INSERT INTO promotions (id, title, category, description, image_url, discount_percent, start_date, end_date)
  VALUES (
    gen_random_uuid(),
    'Răng sứ Veneer thẩm mỹ - Nụ cười rạng rỡ tức thì',
    'Răng sứ thẩm mỹ',
    'Mặt dán sứ Veneer siêu mỏng chỉ 0.3-0.5mm, bảo tồn tối đa men răng thật. Nụ cười trắng sáng, tự nhiên và bền bỉ đến 15-20 năm. Ưu đãi 25% nhân dịp mùa cưới, áp dụng cho khách hàng đặt lịch trong tháng.',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=800&q=80',
    25.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '45 days'
  ) RETURNING id
)
INSERT INTO promotion_services (id, promotion_id, service_id)
SELECT gen_random_uuid(), inserted_promo.id, services.id
FROM inserted_promo, services WHERE services.service_name = 'Răng sứ Veneer';

-- ── Ưu đãi 7: Trồng răng Implant - Giảm 10% ──
WITH inserted_promo AS (
  INSERT INTO promotions (id, title, category, description, image_url, discount_percent, start_date, end_date)
  VALUES (
    gen_random_uuid(),
    'Trồng răng Implant - Phục hồi hoàn hảo như răng thật',
    'Cấy ghép Implant',
    'Cấy ghép Implant phục hồi toàn diện cả chân răng và thân răng, ăn nhai thoải mái và thẩm mỹ tự nhiên. Ưu đãi 10% cho khách hàng cấy ghép 2 trụ trở lên. Trụ Implant nhập khẩu chính hãng, bảo hành 10 năm.',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80',
    10.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '60 days'
  ) RETURNING id
)
INSERT INTO promotion_services (id, promotion_id, service_id)
SELECT gen_random_uuid(), inserted_promo.id, services.id
FROM inserted_promo, services WHERE services.service_name = 'Trồng răng Implant';

-- ── Ưu đãi 8: Tẩy trắng răng Zoom 2 - Giảm 30% ──
WITH inserted_promo AS (
  INSERT INTO promotions (id, title, category, description, image_url, discount_percent, start_date, end_date)
  VALUES (
    gen_random_uuid(),
    'Tẩy trắng răng Zoom 2 - Sáng lên 8 tông chỉ trong 45 phút',
    'Tẩy trắng răng',
    'Công nghệ Zoom Laser thế hệ mới, nâng tông răng 8 tông sau 1 lần 45 phút. An toàn tuyệt đối cho men răng, không ê buốt. Ưu đãi 30% cho khách hàng mới trong tháng. Tặng kèm bộ tẩy trắng tại nhà miễn phí.',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
    30.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days'
  ) RETURNING id
)
INSERT INTO promotion_services (id, promotion_id, service_id)
SELECT gen_random_uuid(), inserted_promo.id, services.id
FROM inserted_promo, services WHERE services.service_name = 'Tẩy trắng răng Zoom 2';

-- ── Ưu đãi 9: Khám tổng quát gia đình - Giảm 50% ──
WITH inserted_promo AS (
  INSERT INTO promotions (id, title, category, description, image_url, discount_percent, start_date, end_date)
  VALUES (
    gen_random_uuid(),
    'Khám răng tổng quát - Ưu đãi đặc biệt cho gia đình',
    'Khám & Điều trị',
    'Khám răng tổng quát bao gồm: chụp X-quang, lấy cao răng, kiểm tra sâu răng và tư vấn điều trị. Ưu đãi 50% cho gói gia đình từ 3 người trở lên. Phát hiện sớm các vấn đề răng miệng, tiết kiệm chi phí điều trị.',
    'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=800&q=80',
    50.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '45 days'
  ) RETURNING id
)
INSERT INTO promotion_services (id, promotion_id, service_id)
SELECT gen_random_uuid(), inserted_promo.id, services.id
FROM inserted_promo, services WHERE services.service_name = 'Khám răng tổng quát';

-- ── Ưu đãi 10: Nhổ răng khôn - Giảm 15% ──
WITH inserted_promo AS (
  INSERT INTO promotions (id, title, category, description, image_url, discount_percent, start_date, end_date)
  VALUES (
    gen_random_uuid(),
    'Nhổ răng khôn không đau - Hồi phục nhanh trong 24h',
    'Khám & Điều trị',
    'Nhổ răng khôn bằng máy siêu âm Piezotome thế hệ mới, không đau, không sưng, lành thương trong 24-48 giờ. Giảm 15% cho khách hàng nhổ đồng thời 2 răng khôn. Bác sĩ chuyên khoa phẫu thuật miệng thực hiện.',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
    15.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '60 days'
  ) RETURNING id
)
INSERT INTO promotion_services (id, promotion_id, service_id)
SELECT gen_random_uuid(), inserted_promo.id, services.id
FROM inserted_promo, services WHERE services.service_name = 'Nhổ răng khôn';

-- =========================================================================
-- Kiểm tra kết quả
-- =========================================================================
SELECT 
  p.title,
  p.category,
  p.discount_percent || '%' AS discount,
  TO_CHAR(p.end_date, 'DD/MM/YYYY') AS het_han,
  s.service_name,
  TO_CHAR(s.price, 'FM999,999,999') || 'd' AS gia_goc,
  TO_CHAR(s.price * (1 - p.discount_percent / 100), 'FM999,999,999') || 'd' AS gia_uu_dai
FROM promotions p
LEFT JOIN promotion_services ps ON ps.promotion_id = p.id
LEFT JOIN services s ON s.id = ps.service_id
ORDER BY p.discount_percent DESC;


-- ============================================================
-- data.sql — Dữ liệu mẫu tự động cho Nha khoa Crown Dental
-- Spring Boot chạy file này tự động mỗi lần khởi động
-- Dùng ON CONFLICT DO NOTHING để tránh lỗi trùng dữ liệu
-- ============================================================

-- Cho phép lưu ảnh dạng data URL/Base64 từ giao diện quản trị
ALTER TABLE clinics ALTER COLUMN logo_url TYPE TEXT;
ALTER TABLE clinics ALTER COLUMN image TYPE TEXT;
ALTER TABLE branches ALTER COLUMN image_branch TYPE TEXT;

-- Cập nhật check constraint cho bảng tooth_records và diagnoses hỗ trợ enum Level mới
ALTER TABLE tooth_records DROP CONSTRAINT IF EXISTS tooth_records_severity_check;
ALTER TABLE tooth_records ADD CONSTRAINT tooth_records_severity_check
    CHECK (severity IS NULL OR severity IN ('ENAMEL', 'DENTIN', 'NEAR_PULP', 'PULP', 'MILD', 'MODERATE', 'SEVERE'));

ALTER TABLE tooth_records DROP CONSTRAINT IF EXISTS tooth_records_caries_location_check;
ALTER TABLE tooth_records ADD CONSTRAINT tooth_records_caries_location_check
    CHECK (caries_location IS NULL OR caries_location IN ('OCCLUSAL', 'MESIAL', 'DISTAL', 'BUCCAL', 'LINGUAL', 'PALATAL', 'CERVICAL', 'WHOLE_CROWN'));

ALTER TABLE tooth_records DROP CONSTRAINT IF EXISTS tooth_records_tooth_status_check;

ALTER TABLE diagnoses DROP CONSTRAINT IF EXISTS diagnoses_level_check;
ALTER TABLE diagnoses ADD CONSTRAINT diagnoses_level_check
    CHECK (level IS NULL OR level IN ('ENAMEL', 'DENTIN', 'NEAR_PULP', 'PULP', 'MILD', 'MODERATE', 'SEVERE'));

-- Bỏ unique constraint trên examination_result_id để hỗ trợ quan hệ 1-N giữa ExaminationResult và Diagnosis
ALTER TABLE diagnoses DROP CONSTRAINT IF EXISTS diagnoses_examination_result_id_key;

-- Đảm bảo quan hệ 1-1 giữa ExaminationResult và TreatmentPlans
ALTER TABLE treatment_plans ADD COLUMN IF NOT EXISTS examination_result_id UUID;
CREATE UNIQUE INDEX IF NOT EXISTS uk_treatment_plans_examination_result ON treatment_plans (examination_result_id);
-- Tự động cập nhật các cột mới nếu chưa tồn tại
ALTER TABLE services ADD COLUMN IF NOT EXISTS service_code VARCHAR(50);
ALTER TABLE services ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE services ADD COLUMN IF NOT EXISTS sub_category VARCHAR(255);
ALTER TABLE services ADD COLUMN IF NOT EXISTS unit VARCHAR(100);
ALTER TABLE services ADD COLUMN IF NOT EXISTS warranty_period VARCHAR(100);
ALTER TABLE services ADD COLUMN IF NOT EXISTS image_url VARCHAR(1000);
ALTER TABLE services ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

UPDATE services SET is_active = true WHERE is_active IS NULL;

-- ============================================================
-- BẢNG 1: SERVICES (Dịch vụ nha khoa)
-- ============================================================
INSERT INTO services (id, service_name, description, price, category, sub_category, unit, image_url, sort_order, is_featured)
VALUES

  -- ── NIỀNG RĂNG MẮC CÀI KIM LOẠI ─────────────────────────
  (
    'c3b2f674-d4b9-4a06-a795-9bf8b5c907a1',
    'Mắc cài kim loại tiêu chuẩn',
    'Phương pháp niềng răng truyền thống sử dụng mắc cài kim loại cao cấp và dây cung. Hiệu quả cao, bền bỉ và phù hợp cho hầu hết các ca lệch lạc từ trung bình đến phức tạp.',
    25000000.00, 'NIENG_RANG', 'Niềng răng mắc cài kim loại', 'Cả 2 hàm',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80', 1, true
  ),
  (
    'e290f674-d4b9-4a06-a795-9bf8b5c907a2',
    'Mắc cài kim loại tự buộc (Damon)',
    'Hệ thống mắc cài tự đóng thông minh giúp giảm tối đa lực ma sát lên răng, giảm ê nhức đáng kể và rút ngắn tổng thời gian đeo niềng từ 4-6 tháng.',
    35000000.00, 'NIENG_RANG', 'Niềng răng mắc cài kim loại', 'Cả 2 hàm',
    'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=600&q=80', 2, true
  ),
  (
    'f1a3f674-d4b9-4a06-a795-9bf8b5c907a3',
    'Niềng răng mắc cài kim loại trẻ em',
    'Thiết kế mắc cài nhỏ gọn phù hợp với kích thước răng trẻ em từ 8-14 tuổi. Giúp định hướng răng vĩnh viễn mọc đều đẹp ngay từ giai đoạn sớm.',
    20000000.00, 'NIENG_RANG', 'Niềng răng mắc cài kim loại', 'Cả 2 hàm',
    'https://images.unsplash.com/photo-1513415277900-a62401e5084d?auto=format&fit=crop&w=600&q=80', 3, false
  ),
  (
    'a982f674-e3c9-4b17-b806-ab8c9c0d11f1',
    'Gói can thiệp sớm các lệch lạc tiền tăng trưởng - 2 năm (Trẻ em)',
    'Can thiệp sớm các lệch lạc răng mặt ở trẻ em giúp định hướng xương hàm phát triển hài hòa, tạo khoảng trống cho răng vĩnh viễn mọc đúng vị trí, giảm thiểu tối đa việc phải nhổ răng hay phẫu thuật xương hàm sau này.',
    17000000.00, 'NIENG_RANG', 'Niềng răng mắc cài kim loại', 'Gói 2 năm',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80', 4, true
  ),

  -- ── NIỀNG RĂNG MẮC CÀI SỨ ───────────────────────────────
  (
    'd4b4f674-d4b9-4a06-a795-9bf8b5c907a4',
    'Mắc cài sứ tiêu chuẩn',
    'Mắc cài làm bằng chất liệu sứ cao cấp trùng tông màu răng thật, mang lại tính thẩm mỹ cao giúp khách hàng tự tin giao tiếp trong suốt quá trình niềng.',
    32000000.00, 'NIENG_RANG', 'Niềng răng mắc cài sứ', 'Cả 2 hàm',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80', 5, false
  ),
  (
    'a101f674-f2a9-4c28-c917-bc9d9c0e21a1',
    'Mắc cài sứ tự buộc',
    'Sự kết hợp hoàn hảo giữa tính thẩm mỹ của chất liệu sứ cao cấp và sự tiện lợi của cơ chế nắp đóng tự buộc Damon.',
    42000000.00, 'NIENG_RANG', 'Niềng răng mắc cài sứ', 'Cả 2 hàm',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80', 6, true
  ),

  -- ── NIỀNG RĂNG TRONG SUỐT INVISALIGN ────────────────────
  (
    'b202f674-f2a9-4c28-c917-bc9d9c0e22b2',
    'Invisalign Lite (<= 14 khay)',
    'Phương pháp niềng răng trong suốt không mắc cài của Mỹ. Thích hợp cho các ca răng thưa, lệch lạc nhẹ hoặc khách hàng cần căn chỉnh lại sau khi niềng.',
    55000000.00, 'NIENG_RANG', 'Niềng răng trong suốt Invisalign', 'Cả 2 hàm',
    'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=600&q=80', 7, false
  ),
  (
    'e606f674-f2a9-4c28-c917-bc9d9c0e26f7',
    'Gói niềng trong suốt Essentials by Invisalign',
    'Gói niềng răng trong suốt Invisalign cơ bản bao gồm bộ khay niềng thiết kế riêng, hỗ trợ dịch chuyển các ca răng khấp khểnh nhẹ.',
    65000000.00, 'NIENG_RANG', 'Niềng răng trong suốt Invisalign', 'Trọn gói',
    'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=600&q=80', 8, true
  ),
  (
    'c303f674-f2a9-4c28-c917-bc9d9c0e23c3',
    'Invisalign Moderate',
    'Gói niềng răng Invisalign phổ thông phù hợp với các ca răng khấp khểnh ở mức độ trung bình. Cần từ 15 đến 26 khay điều trị.',
    70000000.00, 'NIENG_RANG', 'Niềng răng trong suốt Invisalign', 'Cả 2 hàm',
    'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=600&q=80', 9, true
  ),
  (
    'e606f674-f2a9-4c28-c917-bc9d9c0e26f8',
    'Gói niềng trong suốt Invisalign Comprehensive 5 năm',
    'Gói niềng răng trong suốt Invisalign toàn diện nhất, hỗ trợ điều trị và tinh chỉnh không giới hạn khay trong vòng 5 năm.',
    130000000.00, 'NIENG_RANG', 'Niềng răng trong suốt Invisalign', 'Trọn gói 5 năm',
    'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=600&q=80', 10, true
  ),
  (
    'e505f674-f2a9-4c28-c917-bc9d9c0e25e5',
    'Niềng răng trong suốt ClearCorrect',
    'Thương hiệu khay niềng trong suốt cao cấp từ tập đoàn Straumann (Thụy Sĩ). Vật liệu ComfortTrack siêu đàn hồi, ôm sát nướu răng và thẩm mỹ tối đa.',
    45000000.00, 'NIENG_RANG', 'Niềng răng trong suốt Invisalign', 'Cả 2 hàm',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80', 11, false
  ),
  (
    'f606f674-f2a9-4c28-c917-bc9d9c0e26f6',
    'Hàm duy trì sau niềng',
    'Hàm duy trì trong suốt tháo lắp giúp ổn định xương ổ răng và nướu sau khi kết thúc liệu trình niềng răng, ngăn ngừa răng chạy lại vị trí cũ.',
    5000000.00, 'NIENG_RANG', 'Niềng răng trong suốt Invisalign', 'Cả 2 hàm',
    'https://images.unsplash.com/photo-1513415277900-a62401e5084d?auto=format&fit=crop&w=600&q=80', 12, false
  ),

  -- ── TRỒNG RĂNG IMPLANT ────────────────────────────────────
  (
    '1a01f674-e3c9-4b17-b806-ab8c9c0d31a1',
    'Implant Osstem (Hàn Quốc)',
    'Dòng trụ Implant quốc dân có doanh số hàng đầu châu Á. Tỷ lệ tích hợp xương cao, thiết kế ren xoắn thông minh.',
    19000000.00, 'IMPLANT', 'Trụ Implant theo hãng', '/trụ',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80', 13, true
  ),
  (
    '2b02f674-e3c9-4b17-b806-ab8c9c0d32b2',
    'Implant Zimmer Biomet (Mỹ)',
    'Dòng trụ phân khúc cao cấp của Mỹ, công nghệ Trabecular Metal giúp tế bào xương phát triển nhanh vào sâu thân trụ.',
    32000000.00, 'IMPLANT', 'Trụ Implant theo hãng', '/trụ',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80', 14, false
  ),
  (
    '3c03f674-e3c9-4b17-b806-ab8c9c0d33c3',
    'Implant Straumann SLA (Thụy Sĩ)',
    'Thương hiệu Implant số 1 thế giới đến từ Thụy Sĩ. Bề mặt SLA rút ngắn thời gian tích hợp xương chỉ còn 6-8 tuần.',
    35000000.00, 'IMPLANT', 'Trụ Implant theo hãng', '/trụ',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80', 15, true
  ),
  (
    '4d04f674-e3c9-4b17-b806-ab8c9c0d34d4',
    'Implant Nobel Active (Thụy Điển)',
    'Trụ Implant cao cấp thiết kế cho xương hàm mỏng hoặc cấy ghép phục hình chịu lực tức thì ngay sau khi nhổ răng.',
    38000000.00, 'IMPLANT', 'Trụ Implant theo hãng', '/trụ',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80', 16, true
  ),
  (
    '5e05f674-e3c9-4b17-b806-ab8c9c0d35e5',
    'Răng sứ Zirconia trên Implant',
    'Mão răng toàn sứ Zirconia lắp trên trụ phục hình qua khớp nối Abutment. Không đen viền nướu, màu sắc tự nhiên hoàn hảo.',
    6000000.00, 'IMPLANT', 'Phục hình trên Implant', '/răng',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80', 17, false
  ),
  (
    '6f06f674-e3c9-4b17-b806-ab8c9c0d36f6',
    'Cầu răng sứ trên 2 Implant',
    'Giải pháp kinh tế phục hình mất 3-4 răng liền kề bằng cách cấy 2 trụ Implant nâng đỡ cầu răng sứ bên trên.',
    16000000.00, 'IMPLANT', 'Phục hình trên Implant', '/cầu',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80', 18, false
  ),
  (
    '7a07f674-e3c9-4b17-b806-ab8c9c0d37a7',
    'Phục hình toàn hàm All-on-4',
    'Cấy ghép 4 trụ Implant nâng đỡ toàn bộ cung răng giả 12 răng. Giải pháp tối ưu cho người mất răng toàn hàm hoặc tiêu xương nặng.',
    120000000.00, 'IMPLANT', 'Phục hình trên Implant', '/hàm',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80', 19, true
  ),
  (
    '8b08f674-e3c9-4b17-b806-ab8c9c0d38b8',
    'Phục hình toàn hàm All-on-6',
    'Cấy ghép 6 trụ Implant tăng cường lực ăn nhai cho cung hàm lớn hoặc xương hàm có mật độ xốp.',
    145000000.00, 'IMPLANT', 'Phục hình trên Implant', '/hàm',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80', 20, false
  ),

  -- ── RĂNG SỨ THẨM MỸ ──────────────────────────────────────
  (
    '1a01f674-4b9a-4c28-c917-bc9d9c0e31a1',
    'Sứ kim loại tiêu chuẩn',
    'Răng sứ có cấu tạo sườn kim loại bên trong và phủ lớp sứ ceramco bên ngoài. Độ bền ăn nhai tốt, chi phí tiết kiệm.',
    2000000.00, 'RANG_SU', 'Răng sứ kim loại', '/răng',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80', 21, false
  ),
  (
    '2b02f674-4b9a-4c28-c917-bc9d9c0e32b2',
    'Sứ kim loại Titan cao cấp',
    'Sườn bằng hợp kim Titan y tế sinh học lành tính, giảm kích ứng nướu và tăng tuổi thọ sử dụng.',
    3500000.00, 'RANG_SU', 'Răng sứ kim loại', '/răng',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80', 22, false
  ),
  (
    '3c03f674-4b9a-4c28-c917-bc9d9c0e33c3',
    'Sứ Cercon (Đức)',
    'Dòng răng toàn sứ cao cấp Đức bằng Zirconia nguyên khối. Độ thấu quang cao, không đen viền nướu.',
    6500000.00, 'RANG_SU', 'Răng sứ toàn sứ (Ceramic)', '/răng',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80', 23, true
  ),
  (
    '4d04f674-4b9a-4c28-c917-bc9d9c0e34d4',
    'Sứ e.max (Thụy Sĩ)',
    'Sứ thủy tinh e.max nguyên khối có độ trong mờ tự nhiên như răng thật. Khả năng chịu lực uốn xuất sắc lên tới 400 MPa.',
    8500000.00, 'RANG_SU', 'Răng sứ toàn sứ (Ceramic)', '/răng',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80', 24, true
  ),
  (
    '5e05f674-4b9a-4c28-c917-bc9d9c0e35e5',
    'Sứ Zirconia nguyên khối',
    'Chế tác bằng công nghệ CAD/CAM. Độ cứng siêu việt lên đến 1200 MPa, thích hợp phục hình răng hàm chịu lực lớn.',
    7000000.00, 'RANG_SU', 'Răng sứ toàn sứ (Ceramic)', '/răng',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80', 25, false
  ),
  (
    '6f06f674-4b9a-4c28-c917-bc9d9c0e36f6',
    'Mặt dán sứ Veneer Composite',
    'Cải thiện thẩm mỹ nụ cười nhanh chóng bằng cách phủ lớp nhựa composite thẩm mỹ lên bề mặt răng thật.',
    3000000.00, 'RANG_SU', 'Răng Veneer thẩm mỹ', '/răng',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80', 26, false
  ),
  (
    '7a07f674-4b9a-4c28-c917-bc9d9c0e37a7',
    'Mặt dán sứ Veneer e.max siêu mỏng',
    'Mặt dán sứ siêu mỏng chỉ từ 0.3mm - 0.5mm, bảo tồn 100% tủy răng và hạn chế tối đa mài răng thật.',
    9000000.00, 'RANG_SU', 'Răng Veneer thẩm mỹ', '/răng',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80', 27, true
  ),

  -- ── TẨY TRẮNG RĂNG ───────────────────────────────────────
  (
    '1a01f674-1234-4c28-c917-bc9d9c0e41a1',
    'Tẩy trắng răng đèn Plasma',
    'Ánh sáng xanh Plasma hoạt hóa gel tẩy trắng. Hiệu quả nhanh sau 60 phút tại phòng khám.',
    1500000.00, 'TAY_TRANG', 'Tẩy trắng tại phòng khám', '/lần',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80', 28, false
  ),
  (
    '2b02f674-1234-4c28-c917-bc9d9c0e42b2',
    'Gói tẩy trắng Laser Whitening trọn gói',
    'Bước sóng Laser phá hủy phân tử tạo màu tận sâu ngà răng, kết hợp máng và gel tẩy trắng duy trì tại nhà.',
    2500000.00, 'TAY_TRANG', 'Tẩy trắng tại phòng khám', 'Liệu trình',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80', 29, true
  ),
  (
    '3c03f674-1234-4c28-c917-bc9d9c0e43c3',
    'Tẩy trắng răng Zoom 2 (Mỹ)',
    'Hệ thống tẩy trắng hàng đầu Hoa Kỳ với đèn Zoom phát nhiệt thấp. Nâng tông tối đa từ 6-8 cấp độ sáng an toàn.',
    3500000.00, 'TAY_TRANG', 'Tẩy trắng tại phòng khám', '/lần',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80', 30, true
  ),
  (
    '4d04f674-1234-4c28-c917-bc9d9c0e44d4',
    'Bộ máng tẩy trắng tại nhà',
    'Máng nhựa dẻo ôm khít răng kèm thuốc tẩy trắng nồng độ nhẹ. Tiện lợi tự tẩy tại nhà.',
    800000.00, 'TAY_TRANG', 'Tẩy trắng tại nhà', '/bộ',
    'https://images.unsplash.com/photo-1513415277900-a62401e5084d?auto=format&fit=crop&w=600&q=80', 31, false
  ),
  (
    '5e05f674-1234-4c28-c917-bc9d9c0e45e5',
    'Gel tẩy trắng bổ sung Opalescence',
    'Tuýp gel tẩy trắng chính hãng Opalescence (Mỹ) nồng độ 10%-20% dùng tra thêm vào máng duy trì tẩy trắng định kỳ.',
    250000.00, 'TAY_TRANG', 'Tẩy trắng tại nhà', '/tuýp',
    'https://images.unsplash.com/photo-1513415277900-a62401e5084d?auto=format&fit=crop&w=600&q=80', 32, false
  ),

  -- ── KHÁM & ĐIỀU TRỊ TỔNG QUÁT ───────────────────────────
  (
    '1a01f674-5678-4c28-c917-bc9d9c0e51a1',
    'Khám răng tổng quát & tư vấn chuyên sâu',
    'Kiểm tra toàn diện sức khỏe răng miệng: khám lợi, kiểm tra sâu răng, phát hiện bệnh lý nha chu. Miễn phí.',
    0.00, 'KHAM_DIEU_TRI', 'Khám & Chẩn đoán', '/lần',
    'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=600&q=80', 33, true
  ),
  (
    '2b02f674-5678-4c28-c917-bc9d9c0e52b2',
    'Chụp X-quang toàn cảnh Panorama',
    'Máy chụp kỹ thuật số hiện đại khảo sát toàn bộ cấu trúc xương hàm, răng và dây thần kinh.',
    200000.00, 'KHAM_DIEU_TRI', 'Khám & Chẩn đoán', '/lần',
    'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=600&q=80', 34, false
  ),
  (
    '3c03f674-5678-4c28-c917-bc9d9c0e53c3',
    'Chụp X-quang CBCT 3D khảo sát xương',
    'Công nghệ cắt lớp vi tính 3D chi tiết xương hàm, phục vụ cấy ghép Implant và nhổ răng khôn lệch.',
    450000.00, 'KHAM_DIEU_TRI', 'Khám & Chẩn đoán', '/lần',
    'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=600&q=80', 35, false
  ),
  (
    '4d04f674-5678-4c28-c917-bc9d9c0e54d4',
    'Lấy cao răng siêu âm & đánh bóng',
    'Đầu rung siêu âm loại bỏ hoàn toàn mảng bám dưới nướu gây viêm lợi, kết hợp đánh bóng bột nha khoa cao cấp.',
    300000.00, 'KHAM_DIEU_TRI', 'Điều trị cơ bản', '/lần',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80', 36, true
  ),
  (
    '5e05f674-5678-4c28-c917-bc9d9c0e55e5',
    'Trám răng thẩm mỹ Composite',
    'Trám khôi phục hình dạng răng sâu nhẹ bằng chất liệu Composite đồng màu răng, hóa cứng bằng đèn Halogen.',
    400000.00, 'KHAM_DIEU_TRI', 'Điều trị cơ bản', '/răng',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80', 37, false
  ),
  (
    '6f06f674-5678-4c28-c917-bc9d9c0e56f6',
    'Điều trị tủy răng (Nội nha)',
    'Loại bỏ tủy răng viêm nhiễm, làm sạch ống tủy và trám bít kín. Bảo tồn tối đa cấu trúc răng thật.',
    1200000.00, 'KHAM_DIEU_TRI', 'Điều trị cơ bản', '/răng',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80', 38, false
  ),
  (
    '7a07f674-5678-4c28-c917-bc9d9c0e57a7',
    'Nhổ răng thường lung lay',
    'Nhổ răng nhẹ nhàng cho răng sữa đến tuổi thay hoặc răng vĩnh viễn lung lay nặng do viêm nha chu.',
    200000.00, 'KHAM_DIEU_TRI', 'Điều trị cơ bản', '/răng',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80', 39, false
  ),
  (
    '8b08f674-5678-4c28-c917-bc9d9c0e58b8',
    'Nhổ răng khôn mọc lệch bằng Piezotome',
    'Công nghệ sóng siêu âm Piezotome không gây tổn thương mô mềm, hạn chế đau đớn, sưng nề và lành thương siêu tốc.',
    1500000.00, 'KHAM_DIEU_TRI', 'Điều trị cơ bản', '/răng',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80', 40, true
  )

ON CONFLICT (id) DO UPDATE SET
  service_name  = EXCLUDED.service_name,
  description   = EXCLUDED.description,
  price         = EXCLUDED.price,
  category      = EXCLUDED.category,
  sub_category  = EXCLUDED.sub_category,
  unit          = EXCLUDED.unit,
  image_url     = EXCLUDED.image_url,
  sort_order    = EXCLUDED.sort_order,
  is_featured   = EXCLUDED.is_featured;


-- ============================================================
-- BẢNG 2: PROMOTIONS (Chương trình ưu đãi - 10 ưu đãi)
-- ============================================================
INSERT INTO promotions (id, title, category, description, image_url, discount_percent, start_date, end_date, created_at, updated_at)
VALUES
  -- 1. Giảm 10% — Niềng răng trẻ em
  ('ee11111a-aaaa-4b17-b806-ab8c9c0da001',
   'Gói can thiệp sớm các lệch lạc tiền tăng trưởng - 2 năm',
   'Niềng răng trẻ em',
   'Can thiệp sớm các lệch lạc răng mặt ở trẻ em giúp định hướng xương hàm phát triển hài hòa. Tạo khoảng trống cho răng vĩnh viễn mọc đúng vị trí, giảm thiểu tối đa việc phải nhổ răng hay phẫu thuật xương hàm sau này. Gói điều trị 2 năm toàn diện với đội ngũ bác sĩ chuyên khoa nhi nha.',
   'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
   10.00, NOW(), NOW() + INTERVAL '30 days', NOW(), NOW()),

  -- 2. Giảm 20% — ClearCorrect bổ sung
  ('ee22222b-bbbb-4b17-b806-ab8c9c0db002',
   'Khay ClearCorrect bổ sung - Tinh chỉnh hoàn hảo',
   'Niềng răng ClearCorrect',
   'Khay ClearCorrect bổ sung thiết kế riêng để tinh chỉnh và hoàn thiện các bước dịch chuyển răng cuối cùng. Đảm bảo kết quả nụ cười hoàn hảo nhất sau khi hoàn thành liệu trình chính. Ưu đãi áp dụng cho khách hàng đang điều trị tại Crown Dental.',
   'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=800&q=80',
   20.00, NOW(), NOW() + INTERVAL '30 days', NOW(), NOW()),

  -- 3. Giảm 20% — ClearCorrect duy trì
  ('ee33333c-cccc-4b17-b806-ab8c9c0dc003',
   'Hàm duy trì ClearCorrect - Ổn định kết quả niềng răng',
   'Niềng răng ClearCorrect',
   'Hàm duy trì ClearCorrect là khí cụ quan trọng sau khi kết thúc chỉnh nha, ổn định vị trí răng trong 6-12 tháng. Vật liệu cao cấp, trong suốt, thoải mái khi đeo và dễ vệ sinh. An toàn tiêu chuẩn y tế quốc tế.',
   'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=800&q=80',
   20.00, NOW(), NOW() + INTERVAL '30 days', NOW(), NOW()),

  -- 4. Giảm 20% — Invisalign bổ sung
  ('ee44444d-dddd-4b17-b806-ab8c9c0dd004',
   'Khay Invisalign bổ sung - Hoàn thiện nụ cười',
   'Niềng răng trong suốt Invisalign',
   'Khay Invisalign bổ sung tinh chỉnh các dịch chuyển răng nhỏ chưa đạt yêu cầu sau đợt khay chính thức. Công nghệ ClinCheck 3D theo dõi từng bước, đảm bảo hàm răng đạt độ đều khít hoàn hảo.',
   'https://images.unsplash.com/photo-1513415277900-a62401e5084d?auto=format&fit=crop&w=800&q=80',
   20.00, NOW(), NOW() + INTERVAL '30 days', NOW(), NOW()),

  -- 5. Giảm 15% — Invisalign Comprehensive
  ('ee55555e-eeee-4b17-b806-ab8c9c0de005',
   'Ưu đãi Niềng răng Invisalign - Hệ thống số 1 thế giới',
   'Niềng răng trong suốt Invisalign',
   'Niềng răng Invisalign với công nghệ khay trong suốt nhập khẩu từ Mỹ, điều trị cá nhân hóa 100% bằng phần mềm ClinCheck 3D. Ưu đãi 15% nhân dịp kỷ niệm thành lập Crown Dental. Crown là Red Diamond Invisalign Provider - cấp cao nhất toàn cầu với hơn 1.000 ca mỗi năm.',
   'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=800&q=80',
   15.00, NOW(), NOW() + INTERVAL '45 days', NOW(), NOW()),

  -- 6. Giảm 25% — Veneer e.max
  ('ee66666f-ffff-4b17-b806-ab8c9c0df006',
   'Răng sứ Veneer e.max thẩm mỹ - Nụ cười rạng rỡ tức thì',
   'Răng sứ thẩm mỹ',
   'Mặt dán sứ Veneer siêu mỏng chỉ 0.3-0.5mm, bảo tồn tối đa men răng thật. Đem lại nụ cười trắng sáng, tự nhiên và bền bỉ đến 15-20 năm. Ưu đãi 25% nhân dịp mùa cưới, áp dụng cho khách hàng đặt lịch trong tháng này.',
   'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=800&q=80',
   25.00, NOW(), NOW() + INTERVAL '45 days', NOW(), NOW()),

  -- 7. Giảm 10% — Implant Straumann
  ('ee77777a-aaab-4b17-b806-ab8c9c0d1007',
   'Trồng răng Implant Straumann - Phục hồi hoàn hảo như răng thật',
   'Cấy ghép Implant',
   'Cấy ghép Implant phục hồi toàn diện cả chân răng và thân răng, đảm bảo ăn nhai thoải mái và thẩm mỹ tự nhiên. Ưu đãi 10% cho khách hàng cấy ghép 2 trụ trở lên. Trụ Implant Straumann (Thụy Sĩ) nhập khẩu chính hãng, bảo hành 10 năm.',
   'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80',
   10.00, NOW(), NOW() + INTERVAL '60 days', NOW(), NOW()),

  -- 8. Giảm 30% — Tẩy trắng Zoom 2
  ('ee88888b-bbbc-4b17-b806-ab8c9c0d2008',
   'Tẩy trắng răng Zoom 2 - Sáng lên 8 tông chỉ trong 45 phút',
   'Tẩy trắng răng',
   'Công nghệ Zoom Laser thế hệ mới, nâng tông răng lên đến 8 tông chỉ sau 1 lần điều trị 45 phút. An toàn tuyệt đối cho men răng, không gây ê buốt. Ưu đãi 30% cho khách hàng mới đăng ký trong tháng. Tặng kèm bộ tẩy trắng tại nhà miễn phí trị giá 800.000đ.',
   'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
   30.00, NOW(), NOW() + INTERVAL '30 days', NOW(), NOW()),

  -- 9. Giảm 50% — Khám gia đình
  ('ee99999c-cccd-4b17-b806-ab8c9c0d3009',
   'Khám răng tổng quát - Ưu đãi đặc biệt cho gia đình',
   'Khám & Điều trị',
   'Khám răng tổng quát định kỳ bao gồm: chụp X-quang, lấy cao răng, kiểm tra sâu răng và tư vấn điều trị miễn phí. Ưu đãi 50% cho gói gia đình từ 3 người trở lên. Phát hiện sớm các vấn đề răng miệng, tiết kiệm tối đa chi phí điều trị.',
   'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=800&q=80',
   50.00, NOW(), NOW() + INTERVAL '45 days', NOW(), NOW()),

  -- 10. Giảm 15% — Nhổ răng khôn
  ('eeaaaaa1-ddde-4b17-b806-ab8c9c0d4010',
   'Nhổ răng khôn không đau - Hồi phục nhanh trong 24h',
   'Khám & Điều trị',
   'Nhổ răng khôn bằng máy siêu âm Piezotome thế hệ mới, không đau, không sưng, lành thương chỉ trong 24-48 giờ. Giảm 15% cho khách hàng nhổ đồng thời 2 răng khôn. Bác sĩ chuyên khoa phẫu thuật miệng giàu kinh nghiệm thực hiện.',
   'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
   15.00, NOW(), NOW() + INTERVAL '60 days', NOW(), NOW())

ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- BẢNG 3: PROMOTION_SERVICES (Liên kết ưu đãi ↔ dịch vụ)
-- ============================================================
-- Promotion assignments are managed explicitly through the admin API.
-- Do not restore removed assignments on every application startup.


-- ============================================================
-- BẢNG 4: MEDICINES (50 Thuốc nha khoa chuyên dụng)
-- ============================================================
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS unit VARCHAR(255);
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(255);
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS price NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS manufacture_date DATE;
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS uk_medicines_code ON medicines (code);

INSERT INTO medicines (id, code, name, unit, manufacturer, stock_quantity, price, manufacture_date, expiry_date, description, status, created_at, updated_at)
VALUES
  -- Nhóm 1: Kháng sinh điều trị nhiễm khuẩn răng miệng
  ('01a11111-1111-1111-1111-111111111101', 'MED-AMOX-500', 'Amoxicillin 500mg', 'Viên nang', 'Dược Hậu Giang (DHG)', 350, 2500.00, '2025-01-10', '2027-01-10', 'Kháng sinh phổ rộng nhóm Penicillin điều trị nhiễm trùng răng miệng, áp xe quanh cuống, viêm tủy cấp tính.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111102', 'MED-AUG-625', 'Augmentin 625mg', 'Viên nén bao phim', 'GlaxoSmithKline (GSK)', 180, 18500.00, '2025-02-15', '2027-02-15', 'Kháng sinh phối hợp Amoxicillin + Acid Clavulanic đặc trị nhiễm khuẩn răng hàm mặt nặng, viêm mô tế bào sau nhổ răng.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111103', 'MED-AUG-1000', 'Augmentin 1g', 'Viên nén bao phim', 'GlaxoSmithKline (GSK)', 120, 24000.00, '2025-03-01', '2027-03-01', 'Kháng sinh hàm lượng cao dùng cho các ca viêm quanh chóp răng lan rộng, nhiễm khuẩn sau phẫu thuật xương hàm.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111104', 'MED-CLAM-500', 'Clamoxyl 500mg', 'Viên nang', 'GlaxoSmithKline (GSK)', 150, 6000.00, '2024-11-20', '2026-11-20', 'Kháng sinh Amoxicillin tinh khiết, điều trị dự phòng viêm màng trong tim trước thủ thuật nhổ răng có chảy máu.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111105', 'MED-SPI-15M', 'Spiramycin 1.5 MUI (Rovamycine)', 'Viên nén bao phim', 'Sanofi Aventis', 200, 8500.00, '2025-01-05', '2027-01-05', 'Kháng sinh nhóm Macrolid thấm rất tốt vào mô nha chu và tuyến nước bọt, điều trị viêm nướu, viêm nha chu.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111106', 'MED-RODO-250', 'Rodogyl', 'Viên nén bao phim', 'Sanofi Aventis', 300, 7200.00, '2025-02-10', '2027-02-10', 'Phối hợp Spiramycin và Metronidazole, thuốc đầu tay điều trị nhiễm trùng răng miệng cấp và mạn tính, viêm nướu hoại tử lở loét.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111107', 'MED-METRO-250', 'Metronidazole 250mg (Klion)', 'Viên nén', 'Gedeon Richter', 250, 1800.00, '2024-10-15', '2026-10-15', 'Kháng sinh diệt vi khuẩn kỵ khí cực mạnh, đặc trị vi khuẩn gram âm trong viêm quanh cuống răng và túi mủ nha chu.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111108', 'MED-CLIN-300', 'Clindamycin 300mg (Dalacin C)', 'Viên nang', 'Pfizer', 90, 14000.00, '2025-01-18', '2027-01-18', 'Kháng sinh thâm nhập tốt vào mô xương, chỉ định thay thế hàng đầu khi bệnh nhân dị ứng Penicillin trong phẫu thuật cấy ghép Implant.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111109', 'MED-ZIN-500', 'Zinnat 500mg (Cefuroxime Axetil)', 'Viên nén bao phim', 'GlaxoSmithKline (GSK)', 110, 26500.00, '2025-04-01', '2027-04-01', 'Kháng sinh Cephalosporin thế hệ 2 điều trị nhiễm trùng xoang hàm trên có nguồn gốc do răng, viêm mô tế bào sau nhổ răng.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111110', 'MED-AZI-500', 'Azithromycin 500mg (Zithromax)', 'Viên nén bao phim', 'Pfizer', 80, 32000.00, '2025-03-10', '2027-03-10', 'Kháng sinh Macrolid bán thải dài, dùng phác đồ 3 ngày tiện lợi cho bệnh nhân viêm nha chu xâm lấn tiến triển nhanh.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111111', 'MED-CIPRO-500', 'Ciprofloxacin 500mg', 'Viên nén bao phim', 'Dược Hậu Giang (DHG)', 140, 3500.00, '2024-12-01', '2026-12-01', 'Kháng sinh nhóm Quinolon dùng trong các trường hợp nhiễm khuẩn răng miệng đề kháng, viêm xoang hàm phối hợp.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111112', 'MED-CEPH-500', 'Cephalexin 500mg', 'Viên nang', 'Mekophar', 180, 2000.00, '2024-09-10', '2026-09-10', 'Kháng sinh Cephalosporin thế hệ 1 dự phòng nhiễm khuẩn sau nhổ răng thông thường và tiểu phẫu nạo túi nha chu.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111113', 'MED-DOXY-100', 'Doxycycline 100mg', 'Viên nang', 'Dược Domesco', 160, 2800.00, '2025-02-01', '2027-02-01', 'Ức chế enzym collagenase mô nha chu, liều thấp hỗ trợ làm chậm tiêu xương ổ răng ở bệnh nhân viêm nha chu mạn.', 'ACTIVE', NOW(), NOW()),

  -- Nhóm 2: Giảm đau - Kháng viêm - Phù nề nha khoa
  ('01a11111-1111-1111-1111-111111111114', 'MED-PARA-500', 'Paracetamol 500mg', 'Viên nén', 'Dược Hậu Giang (DHG)', 500, 1000.00, '2025-01-01', '2028-01-01', 'Thuốc giảm đau hạ sốt mức độ nhẹ đến vừa sau nhổ răng thông thường, cạo vôi răng hoặc gắn khí cụ chỉnh nha.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111115', 'MED-PANADOL-EX', 'Panadol Extra', 'Viên nén đỏ', 'GlaxoSmithKline (GSK)', 400, 2200.00, '2025-02-05', '2027-08-05', 'Giảm đau răng cấp tốc, tăng cường hiệu quả giảm đau nhờ phối hợp Paracetamol 500mg và Caffeine 65mg.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111116', 'MED-EF-500', 'Efferalgan 500mg sủi', 'Viên sủi', 'UPSA SAS (Pháp)', 220, 4500.00, '2025-03-15', '2027-03-15', 'Thuốc sủi tan nhanh, hấp thu nhanh giảm đau nhức răng tức thì, phù hợp người đau răng khó nuốt viên nén.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111117', 'MED-EF-COD', 'Efferalgan Codeine', 'Viên sủi', 'UPSA SAS (Pháp)', 140, 8900.00, '2025-01-20', '2027-01-20', 'Phối hợp Paracetamol 500mg + Codein phosphate 30mg, giảm đau mức độ trung bình đến nặng sau phẫu thuật nhổ răng khôn mọc lệch.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111118', 'MED-IBU-400', 'Ibuprofen 400mg', 'Viên nén bao phim', 'Stella Pharm', 300, 2400.00, '2025-01-10', '2027-01-10', 'Thuốc kháng viêm không steroid (NSAID) giảm đau răng, sưng nướu cực kỳ hiệu quả sau khi chữa tủy và phẫu thuật nướu.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111119', 'MED-MELOX-75', 'Meloxicam 7.5mg', 'Viên nén', 'Boston Pharma', 150, 3200.00, '2025-02-25', '2027-02-25', 'Kháng viêm ức chế chọn lọc COX-2, giảm phù nề má và đau sau phẫu thuật cấy ghép Implant, ít tác dụng phụ dạ dày.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111120', 'MED-VOLT-50', 'Voltaren 50mg (Diclofenac)', 'Viên bao tan ruột', 'Novartis', 180, 7500.00, '2025-01-15', '2027-01-15', 'Kháng viêm giảm đau mạnh dùng trong các cơn đau tủy răng cấp dữ dội và sau phẫu thuật cắt chóp răng, nạo nang chân răng.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111121', 'MED-CELE-200', 'Celebrex 200mg (Celecoxib)', 'Viên nang', 'Pfizer', 120, 38000.00, '2025-03-01', '2027-03-01', 'Kháng viêm chọn lọc COX-2 cao cấp, kiểm soát đau và phù nề sau phẫu thuật chỉnh hình hàm mặt và nhổ nhiều răng khôn cùng lúc.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111122', 'MED-ALPHACHOAY', 'Alpha Choay (Alphachymotrypsin)', 'Viên ngậm', 'Sanofi Aventis', 450, 4200.00, '2025-02-01', '2027-02-01', 'Men kháng viêm chống phù nề dạng ngậm dưới lưỡi, chống bầm tím và sưng nề mô mềm sau phẫu thuật miệng.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111123', 'MED-KATADOL', 'Katrypsin (Chymotrypsin 4200 IU)', 'Viên nén', 'Dược Vacopharm', 250, 2500.00, '2024-11-15', '2026-11-15', 'Thuốc kháng viêm dạng men giảm tụ máu, giảm phù nề vùng niêm mạc miệng sau chấn thương hoặc nhổ răng tiểu phẫu.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111124', 'MED-PRED-5', 'Prednisolone 5mg', 'Viên nén', 'Dược Pharbaco', 200, 1200.00, '2025-01-12', '2027-01-12', 'Corticoid kháng viêm mạnh dùng ngắn ngày (2-3 ngày) trong các trường hợp sưng to sau mở xương nhổ răng khôn ngầm.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111125', 'MED-DEXA-05', 'Dexamethasone 0.5mg', 'Viên nén', 'Dược Hậu Giang (DHG)', 180, 800.00, '2024-10-20', '2026-10-20', 'Kháng viêm glucocorticoid chống phản ứng viêm dữ dội và co thắt mô hạt quanh cuống răng.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111126', 'MED-TRAMA-50', 'Tramadol 50mg', 'Viên nang', 'Stada Arzneimittel', 60, 9500.00, '2025-01-05', '2027-01-05', 'Thuốc giảm đau trung ương dùng trong các ca đau dữ dội sau phẫu thuật xương hàm phức tạp khi NSAIDs không đủ hiệu quả.', 'ACTIVE', NOW(), NOW()),

  -- Nhóm 3: Thuốc tê nha khoa tại chỗ & bôi tê
  ('01a11111-1111-1111-1111-111111111127', 'MED-LIDO-2', 'Lidocaine 2% with Epinephrine 1:100.000', 'Ống tiêm', 'Septodont (Pháp)', 250, 22000.00, '2025-02-20', '2027-02-20', 'Thuốc tê dạng ống nha khoa 1.8ml tiêu chuẩn, gây tê tiêm ngấm và gây tê vùng thần kinh hàm dưới, có co mạch giảm chảy máu.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111128', 'MED-SEPT-4', 'Septanest 4% with Adrenaline 1:100.000', 'Ống tiêm', 'Septodont (Pháp)', 200, 28000.00, '2025-03-05', '2027-03-05', 'Thuốc tê Articaine khuếch tán qua vỏ xương cực tốt, gây tê tủy răng êm ái, nhổ răng khó và cắm trụ Implant.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111129', 'MED-SCAN-3', 'Scandonest 3% Plain (Mepivacaine)', 'Ống tiêm', 'Septodont (Pháp)', 120, 26000.00, '2025-01-15', '2027-01-15', 'Thuốc tê không chứa chất co mạch (không Adrenaline), an toàn tuyệt đối cho bệnh nhân cao huyết áp, tim mạch, cường giáp.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111130', 'MED-XYLO-SPRAY', 'Xylocaine Spray 10%', 'Chai xịt', 'AstraZeneca', 15, 340000.00, '2024-12-10', '2026-12-10', 'Thuốc tê xịt bề mặt niêm mạc miệng chai 50ml, chống nôn khi lấy dấu răng và trước khi chích tê tại chỗ.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111131', 'MED-EMLA-5', 'EMLA Cream 5%', 'Tuýp', 'AstraZeneca', 25, 145000.00, '2025-02-10', '2027-02-10', 'Kem bôi tê bề mặt niêm mạc lợi (Lidocaine + Prilocaine) giảm đau khi chích kim gây tê cho trẻ em và người sợ đau.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111132', 'MED-BENZO-20', 'Benzocaine 20% Gel (Hurricaine)', 'Hũ', 'Beutlich Pharmaceuticals', 20, 285000.00, '2025-01-25', '2027-01-25', 'Gel bôi tê bề mặt tác dụng nhanh trong 30 giây vị anh đào dễ chịu, dùng trước khi tiêm tê và cạo vôi dưới nướu.', 'ACTIVE', NOW(), NOW()),

  -- Nhóm 4: Nước súc miệng & sát khuẩn khoang miệng
  ('01a11111-1111-1111-1111-111111111133', 'MED-KIN-GING', 'Nước súc miệng Kin Gingival 0.12%', 'Chai', 'Laboratorios KIN (Tây Ban Nha)', 80, 135000.00, '2025-03-12', '2028-03-12', 'Dung dịch súc miệng chứa Chlorhexidine Digluconate 0.12% và Alpantha, bảo vệ nướu răng, dự phòng viêm nha chu và phục hồi sau nhổ răng.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111134', 'MED-MEDORAL', 'Medoral Nước súc miệng 0.2%', 'Chai', 'Dược Merap', 90, 95000.00, '2025-02-18', '2028-02-18', 'Sát khuẩn họng miệng phổ rộng, ngừa mảng bám vi khuẩn sau phẫu thuật nha khoa, không gây cay rát niêm mạc.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111135', 'MED-BETA-GARG', 'Betadine Gargle & Mouthwash 1%', 'Chai', 'Mundipharma', 100, 75000.00, '2025-01-10', '2027-07-10', 'Dung dịch súc miệng diệt khuẩn, nấm và virus khoang miệng, dùng sát khuẩn miệng trước thủ thuật phẫu thuật.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111136', 'MED-POVI-10', 'Povidone Iodine 10%', 'Chai', 'Dược Pharmedic', 60, 25000.00, '2024-11-05', '2026-11-05', 'Dung dịch bôi sát trùng phẫu trường trong miệng và quanh môi trước khi cấy ghép Implant hoặc nhổ răng tiểu phẫu.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111137', 'MED-ELUDRIL', 'Eludril Classic Nước súc miệng', 'Chai', 'Pierre Fabre Medicament (Pháp)', 50, 140000.00, '2025-02-01', '2028-02-01', 'Phối hợp Chlorhexidine 0.10% và Chlorobutanol 0.5%, vừa kháng khuẩn vừa làm dịu cơn đau rát nướu răng.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111138', 'MED-NACL-09', 'Nước muối sinh lý NaCl 0.9%', 'Chai', 'Dược Vĩnh Phúc', 300, 8000.00, '2025-01-01', '2028-01-01', 'Dung dịch đẳng trương dùng rửa ổ răng sau nhổ, bơm rửa ống tủy răng và súc miệng vệ sinh răng miệng hằng ngày.', 'ACTIVE', NOW(), NOW()),

  -- Nhóm 5: Gel bôi nhiệt miệng, nha chu, vết loét
  ('01a11111-1111-1111-1111-111111111139', 'MED-KAMI-GEL', 'Kamistad Gel N 10g', 'Tuýp', 'STADA Arzneimittel (Đức)', 75, 52000.00, '2025-02-20', '2028-02-20', 'Chiết xuất hoa cúc kết hợp Lidocaine, giảm đau chống viêm loét niêm mạc miệng, nhiệt miệng, đau do đeo hàm giả hoặc niềng răng.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111140', 'MED-GENG-GEL', 'Gengigel Nha Chu 20ml', 'Tuýp', 'Ricerfarma (Ý)', 40, 290000.00, '2025-03-05', '2028-03-05', 'Gel sinh học Hyaluronic Acid 0.2% thúc đẩy lành thương nướu, tái tạo mô nha chu sau cạo vôi sâu và phẫu thuật lật vạt.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111141', 'MED-METRO-DENT', 'Metrogyl Denta Gel 10g', 'Tuýp', 'Unique Pharmaceutical Laboratories', 85, 48000.00, '2025-01-15', '2027-01-15', 'Phối hợp Metronidazole và Chlorhexidine dạng gel bôi nha chu, đặc trị viêm nướu chảy máu chân răng và viêm quanh thân răng khôn.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111142', 'MED-PERIO-GEL', 'Periokin Gel 30ml (Chlorhexidine 0.2%)', 'Tuýp', 'Laboratorios KIN (Tây Ban Nha)', 35, 165000.00, '2025-02-14', '2027-08-14', 'Gel bám dính sinh học kháng khuẩn tại chỗ quanh cổ Implant và túi lợi sâu, chống viêm quanh Implant.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111143', 'MED-ZYTEE-RB', 'Zytee RB Gel 10ml', 'Tuýp', 'Raptakos Brett', 60, 38000.00, '2024-10-10', '2026-10-10', 'Choline Salicylate giảm đau nhanh các vết trợt loét do cọ xát dây cung niềng răng trong vòng 3-4 phút.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111144', 'MED-ORACORTIA', 'Oracortia Mouthpaste (Triamcinolone 0.1%)', 'Gói', 'Mega Lifesciences', 150, 16000.00, '2025-01-10', '2027-01-10', 'Corticoid dạng mỡ dính niêm mạc điều trị loét aphthe tái phát nặng, viêm môi bong vảy do dị ứng.', 'ACTIVE', NOW(), NOW()),

  -- Nhóm 6: Thuốc cầm máu & hỗ trợ điều trị hậu phẫu
  ('01a11111-1111-1111-1111-111111111145', 'MED-SPONGO', 'Bọt xốp cầm máu Spongostan Dental', 'Hộp', 'Johnson & Johnson (Mỹ)', 30, 420000.00, '2024-12-05', '2027-12-05', 'Miếng xốp Gelatin cầm máu tự tiêu đặt vào huyệt ổ răng sau nhổ, giúp hình thành cục máu đông nhanh và chống chảy máu tái phát.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111146', 'MED-TRANS-500', 'Transamin 500mg (Acid Tranexamic)', 'Viên nén', 'Daiichi Sankyo', 100, 6800.00, '2025-01-20', '2027-01-20', 'Thuốc cầm máu chống tiêu Fibrin dùng đường uống trước và sau phẫu thuật nhổ răng phức tạp ở người có cơ địa dễ chảy máu.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111147', 'MED-BIOFLORA', 'Men vi sinh Bioflora 250mg', 'Gói', 'Biocodex (Pháp)', 120, 11500.00, '2025-03-01', '2027-03-01', 'Bổ sung nấm men Saccharomyces boulardii phòng ngừa tiêu chảy và rối loạn tiêu hóa khi uống kháng sinh nha khoa liều cao kéo dài.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111148', 'MED-OMEP-20', 'Omeprazole 20mg', 'Viên nang', 'Dược Hậu Giang (DHG)', 200, 2000.00, '2025-01-05', '2028-01-05', 'Ức chế bơm proton bảo vệ niêm mạc dạ dày khi kê đơn thuốc kháng viêm NSAIDs giảm đau sau phẫu thuật răng hàm mặt.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111149', 'MED-VITC-500', 'Vitamin C 500mg', 'Viên nén', 'Dược Mekophar', 300, 1500.00, '2025-02-10', '2028-02-10', 'Tăng sức bền thành mạch, giảm chảy máu chân răng và tăng cường tổng hợp collagen làm nhanh lành thương nướu răng.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111150', 'MED-ENAMELAST', 'Véc-ni Fluoride Enamelast 5% NaF', 'Tuýp', 'Ultradent Products (Mỹ)', 50, 85000.00, '2025-03-10', '2027-09-10', 'Vecni bôi phóng thích fluor kéo dài, đặc trị ê buốt cổ chân răng và ngừa sâu răng tái phát quanh mắc cài niềng răng.', 'ACTIVE', NOW(), NOW())

ON CONFLICT (code) DO NOTHING;

-- Backfill missing instructions from the existing insert_medicines.sql seed.
-- Preserve instructions already entered by users.
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS usage_instruction TEXT;

UPDATE medicines AS m
SET usage_instruction = seed.usage_instruction,
    updated_at = CURRENT_TIMESTAMP
FROM (VALUES
  ('MED-AMOX-500', 'Ngày uống 3 lần, mỗi lần 1 viên sau ăn (cách nhau 8 giờ)'),
  ('MED-AUG-625', 'Ngày uống 2 lần, mỗi lần 1 viên sau bữa ăn sáng và tối'),
  ('MED-AUG-1000', 'Ngày uống 2 lần, mỗi lần 1 viên ngay trước bữa ăn'),
  ('MED-CLAM-500', 'Ngày uống 3 lần, mỗi lần 1 viên sau ăn, uống với nhiều nước'),
  ('MED-SPI-15M', 'Ngày uống 2 lần, mỗi lần 1 viên trước bữa ăn ít nhất 2 giờ'),
  ('MED-RODO-250', 'Ngày uống 2 lần, mỗi lần 2 viên trong hoặc ngay sau bữa ăn'),
  ('MED-METRO-250', 'Ngày uống 3 lần, mỗi lần 1 viên sau ăn no, kiêng bia rượu'),
  ('MED-CLIN-300', 'Ngày uống 3 lần, mỗi lần 1 viên với 1 ly nước đầy, không nằm ngay sau uống'),
  ('MED-ZIN-500', 'Ngày uống 2 lần, mỗi lần 1 viên ngay sau bữa ăn'),
  ('MED-AZI-500', 'Uống 1 viên/ngày duy nhất, uống trước ăn 1 giờ hoặc sau ăn 2 giờ trong 3 ngày'),
  ('MED-CIPRO-500', 'Ngày uống 2 lần, mỗi lần 1 viên sau ăn, uống cùng nhiều nước'),
  ('MED-CEPH-500', 'Ngày uống 3 lần, mỗi lần 1 viên cách mỗi 8 giờ sau ăn'),
  ('MED-DOXY-100', 'Ngày uống 1-2 lần, mỗi lần 1 viên với ly nước đầy sau bữa ăn'),
  ('MED-PARA-500', 'Uống 1 viên khi đau hoặc sốt, cách nhau 4-6 giờ (tối đa 4 viên/ngày)'),
  ('MED-PANADOL-EX', 'Uống 1-2 viên khi đau, cách nhau tối thiểu 4-6 giờ (tối đa 8 viên/ngày)'),
  ('MED-EF-500', 'Hòa tan 1 viên vào nửa ly nước lọc, uống khi đau, cách nhau 4-6 giờ'),
  ('MED-EF-COD', 'Hòa tan 1 viên vào nước uống khi đau nhiều, cách nhau ít nhất 6 giờ'),
  ('MED-IBU-400', 'Ngày uống 2-3 lần, mỗi lần 1 viên sau khi ăn no'),
  ('MED-MELOX-75', 'Ngày uống 1 lần, mỗi lần 1-2 viên sau bữa ăn trưa'),
  ('MED-VOLT-50', 'Ngày uống 2 lần, mỗi lần 1 viên sau khi ăn no, nuốt nguyên viên'),
  ('MED-CELE-200', 'Ngày uống 1 lần, mỗi lần 1 viên sau bữa ăn'),
  ('MED-ALPHACHOAY', 'Ngậm dưới lưỡi 2 viên/lần, ngày 3-4 lần để tan từ từ'),
  ('MED-KATADOL', 'Ngày uống 3 lần, mỗi lần 2 viên sau ăn với 1 ly nước đầy'),
  ('MED-PRED-5', 'Uống 2-4 viên 1 lần duy nhất vào buổi sáng sau ăn no trong 2-3 ngày'),
  ('MED-DEXA-05', 'Uống 1-2 viên vào buổi sáng sau ăn theo đúng chỉ định bác sĩ'),
  ('MED-TRAMA-50', 'Uống 1 viên khi đau dữ dội, cách nhau tối thiểu 6 giờ (theo đơn)'),
  ('MED-LIDO-2', 'Tiêm tê tại chỗ hoặc gây tê vùng theo chỉ định thủ thuật của nha sĩ'),
  ('MED-SEPT-4', 'Tiêm tê tại chỗ hoặc tiêm ngấm xương vỏ theo chỉ định của nha sĩ'),
  ('MED-SCAN-3', 'Gây tê vùng/tiêm ngấm cho người có bệnh lý tim mạch, cao huyết áp theo chỉ định nha sĩ'),
  ('MED-XYLO-SPRAY', 'Xịt 1-2 nhát vào vị trí niêm mạc cần gây tê trước thủ thuật 1-2 phút'),
  ('MED-EMLA-5', 'Bôi một lớp mỏng lên niêm mạc cần gây tê trước khi chích tê 3-5 phút'),
  ('MED-BENZO-20', 'Dùng tăm bông lấy một lượng nhỏ gel bôi lên niêm mạc trong 30 giây'),
  ('MED-KIN-GING', 'Súc miệng 15ml nguyên chất trong 30-60 giây, ngày 2 lần sau khi chải răng (không nuốt)'),
  ('MED-MEDORAL', 'Súc miệng 10-15ml trong 1 phút, ngày 2 lần sau ăn, không ăn uống trong 30 phút sau súc'),
  ('MED-BETA-GARG', 'Pha loãng với nước ấm tỉ lệ 1:1, súc miệng và họng trong 30 giây, ngày 2-3 lần'),
  ('MED-POVI-10', 'Dùng gạc vô khuẩn thấm dung dịch sát khuẩn phẫu trường trước phẫu thuật'),
  ('MED-ELUDRIL', 'Pha 10-15ml dung dịch vào cốc nước ấm đến vạch, súc miệng ngày 2-3 lần'),
  ('MED-NACL-09', 'Súc miệng thật nhẹ nhàng sau mỗi bữa ăn và trước khi đi ngủ, ngày 3-4 lần'),
  ('MED-KAMI-GEL', 'Bôi một lượng gel cỡ hạt đậu lên vùng niêm mạc tổn thương, ngày 3 lần sau ăn'),
  ('MED-GENG-GEL', 'Bôi trực tiếp gel lên vùng nướu viêm sau khi vệ sinh răng, massage nhẹ 1-2 phút, ngày 3-4 lần'),
  ('MED-METRO-DENT', 'Thoa gel vào túi nha chu hoặc chân răng viêm ngày 2 lần sau khi chải răng sạch'),
  ('MED-PERIO-GEL', 'Bôi gel quanh cổ Implant hoặc vùng nướu tổn thương ngày 2-3 lần sau ăn'),
  ('MED-ZYTEE-RB', 'Nhỏ 1-2 giọt gel lên đầu ngón tay sạch, thoa nhẹ lên vết trợt loét ngày 3-4 lần'),
  ('MED-ORACORTIA', 'Bôi một lượng nhỏ lên vết loét trước khi đi ngủ hoặc sau ăn ngày 2-3 lần (không chà xát)'),
  ('MED-SPONGO', 'Đặt trực tiếp miếng xốp vào ổ răng sau nhổ, cắn gạc chặt trong 30-45 phút'),
  ('MED-TRANS-500', 'Ngày uống 2-3 lần, mỗi lần 1 viên sau ăn để hỗ trợ cầm máu theo đơn'),
  ('MED-BIOFLORA', 'Hòa tan gói men vào nước ấm hoặc uống trực tiếp, ngày 1-2 gói cách xa thời điểm uống kháng sinh 2 giờ'),
  ('MED-OMEP-20', 'Uống 1 viên trước bữa ăn sáng 30 phút'),
  ('MED-VITC-500', 'Ngày uống 1 lần, 1 viên sau bữa ăn sáng (không uống vào buổi tối)'),
  ('MED-ENAMELAST', 'Lau khô bề mặt răng, quét một lớp vecni mỏng lên vùng cổ răng ê buốt theo chỉ định nha sĩ')
) AS seed(code, usage_instruction)
WHERE m.code = seed.code
  AND (m.usage_instruction IS NULL OR BTRIM(m.usage_instruction) = '');

-- Preserve legacy prescriber names; only link unambiguous exact name matches.
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS dentist_id UUID;
-- Hibernate creates fk_prescriptions_dentist from Prescription.dentist before
-- this script (ddl-auto=update, defer-datasource-initialization=true).
-- Keep statements compatible with Spring's semicolon-based SQL script parser.
CREATE INDEX IF NOT EXISTS idx_prescriptions_dentist_id ON prescriptions(dentist_id);

-- One active parent per related patient; inactive links remain as history.
-- Existing duplicate active links must be resolved explicitly before startup.
CREATE UNIQUE INDEX IF NOT EXISTS uq_patient_relationships_active_target
    ON patient_relationships (related_patient_id) WHERE status = true;

UPDATE prescriptions p
SET dentist_id = d.id
FROM dentists d
WHERE p.dentist_id IS NULL
  AND NULLIF(BTRIM(p.prescriber), '') IS NOT NULL
  AND LOWER(BTRIM(p.prescriber)) = LOWER(BTRIM(d.full_name))
  AND (SELECT COUNT(*) FROM dentists other
       WHERE LOWER(BTRIM(other.full_name)) = LOWER(BTRIM(d.full_name))) = 1;

-- Đảm bảo tài khoản employee02 có chức vụ RECEPTIONIST và tên hiển thị đúng với tài khoản (employee02)
UPDATE employees e
SET position = 'RECEPTIONIST', full_name = u.username
FROM users u
WHERE e.user_id = u.id AND u.username = 'employee02';

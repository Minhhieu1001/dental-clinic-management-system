-- ============================================================
-- data.sql — Dữ liệu mẫu tự động cho Nha khoa Crown Dental
-- Spring Boot chạy file này tự động mỗi lần khởi động
-- Dùng ON CONFLICT DO NOTHING để tránh lỗi trùng dữ liệu
-- ============================================================

-- Cập nhật check constraint cho bảng tooth_records và diagnoses hỗ trợ enum Level mới
ALTER TABLE tooth_records DROP CONSTRAINT IF EXISTS tooth_records_severity_check;
ALTER TABLE tooth_records ADD CONSTRAINT tooth_records_severity_check 
    CHECK (severity IS NULL OR severity IN ('ENAMEL', 'DENTIN', 'NEAR_PULP', 'PULP', 'MILD', 'MODERATE', 'SEVERE'));

ALTER TABLE tooth_records DROP CONSTRAINT IF EXISTS tooth_records_caries_location_check;
ALTER TABLE tooth_records ADD CONSTRAINT tooth_records_caries_location_check 
    CHECK (caries_location IS NULL OR caries_location IN ('OCCLUSAL', 'MESIAL', 'DISTAL', 'BUCCAL', 'LINGUAL', 'PALATAL', 'CERVICAL', 'WHOLE_CROWN'));

ALTER TABLE tooth_records DROP CONSTRAINT IF EXISTS tooth_records_tooth_status_check;
ALTER TABLE tooth_records ADD CONSTRAINT tooth_records_tooth_status_check 
    CHECK (tooth_status IS NULL OR tooth_status IN ('HEALTHY', 'CARIES', 'FILLED', 'MISSING', 'GINGIVITIS', 'ATTENTION_REQUIRE', 'ROOT_CANAL', 'MARROW'));

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
INSERT INTO promotions (id, title, category, description, image_url, discount_percent, start_date, end_date)
VALUES
  -- 1. Giảm 10% — Niềng răng trẻ em
  ('ee11111a-aaaa-4b17-b806-ab8c9c0da001',
   'Gói can thiệp sớm các lệch lạc tiền tăng trưởng - 2 năm',
   'Niềng răng trẻ em',
   'Can thiệp sớm các lệch lạc răng mặt ở trẻ em giúp định hướng xương hàm phát triển hài hòa. Tạo khoảng trống cho răng vĩnh viễn mọc đúng vị trí, giảm thiểu tối đa việc phải nhổ răng hay phẫu thuật xương hàm sau này. Gói điều trị 2 năm toàn diện với đội ngũ bác sĩ chuyên khoa nhi nha.',
   'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
   10.00, NOW(), NOW() + INTERVAL '30 days'),

  -- 2. Giảm 20% — ClearCorrect bổ sung
  ('ee22222b-bbbb-4b17-b806-ab8c9c0db002',
   'Khay ClearCorrect bổ sung - Tinh chỉnh hoàn hảo',
   'Niềng răng ClearCorrect',
   'Khay ClearCorrect bổ sung thiết kế riêng để tinh chỉnh và hoàn thiện các bước dịch chuyển răng cuối cùng. Đảm bảo kết quả nụ cười hoàn hảo nhất sau khi hoàn thành liệu trình chính. Ưu đãi áp dụng cho khách hàng đang điều trị tại Crown Dental.',
   'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=800&q=80',
   20.00, NOW(), NOW() + INTERVAL '30 days'),

  -- 3. Giảm 20% — ClearCorrect duy trì
  ('ee33333c-cccc-4b17-b806-ab8c9c0dc003',
   'Hàm duy trì ClearCorrect - Ổn định kết quả niềng răng',
   'Niềng răng ClearCorrect',
   'Hàm duy trì ClearCorrect là khí cụ quan trọng sau khi kết thúc chỉnh nha, ổn định vị trí răng trong 6-12 tháng. Vật liệu cao cấp, trong suốt, thoải mái khi đeo và dễ vệ sinh. An toàn tiêu chuẩn y tế quốc tế.',
   'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=800&q=80',
   20.00, NOW(), NOW() + INTERVAL '30 days'),

  -- 4. Giảm 20% — Invisalign bổ sung
  ('ee44444d-dddd-4b17-b806-ab8c9c0dd004',
   'Khay Invisalign bổ sung - Hoàn thiện nụ cười',
   'Niềng răng trong suốt Invisalign',
   'Khay Invisalign bổ sung tinh chỉnh các dịch chuyển răng nhỏ chưa đạt yêu cầu sau đợt khay chính thức. Công nghệ ClinCheck 3D theo dõi từng bước, đảm bảo hàm răng đạt độ đều khít hoàn hảo.',
   'https://images.unsplash.com/photo-1513415277900-a62401e5084d?auto=format&fit=crop&w=800&q=80',
   20.00, NOW(), NOW() + INTERVAL '30 days'),

  -- 5. Giảm 15% — Invisalign Comprehensive
  ('ee55555e-eeee-4b17-b806-ab8c9c0de005',
   'Ưu đãi Niềng răng Invisalign - Hệ thống số 1 thế giới',
   'Niềng răng trong suốt Invisalign',
   'Niềng răng Invisalign với công nghệ khay trong suốt nhập khẩu từ Mỹ, điều trị cá nhân hóa 100% bằng phần mềm ClinCheck 3D. Ưu đãi 15% nhân dịp kỷ niệm thành lập Crown Dental. Crown là Red Diamond Invisalign Provider - cấp cao nhất toàn cầu với hơn 1.000 ca mỗi năm.',
   'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=800&q=80',
   15.00, NOW(), NOW() + INTERVAL '45 days'),

  -- 6. Giảm 25% — Veneer e.max
  ('ee66666f-ffff-4b17-b806-ab8c9c0df006',
   'Răng sứ Veneer e.max thẩm mỹ - Nụ cười rạng rỡ tức thì',
   'Răng sứ thẩm mỹ',
   'Mặt dán sứ Veneer siêu mỏng chỉ 0.3-0.5mm, bảo tồn tối đa men răng thật. Đem lại nụ cười trắng sáng, tự nhiên và bền bỉ đến 15-20 năm. Ưu đãi 25% nhân dịp mùa cưới, áp dụng cho khách hàng đặt lịch trong tháng này.',
   'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=800&q=80',
   25.00, NOW(), NOW() + INTERVAL '45 days'),

  -- 7. Giảm 10% — Implant Straumann
  ('ee77777a-aaab-4b17-b806-ab8c9c0d1007',
   'Trồng răng Implant Straumann - Phục hồi hoàn hảo như răng thật',
   'Cấy ghép Implant',
   'Cấy ghép Implant phục hồi toàn diện cả chân răng và thân răng, đảm bảo ăn nhai thoải mái và thẩm mỹ tự nhiên. Ưu đãi 10% cho khách hàng cấy ghép 2 trụ trở lên. Trụ Implant Straumann (Thụy Sĩ) nhập khẩu chính hãng, bảo hành 10 năm.',
   'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80',
   10.00, NOW(), NOW() + INTERVAL '60 days'),

  -- 8. Giảm 30% — Tẩy trắng Zoom 2
  ('ee88888b-bbbc-4b17-b806-ab8c9c0d2008',
   'Tẩy trắng răng Zoom 2 - Sáng lên 8 tông chỉ trong 45 phút',
   'Tẩy trắng răng',
   'Công nghệ Zoom Laser thế hệ mới, nâng tông răng lên đến 8 tông chỉ sau 1 lần điều trị 45 phút. An toàn tuyệt đối cho men răng, không gây ê buốt. Ưu đãi 30% cho khách hàng mới đăng ký trong tháng. Tặng kèm bộ tẩy trắng tại nhà miễn phí trị giá 800.000đ.',
   'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
   30.00, NOW(), NOW() + INTERVAL '30 days'),

  -- 9. Giảm 50% — Khám gia đình
  ('ee99999c-cccd-4b17-b806-ab8c9c0d3009',
   'Khám răng tổng quát - Ưu đãi đặc biệt cho gia đình',
   'Khám & Điều trị',
   'Khám răng tổng quát định kỳ bao gồm: chụp X-quang, lấy cao răng, kiểm tra sâu răng và tư vấn điều trị miễn phí. Ưu đãi 50% cho gói gia đình từ 3 người trở lên. Phát hiện sớm các vấn đề răng miệng, tiết kiệm tối đa chi phí điều trị.',
   'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=800&q=80',
   50.00, NOW(), NOW() + INTERVAL '45 days'),

  -- 10. Giảm 15% — Nhổ răng khôn
  ('eeaaaaa1-ddde-4b17-b806-ab8c9c0d4010',
   'Nhổ răng khôn không đau - Hồi phục nhanh trong 24h',
   'Khám & Điều trị',
   'Nhổ răng khôn bằng máy siêu âm Piezotome thế hệ mới, không đau, không sưng, lành thương chỉ trong 24-48 giờ. Giảm 15% cho khách hàng nhổ đồng thời 2 răng khôn. Bác sĩ chuyên khoa phẫu thuật miệng giàu kinh nghiệm thực hiện.',
   'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
   15.00, NOW(), NOW() + INTERVAL '60 days')

ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- BẢNG 3: PROMOTION_SERVICES (Liên kết ưu đãi ↔ dịch vụ)
-- ============================================================
INSERT INTO promotion_services (id, promotion_id, service_id)
VALUES
  -- Ưu đãi 1 → Gói can thiệp sớm trẻ em
  ('ff1111aa-1111-4c28-c917-bc9d9c100001', 'ee11111a-aaaa-4b17-b806-ab8c9c0da001', 'a982f674-e3c9-4b17-b806-ab8c9c0d11f1'),
  -- Ưu đãi 2 → ClearCorrect trong suốt
  ('ff2222bb-2222-4c28-c917-bc9d9c100002', 'ee22222b-bbbb-4b17-b806-ab8c9c0db002', 'e505f674-f2a9-4c28-c917-bc9d9c0e25e5'),
  -- Ưu đãi 3 → Hàm duy trì sau niềng
  ('ff3333cc-3333-4c28-c917-bc9d9c100003', 'ee33333c-cccc-4b17-b806-ab8c9c0dc003', 'f606f674-f2a9-4c28-c917-bc9d9c0e26f6'),
  -- Ưu đãi 4 → Invisalign Comprehensive 5 năm
  ('ff4444dd-4444-4c28-c917-bc9d9c100004', 'ee44444d-dddd-4b17-b806-ab8c9c0dd004', 'e606f674-f2a9-4c28-c917-bc9d9c0e26f8'),
  -- Ưu đãi 5 → Invisalign Comprehensive 5 năm
  ('ff5555ee-5555-4c28-c917-bc9d9c100005', 'ee55555e-eeee-4b17-b806-ab8c9c0de005', 'e606f674-f2a9-4c28-c917-bc9d9c0e26f8'),
  -- Ưu đãi 6 → Veneer e.max siêu mỏng
  ('ff6666ff-6666-4c28-c917-bc9d9c100006', 'ee66666f-ffff-4b17-b806-ab8c9c0df006', '7a07f674-4b9a-4c28-c917-bc9d9c0e37a7'),
  -- Ưu đãi 7 → Implant Straumann SLA
  ('ff7777aa-7777-4c28-c917-bc9d9c100007', 'ee77777a-aaab-4b17-b806-ab8c9c0d1007', '3c03f674-e3c9-4b17-b806-ab8c9c0d33c3'),
  -- Ưu đãi 8 → Tẩy trắng Zoom 2
  ('ff8888bb-8888-4c28-c917-bc9d9c100008', 'ee88888b-bbbc-4b17-b806-ab8c9c0d2008', '3c03f674-1234-4c28-c917-bc9d9c0e43c3'),
  -- Ưu đãi 9 → Khám tổng quát & tư vấn
  ('ff9999cc-9999-4c28-c917-bc9d9c100009', 'ee99999c-cccd-4b17-b806-ab8c9c0d3009', '1a01f674-5678-4c28-c917-bc9d9c0e51a1'),
  -- Ưu đãi 10 → Nhổ răng khôn bằng Piezotome
  ('ffaaaaaa-aaaa-4c28-c917-bc9d9c100010', 'eeaaaaa1-ddde-4b17-b806-ab8c9c0d4010', '8b08f674-5678-4c28-c917-bc9d9c0e58b8')

ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- SQL INSERT DATA FOR POSTGRESQL (DENTAL CLINIC SERVICES & PACKAGES)
-- =========================================================================

-- Tự động cập nhật thêm các cột mới vào bảng services trong PostgreSQL nếu chưa tồn tại
ALTER TABLE services ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE services ADD COLUMN IF NOT EXISTS sub_category VARCHAR(255);
ALTER TABLE services ADD COLUMN IF NOT EXISTS unit VARCHAR(100);
ALTER TABLE services ADD COLUMN IF NOT EXISTS image_url VARCHAR(1000);
ALTER TABLE services ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Sử dụng cú pháp ON CONFLICT DO UPDATE để tránh lỗi khóa ngoại (Foreign Key Constraint) với hóa đơn cũ
INSERT INTO services (id, service_name, description, price, category, sub_category, unit, image_url, sort_order, is_featured)
VALUES
  -- ── 1.1 NIỀNG RĂNG (NIENG_RANG) ───────────────────────────────────────────
  (
    'c3b2f674-d4b9-4a06-a795-9bf8b5c907a1',
    'Mắc cài kim loại tiêu chuẩn',
    'Phương pháp niềng răng truyền thống sử dụng mắc cài kim loại cao cấp và dây cung. Hiệu quả cao, bền bỉ và phù hợp cho hầu hết các ca lệch lạc từ trung bình đến phức tạp.',
    25000000.00,
    'NIENG_RANG',
    'Niềng răng mắc cài kim loại',
    'Cả 2 hàm',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80',
    1,
    true
  ),
  (
    'e290f674-d4b9-4a06-a795-9bf8b5c907a2',
    'Mắc cài kim loại tự buộc (Damon)',
    'Hệ thống mắc cài tự đóng thông minh giúp giảm tối đa lực ma sát lên răng, giảm ê nhức đáng kể và rút ngắn tổng thời gian đeo niềng từ 4-6 tháng.',
    35000000.00,
    'NIENG_RANG',
    'Niềng răng mắc cài kim loại',
    'Cả 2 hàm',
    'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=600&q=80',
    2,
    true
  ),
  (
    'f1a3f674-d4b9-4a06-a795-9bf8b5c907a3',
    'Niềng răng mắc cài kim loại trẻ em',
    'Thiết kế mắc cài nhỏ gọn phù hợp với kích thước răng trẻ em từ 8-14 tuổi. Giúp định hướng răng vĩnh viễn mọc đều đẹp ngay từ giai đoạn sớm.',
    20000000.00,
    'NIENG_RANG',
    'Niềng răng mắc cài kim loại',
    'Cả 2 hàm',
    'https://images.unsplash.com/photo-1513415277900-a62401e5084d?auto=format&fit=crop&w=600&q=80',
    3,
    false
  ),
  (
    'a982f674-e3c9-4b17-b806-ab8c9c0d11f1',
    'Gói can thiệp sớm các lệch lạc tiền tăng trưởng - 2 năm (Trẻ em)',
    'Can thiệp sớm các lệch lạc răng mặt ở trẻ em giúp định hướng xương hàm phát triển hài hòa, tạo khoảng trống cho răng vĩnh viễn mọc đúng vị trí, giảm thiểu tối đa việc phải nhổ răng hay phẫu thuật xương hàm sau này.',
    17000000.00,
    'NIENG_RANG',
    'Niềng răng mắc cài kim loại',
    'Gói 2 năm',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80',
    4,
    true
  ),
  (
    'd4b4f674-d4b9-4a06-a795-9bf8b5c907a4',
    'Mắc cài sứ tiêu chuẩn',
    'Mắc cài làm bằng chất liệu sứ cao cấp trùng tông màu răng thật, mang lại tính thẩm mỹ cao giúp khách hàng tự tin giao tiếp trong suốt quá trình niềng.',
    32000000.00,
    'NIENG_RANG',
    'Niềng răng mắc cài sứ',
    'Cả 2 hàm',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80',
    5,
    false
  ),
  (
    'a101f674-f2a9-4c28-c917-bc9d9c0e21a1',
    'Mắc cài sứ tự buộc',
    'Sự kết hợp hoàn hảo giữa tính thẩm mỹ của chất liệu sứ cao cấp và sự tiện lợi, thông minh của cơ chế nắp đóng tự buộc Damon.',
    42000000.00,
    'NIENG_RANG',
    'Niềng răng mắc cài sứ',
    'Cả 2 hàm',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80',
    6,
    true
  ),
  (
    'b202f674-f2a9-4c28-c917-bc9d9c0e22b2',
    'Invisalign Lite (<= 14 khay)',
    'Phương pháp niềng răng trong suốt không mắc cài của Mỹ. Thích hợp cho các ca răng thưa, lệch lạc nhẹ hoặc khách hàng cần căn chỉnh lại sau khi niềng.',
    55000000.00,
    'NIENG_RANG',
    'Niềng răng trong suốt Invisalign',
    'Cả 2 hàm',
    'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=600&q=80',
    7,
    false
  ),
  (
    'e606f674-f2a9-4c28-c917-bc9d9c0e26f7',
    'Gói niềng trong suốt Essentials by Invisalign',
    'Gói niềng răng trong suốt Invisalign cơ bản bao gồm bộ khay niềng thiết kế riêng, hỗ trợ dịch chuyển các ca răng khấp khểnh nhẹ.',
    65000000.00,
    'NIENG_RANG',
    'Niềng răng trong suốt Invisalign',
    'Trọn gói',
    'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=600&q=80',
    8,
    true
  ),
  (
    'c303f674-f2a9-4c28-c917-bc9d9c0e23c3',
    'Invisalign Moderate',
    'Gói niềng răng Invisalign phổ thông phù hợp với các ca răng khấp khểnh, hô móm ở mức độ trung bình. Cần từ 15 đến 26 khay điều trị.',
    70000000.00,
    'NIENG_RANG',
    'Niềng răng trong suốt Invisalign',
    'Cả 2 hàm',
    'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=600&q=80',
    9,
    true
  ),
  (
    'e606f674-f2a9-4c28-c917-bc9d9c0e26f8',
    'Gói niềng trong suốt Invisalign Comprehensive 5 năm',
    'Gói niềng răng trong suốt Invisalign toàn diện nhất của hãng, hỗ trợ điều trị và tinh chỉnh không giới hạn khay trong vòng 5 năm cho các ca cực kỳ phức tạp.',
    130000000.00,
    'NIENG_RANG',
    'Niềng răng trong suốt Invisalign',
    'Trọn gói 5 năm',
    'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=600&q=80',
    10,
    true
  ),
  (
    'e505f674-f2a9-4c28-c917-bc9d9c0e25e5',
    'Niềng răng trong suốt ClearCorrect',
    'Thương hiệu khay niềng trong suốt cao cấp từ tập đoàn Straumann (Thụy Sĩ). Vật liệu ComfortTrack siêu đàn hồi, mang lại cảm giác ôm sát nướu răng và thẩm mỹ tối đa.',
    45000000.00,
    'NIENG_RANG',
    'Niềng răng trong suốt Invisalign',
    'Cả 2 hàm',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80',
    11,
    false
  ),
  (
    'f606f674-f2a9-4c28-c917-bc9d9c0e26f6',
    'Hàm duy trì sau niềng',
    'Hàm duy trì trong suốt tháo lắp giúp ổn định xương ổ răng và nướu sau khi kết thúc liệu trình niềng răng, ngăn ngừa răng chạy lại vị trí cũ.',
    5000000.00,
    'NIENG_RANG',
    'Niềng răng trong suốt Invisalign',
    'Cả 2 hàm',
    'https://images.unsplash.com/photo-1513415277900-a62401e5084d?auto=format&fit=crop&w=600&q=80',
    12,
    false
  ),

  -- ── 1.2 TRỒNG RĂNG IMPLANT (IMPLANT) ─────────────────────────────────────
  (
    '1a01f674-e3c9-4b17-b806-ab8c9c0d31a1',
    'Implant Osstem (Hàn Quốc)',
    'Dòng trụ Implant quốc dân có doanh số hàng đầu châu Á. Tỷ lệ tích hợp xương cao, thiết kế ren xoắn thông minh giúp trụ đứng vững trong xương hàm.',
    19000000.00,
    'IMPLANT',
    'Trụ Implant theo hãng',
    '/trụ',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80',
    13,
    true
  ),
  (
    '2b02f674-e3c9-4b17-b806-ab8c9c0d32b2',
    'Implant Zimmer Biomet (Mỹ)',
    'Dòng trụ phân khúc cao cấp của Mỹ, sử dụng công nghệ xử lý bề mặt Trabecular Metal độc quyền giúp tế bào xương phát triển nhanh chóng vào sâu bên trong thân trụ.',
    32000000.00,
    'IMPLANT',
    'Trụ Implant theo hãng',
    '/trụ',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80',
    14,
    false
  ),
  (
    '3c03f674-e3c9-4b17-b806-ab8c9c0d33c3',
    'Implant Straumann SLA (Thụy Sĩ)',
    'Thương hiệu Implant số 1 thế giới đến từ Thụy Sĩ. Bề mặt xử lý SLA độc quyền giúp rút ngắn thời gian tích hợp xương chỉ còn 6 - 8 tuần thay vì 3 tháng.',
    35000000.00,
    'IMPLANT',
    'Trụ Implant theo hãng',
    '/trụ',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80',
    15,
    true
  ),
  (
    '4d04f674-e3c9-4b17-b806-ab8c9c0d34d4',
    'Implant Nobel Active (Thụy Điển)',
    'Trụ Implant cao cấp thiết kế đặc biệt cho các trường hợp xương hàm mỏng, xốp hoặc cấy ghép phục hình chịu lực tức thì ngay sau khi nhổ răng.',
    38000000.00,
    'IMPLANT',
    'Trụ Implant theo hãng',
    '/trụ',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80',
    16,
    true
  ),
  (
    '5e05f674-e3c9-4b17-b806-ab8c9c0d35e5',
    'Răng sứ Zirconia trên Implant',
    'Mão răng toàn sứ Zirconia lắp trên trụ phục hình thông qua khớp nối Abutment. Độ bền cao, màu sắc tự nhiên hoàn hảo, không đen viền nướu.',
    6000000.00,
    'IMPLANT',
    'Phục hình trên Implant',
    '/răng',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80',
    17,
    false
  ),
  (
    '6f06f674-e3c9-4b17-b806-ab8c9c0d36f6',
    'Cầu răng sứ trên 2 Implant',
    'Giải pháp kinh tế phục hình cho khách hàng mất 3-4 răng liền kề nhau bằng cách cấy 2 trụ Implant nâng đỡ cầu răng sứ gồm 3-4 mão răng bên trên.',
    16000000.00,
    'IMPLANT',
    'Phục hình trên Implant',
    '/cầu',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80',
    18,
    false
  ),
  (
    '7a07f674-e3c9-4b17-b806-ab8c9c0d37a7',
    'Phục hình toàn hàm All-on-4',
    'Phương pháp cấy ghép 4 trụ Implant nâng đỡ toàn bộ cung răng giả 12 răng bên trên. Giải pháp tối ưu cho người mất răng toàn hàm hoặc tiêu xương nặng.',
    120000000.00,
    'IMPLANT',
    'Phục hình trên Implant',
    '/hàm',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80',
    19,
    true
  ),
  (
    '8b08f674-e3c9-4b17-b806-ab8c9c0d38b8',
    'Phục hình toàn hàm All-on-6',
    'Tương tự như All-on-4 nhưng cấy ghép 6 trụ Implant để tăng cường lực ăn nhai chịu lực tốt hơn cho cung hàm lớn hoặc xương hàm có mật độ xốp.',
    145000000.00,
    'IMPLANT',
    'Phục hình trên Implant',
    '/hàm',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80',
    20,
    false
  ),

  -- ── 1.3 RĂNG SỨ THẨM MỸ (RANG_SU) ────────────────────────────────────────
  (
    '1a01f674-4b9a-4c28-c917-bc9d9c0e31a1',
    'Sứ kim loại tiêu chuẩn',
    'Răng sứ có cấu tạo sườn kim loại bên trong và phủ lớp sứ ceramco bên ngoài. Độ bền ăn nhai tốt, chi phí tiết kiệm cho các răng hàm khuất phía trong.',
    2000000.00,
    'RANG_SU',
    'Răng sứ kim loại',
    '/răng',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80',
    21,
    false
  ),
  (
    '2b02f674-4b9a-4c28-c917-bc9d9c0e32b2',
    'Sứ kim loại Titan cao cấp',
    'Sườn bên trong bằng hợp kim Titan y tế sinh học lành tính, giảm thiểu tối đa kích ứng nướu, tăng tính tương thích và tuổi thọ sử dụng.',
    3500000.00,
    'RANG_SU',
    'Răng sứ kim loại',
    '/răng',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80',
    22,
    false
  ),
  (
    '3c03f674-4b9a-4c28-c917-bc9d9c0e33c3',
    'Sứ Cercon (Đức)',
    'Dòng răng toàn sứ cao cấp của Đức làm bằng Zirconia nguyên khối. Độ thấu quang cao, không bị đen viền nướu sau thời gian dài sử dụng.',
    6500000.00,
    'RANG_SU',
    'Răng sứ toàn sứ (Ceramic)',
    '/răng',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80',
    23,
    true
  ),
  (
    '4d04f674-4b9a-4c28-c917-bc9d9c0e34d4',
    'Sứ e.max (Thụy Sĩ)',
    'Sứ thủy tinh e.max nguyên khối có độ trong mờ tự nhiên như răng thật. Khả năng chịu lực uốn cong xuất sắc lên tới 400 MPa.',
    8500000.00,
    'RANG_SU',
    'Răng sứ toàn sứ (Ceramic)',
    '/răng',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80',
    24,
    true
  ),
  (
    '5e05f674-4b9a-4c28-c917-bc9d9c0e35e5',
    'Sứ Zirconia nguyên khối',
    'Chế tác bằng công nghệ CAD/CAM chính xác tuyệt đối. Độ cứng siêu việt lên đến 1200 MPa, thích hợp phục hình răng hàm chịu lực lớn.',
    7000000.00,
    'RANG_SU',
    'Răng sứ toàn sứ (Ceramic)',
    '/răng',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80',
    25,
    false
  ),
  (
    '6f06f674-4b9a-4c28-c917-bc9d9c0e36f6',
    'Mặt dán sứ Veneer Composite',
    'Phương pháp cải thiện thẩm mỹ nụ cười nhanh chóng bằng cách phủ lớp nhựa composite thẩm mỹ trực tiếp lên bề mặt răng thật.',
    3000000.00,
    'RANG_SU',
    'Răng Veneer thẩm mỹ',
    '/răng',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80',
    26,
    false
  ),
  (
    '7a07f674-4b9a-4c28-c917-bc9d9c0e37a7',
    'Mặt dán sứ Veneer e.max siêu mỏng',
    'Đỉnh cao phục hình thẩm mỹ răng miệng. Mặt dán sứ siêu mỏng chỉ từ 0.3mm - 0.5mm dán lên bề mặt răng, bảo tồn 100% tủy răng và hạn chế tối đa mài răng thật.',
    9000000.00,
    'RANG_SU',
    'Răng Veneer thẩm mỹ',
    '/răng',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80',
    27,
    true
  ),

  -- ── 1.4 TẨY TRẮNG RĂNG (TAY_TRANG) ───────────────────────────────────────
  (
    '1a01f674-1234-4c28-c917-bc9d9c0e41a1',
    'Tẩy trắng răng đèn Plasma',
    'Sử dụng ánh sáng xanh Plasma hoạt hóa gel tẩy trắng bôi trên bề mặt răng. Hiệu quả nhanh chóng chỉ sau 60 phút nằm ghế tại phòng khám.',
    1500000.00,
    'TAY_TRANG',
    'Tẩy trắng tại phòng khám',
    '/lần',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80',
    28,
    false
  ),
  (
    '2b02f674-1234-4c28-c917-bc9d9c0e42b2',
    'Gói tẩy trắng Laser Whitening trọn gói',
    'Ứng dụng bước sóng ánh sáng Laser hiện đại phá hủy liên kết phân tử tạo màu trên răng tận sâu bên trong ngà răng kết hợp bộ máng và gel tẩy trắng duy trì tại nhà.',
    2500000.00,
    'TAY_TRANG',
    'Tẩy trắng tại phòng khám',
    'Liệu trình',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80',
    29,
    true
  ),
  (
    '3c03f674-1234-4c28-c917-bc9d9c0e43c3',
    'Tẩy trắng răng Zoom 2 (Mỹ)',
    'Hệ thống tẩy trắng hàng đầu Hoa Kỳ với đèn Zoom phát nhiệt thấp. Nâng tông tối đa từ 6 - 8 cấp độ sáng một cách an toàn nhất.',
    3500000.00,
    'TAY_TRANG',
    'Tẩy trắng tại phòng khám',
    '/lần',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80',
    30,
    true
  ),
  (
    '4d04f674-1234-4c28-c917-bc9d9c0e44d4',
    'Bộ máng tẩy trắng tại nhà',
    'Bộ máng nhựa dẻo thiết kế ôm khít răng kèm theo thuốc tẩy trắng nồng độ nhẹ. Giúp khách hàng chủ động tự tẩy răng tại nhà vô cùng tiện lợi.',
    800000.00,
    'TAY_TRANG',
    'Tẩy trắng tại nhà',
    '/bộ',
    'https://images.unsplash.com/photo-1513415277900-a62401e5084d?auto=format&fit=crop&w=600&q=80',
    31,
    false
  ),
  (
    '5e05f674-1234-4c28-c917-bc9d9c0e45e5',
    'Gel tẩy trắng bổ sung Opalescence',
    'Tuýp gel tẩy trắng chính hãng Opalescence (Mỹ) nồng độ 10% - 15% - 20% dùng để tra thêm vào máng duy trì tẩy trắng răng định kỳ.',
    250000.00,
    'TAY_TRANG',
    'Tẩy trắng tại nhà',
    '/tuýp',
    'https://images.unsplash.com/photo-1513415277900-a62401e5084d?auto=format&fit=crop&w=600&q=80',
    32,
    false
  ),

  -- ── 1.5 KHÁM & ĐIỀU TRỊ TỔNG QUÁT (KHAM_DIEU_TRI) ────────────────────────
  (
    '1a01f674-5678-4c28-c917-bc9d9c0e51a1',
    'Khám răng tổng quát & tư vấn chuyên sâu',
    'Quy trình kiểm tra toàn diện sức khỏe răng miệng bao gồm: khám lợi, kiểm tra sâu răng, phát hiện sớm các bệnh lý nha chu. Hoàn toàn miễn phí.',
    0.00,
    'KHAM_DIEU_TRI',
    'Khám & Chẩn đoán',
    '/lần',
    'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=600&q=80',
    33,
    true
  ),
  (
    '2b02f674-5678-4c28-c917-bc9d9c0e52b2',
    'Chụp X-quang toàn cảnh Panorama',
    'Sử dụng máy chụp kỹ thuật số hiện đại khảo sát toàn bộ cấu trúc xương hàm, răng và hệ thống dây thần kinh hỗ trợ lập kế hoạch điều trị chỉnh nha.',
    200000.00,
    'KHAM_DIEU_TRI',
    'Khám & Chẩn đoán',
    '/lần',
    'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=600&q=80',
    34,
    false
  ),
  (
    '3c03f674-5678-4c28-c917-bc9d9c0e53c3',
    'Chụp X-quang CBCT 3D khảo sát xương',
    'Công nghệ chụp cắt lớp vi tính hình nón cung cấp hình ảnh 3 chiều chi tiết của xương hàm, phục vụ đắc lực cho cấy cấy ghép Implant và nhổ răng khôn lệch mọc ngầm.',
    450000.00,
    'KHAM_DIEU_TRI',
    'Khám & Chẩn đoán',
    '/lần',
    'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=600&q=80',
    35,
    false
  ),
  (
    '4d04f674-5678-4c28-c917-bc9d9c0e54d4',
    'Lấy cao răng siêu âm & đánh bóng',
    'Sử dụng đầu rung siêu âm loại bỏ hoàn toàn mảng bám, vôi răng dưới nướu gây viêm lợi, kết hợp đánh bóng bằng bột nha khoa chất lượng cao giúp bề mặt răng trơn láng.',
    300000.00,
    'KHAM_DIEU_TRI',
    'Điều trị cơ bản',
    '/lần',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80',
    36,
    true
  ),
  (
    '5e05f674-5678-4c28-c917-bc9d9c0e55e5',
    'Trám răng thẩm mỹ Composite',
    'Trám khôi phục hình dạng răng bị sâu nhẹ hoặc sứt mẻ bằng chất liệu Composite thẩm mỹ đồng màu răng, hóa cứng nhanh bằng đèn Halogen.',
    400000.00,
    'KHAM_DIEU_TRI',
    'Điều trị cơ bản',
    '/răng',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80',
    37,
    false
  ),
  (
    '6f06f674-5678-4c28-c917-bc9d9c0e56f6',
    'Điều trị tủy răng (Nội nha)',
    'Loại bỏ triệt để phần tủy răng bị viêm nhiễm, làm sạch ống tủy và trám bít kín khít ngăn ngừa nhiễm trùng tái phát. Giúp bảo tồn tối đa cấu trúc răng thật.',
    1200000.00,
    'KHAM_DIEU_TRI',
    'Điều trị cơ bản',
    '/răng',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80',
    38,
    false
  ),
  (
    '7a07f674-5678-4c28-c917-bc9d9c0e57a7',
    'Nhổ răng thường lung lay',
    'Quy trình nhổ răng nhẹ nhàng cho các răng sữa đến tuổi thay hoặc răng vĩnh viễn bị lung lay nặng do viêm nha chu không thể bảo tồn.',
    200000.00,
    'KHAM_DIEU_TRI',
    'Điều trị cơ bản',
    '/răng',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80',
    39,
    false
  ),
  (
    '8b08f674-5678-4c28-c917-bc9d9c0e58b8',
    'Nhổ răng khôn mọc lệch bằng Piezotome',
    'Ứng dụng công nghệ nhổ răng bằng sóng siêu âm Piezotome không gây tổn thương mô mềm xung quanh răng, hạn chế đau đớn, sưng nề tối đa và lành thương siêu tốc.',
    1500000.00,
    'KHAM_DIEU_TRI',
    'Điều trị cơ bản',
    '/răng',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80',
    40,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  service_name = EXCLUDED.service_name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  sub_category = EXCLUDED.sub_category,
  unit = EXCLUDED.unit,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  is_featured = EXCLUDED.is_featured;

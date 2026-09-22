-- =============================================================================
-- KỊCH BẢN NẠP 50 DỮ LIỆU THUỐC NHA KHOA CHUẨN Y KHOA (POSTGRESQL)
-- Đầy đủ thuộc tính: code, name, unit, manufacturer, stock_quantity, price,
-- manufacture_date, expiry_date, description, usage_instruction, status ('ACTIVE' / 'INACTIVE')
-- =============================================================================

-- 1. Đảm bảo cấu trúc cột của bảng medicines
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS unit VARCHAR(255);
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(255);
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS price NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS manufacture_date DATE;
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS usage_instruction TEXT;
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Tạo unique index trên cột code để tránh trùng mã thuốc
CREATE UNIQUE INDEX IF NOT EXISTS uk_medicines_code ON medicines (code);

-- 2. Nạp 50 thuốc nha khoa chuyên dụng
INSERT INTO medicines (id, code, name, unit, manufacturer, stock_quantity, price, manufacture_date, expiry_date, description, usage_instruction, status, created_at, updated_at)
VALUES
  -- ── NHÓM 1: KHÁNG SINH ĐIỀU TRỊ NHIỄM KHUẨN RĂNG MIỆNG (1 - 13) ──────────────
  (
    '01a11111-1111-1111-1111-111111111101', 'MED-AMOX-500', 'Amoxicillin 500mg', 'Viên nang',
    'Dược Hậu Giang (DHG)', 350, 2500.00, '2025-01-10', '2027-01-10',
    'Kháng sinh phổ rộng nhóm Penicillin điều trị nhiễm trùng răng miệng, áp xe quanh cuống, viêm tủy cấp tính.',
    'Ngày uống 3 lần, mỗi lần 1 viên sau ăn (cách nhau 8 giờ)',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111102', 'MED-AUG-625', 'Augmentin 625mg', 'Viên nén bao phim',
    'GlaxoSmithKline (GSK)', 180, 18500.00, '2025-02-15', '2027-02-15',
    'Kháng sinh phối hợp Amoxicillin + Acid Clavulanic đặc trị nhiễm khuẩn răng hàm mặt nặng, viêm mô tế bào sau nhổ răng.',
    'Ngày uống 2 lần, mỗi lần 1 viên sau bữa ăn sáng và tối',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111103', 'MED-AUG-1000', 'Augmentin 1g', 'Viên nén bao phim',
    'GlaxoSmithKline (GSK)', 120, 24000.00, '2025-03-01', '2027-03-01',
    'Kháng sinh hàm lượng cao dùng cho các ca viêm quanh chóp răng lan rộng, nhiễm khuẩn sau phẫu thuật xương hàm.',
    'Ngày uống 2 lần, mỗi lần 1 viên ngay trước bữa ăn',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111104', 'MED-CLAM-500', 'Clamoxyl 500mg', 'Viên nang',
    'GlaxoSmithKline (GSK)', 150, 6000.00, '2024-11-20', '2026-11-20',
    'Kháng sinh Amoxicillin tinh khiết, điều trị dự phòng viêm màng trong tim trước thủ thuật nhổ răng có chảy máu.',
    'Ngày uống 3 lần, mỗi lần 1 viên sau ăn, uống với nhiều nước',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111105', 'MED-SPI-15M', 'Spiramycin 1.5 MUI (Rovamycine)', 'Viên nén bao phim',
    'Sanofi Aventis', 200, 8500.00, '2025-01-05', '2027-01-05',
    'Kháng sinh nhóm Macrolid thấm rất tốt vào mô nha chu và tuyến nước bọt, điều trị viêm nướu, viêm nha chu.',
    'Ngày uống 2 lần, mỗi lần 1 viên trước bữa ăn ít nhất 2 giờ',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111106', 'MED-RODO-250', 'Rodogyl', 'Viên nén bao phim',
    'Sanofi Aventis', 300, 7200.00, '2025-02-10', '2027-02-10',
    'Phối hợp Spiramycin và Metronidazole, thuốc đầu tay điều trị nhiễm trùng răng miệng cấp và mạn tính, viêm nướu hoại tử lở loét.',
    'Ngày uống 2 lần, mỗi lần 2 viên trong hoặc ngay sau bữa ăn',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111107', 'MED-METRO-250', 'Metronidazole 250mg (Klion)', 'Viên nén',
    'Gedeon Richter', 250, 1800.00, '2024-10-15', '2026-10-15',
    'Kháng sinh diệt vi khuẩn kỵ khí cực mạnh, đặc trị vi khuẩn gram âm trong viêm quanh cuống răng và túi mủ nha chu.',
    'Ngày uống 3 lần, mỗi lần 1 viên sau ăn no, kiêng bia rượu',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111108', 'MED-CLIN-300', 'Clindamycin 300mg (Dalacin C)', 'Viên nang',
    'Pfizer', 90, 14000.00, '2025-01-18', '2027-01-18',
    'Kháng sinh thâm nhập tốt vào mô xương, chỉ định thay thế hàng đầu khi bệnh nhân dị ứng Penicillin trong phẫu thuật cấy ghép Implant.',
    'Ngày uống 3 lần, mỗi lần 1 viên với 1 ly nước đầy, không nằm ngay sau uống',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111109', 'MED-ZIN-500', 'Zinnat 500mg (Cefuroxime Axetil)', 'Viên nén bao phim',
    'GlaxoSmithKline (GSK)', 110, 26500.00, '2025-04-01', '2027-04-01',
    'Kháng sinh Cephalosporin thế hệ 2 điều trị nhiễm trùng xoang hàm trên có nguồn gốc do răng, viêm mô tế bào sau nhổ răng.',
    'Ngày uống 2 lần, mỗi lần 1 viên ngay sau bữa ăn',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111110', 'MED-AZI-500', 'Azithromycin 500mg (Zithromax)', 'Viên nén bao phim',
    'Pfizer', 80, 32000.00, '2025-03-10', '2027-03-10',
    'Kháng sinh Macrolid bán thải dài, dùng phác đồ 3 ngày tiện lợi cho bệnh nhân viêm nha chu xâm lấn tiến triển nhanh.',
    'Uống 1 viên/ngày duy nhất, uống trước ăn 1 giờ hoặc sau ăn 2 giờ trong 3 ngày',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111111', 'MED-CIPRO-500', 'Ciprofloxacin 500mg', 'Viên nén bao phim',
    'Dược Hậu Giang (DHG)', 140, 3500.00, '2024-12-01', '2026-12-01',
    'Kháng sinh nhóm Quinolon dùng trong các trường hợp nhiễm khuẩn răng miệng đề kháng, viêm xoang hàm phối hợp.',
    'Ngày uống 2 lần, mỗi lần 1 viên sau ăn, uống cùng nhiều nước',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111112', 'MED-CEPH-500', 'Cephalexin 500mg', 'Viên nang',
    'Mekophar', 180, 2000.00, '2024-09-10', '2026-09-10',
    'Kháng sinh Cephalosporin thế hệ 1 dự phòng nhiễm khuẩn sau nhổ răng thông thường và tiểu phẫu nạo túi nha chu.',
    'Ngày uống 3 lần, mỗi lần 1 viên cách mỗi 8 giờ sau ăn',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111113', 'MED-DOXY-100', 'Doxycycline 100mg', 'Viên nang',
    'Dược Domesco', 160, 2800.00, '2025-02-01', '2027-02-01',
    'Ức chế enzym collagenase mô nha chu, liều thấp hỗ trợ làm chậm tiêu xương ổ răng ở bệnh nhân viêm nha chu mạn.',
    'Ngày uống 1-2 lần, mỗi lần 1 viên với ly nước đầy sau bữa ăn',
    'ACTIVE', NOW(), NOW()
  ),

  -- ── NHÓM 2: GIẢM ĐAU - KHÁNG VIÊM - PHÙ NỀ NHA KHOA (14 - 26) ─────────────
  (
    '01a11111-1111-1111-1111-111111111114', 'MED-PARA-500', 'Paracetamol 500mg', 'Viên nén',
    'Dược Hậu Giang (DHG)', 500, 1000.00, '2025-01-01', '2028-01-01',
    'Thuốc giảm đau hạ sốt mức độ nhẹ đến vừa sau nhổ răng thông thường, cạo vôi răng hoặc gắn khí cụ chỉnh nha.',
    'Uống 1 viên khi đau hoặc sốt, cách nhau 4-6 giờ (tối đa 4 viên/ngày)',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111115', 'MED-PANADOL-EX', 'Panadol Extra', 'Viên nén đỏ',
    'GlaxoSmithKline (GSK)', 400, 2200.00, '2025-02-05', '2027-08-05',
    'Giảm đau răng cấp tốc, tăng cường hiệu quả giảm đau nhờ phối hợp Paracetamol 500mg và Caffeine 65mg.',
    'Uống 1-2 viên khi đau, cách nhau tối thiểu 4-6 giờ (tối đa 8 viên/ngày)',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111116', 'MED-EF-500', 'Efferalgan 500mg sủi', 'Viên sủi',
    'UPSA SAS (Pháp)', 220, 4500.00, '2025-03-15', '2027-03-15',
    'Thuốc sủi tan nhanh, hấp thu nhanh giảm đau nhức răng tức thì, phù hợp người đau răng khó nuốt viên nén.',
    'Hòa tan 1 viên vào nửa ly nước lọc, uống khi đau, cách nhau 4-6 giờ',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111117', 'MED-EF-COD', 'Efferalgan Codeine', 'Viên sủi',
    'UPSA SAS (Pháp)', 140, 8900.00, '2025-01-20', '2027-01-20',
    'Phối hợp Paracetamol 500mg + Codein phosphate 30mg, giảm đau mức độ trung bình đến nặng sau phẫu thuật nhổ răng khôn mọc lệch.',
    'Hòa tan 1 viên vào nước uống khi đau nhiều, cách nhau ít nhất 6 giờ',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111118', 'MED-IBU-400', 'Ibuprofen 400mg', 'Viên nén bao phim',
    'Stella Pharm', 300, 2400.00, '2025-01-10', '2027-01-10',
    'Thuốc kháng viêm không steroid (NSAID) giảm đau răng, sưng nướu cực kỳ hiệu quả sau khi chữa tủy và phẫu thuật nướu.',
    'Ngày uống 2-3 lần, mỗi lần 1 viên sau khi ăn no',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111119', 'MED-MELOX-75', 'Meloxicam 7.5mg', 'Viên nén',
    'Boston Pharma', 150, 3200.00, '2025-02-25', '2027-02-25',
    'Kháng viêm ức chế chọn lọc COX-2, giảm phù nề má và đau sau phẫu thuật cấy ghép Implant, ít tác dụng phụ dạ dày.',
    'Ngày uống 1 lần, mỗi lần 1-2 viên sau bữa ăn trưa',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111120', 'MED-VOLT-50', 'Voltaren 50mg (Diclofenac)', 'Viên bao tan ruột',
    'Novartis', 180, 7500.00, '2025-01-15', '2027-01-15',
    'Kháng viêm giảm đau mạnh dùng trong các cơn đau tủy răng cấp dữ dội và sau phẫu thuật cắt chóp răng, nạo nang chân răng.',
    'Ngày uống 2 lần, mỗi lần 1 viên sau khi ăn no, nuốt nguyên viên',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111121', 'MED-CELE-200', 'Celebrex 200mg (Celecoxib)', 'Viên nang',
    'Pfizer', 120, 38000.00, '2025-03-01', '2027-03-01',
    'Kháng viêm chọn lọc COX-2 cao cấp, kiểm soát đau và phù nề sau phẫu thuật chỉnh hình hàm mặt và nhổ nhiều răng khôn cùng lúc.',
    'Ngày uống 1 lần, mỗi lần 1 viên sau bữa ăn',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111122', 'MED-ALPHACHOAY', 'Alpha Choay (Alphachymotrypsin)', 'Viên ngậm',
    'Sanofi Aventis', 450, 4200.00, '2025-02-01', '2027-02-01',
    'Men kháng viêm chống phù nề dạng ngậm dưới lưỡi, chống bầm tím và sưng nề mô mềm sau phẫu thuật miệng.',
    'Ngậm dưới lưỡi 2 viên/lần, ngày 3-4 lần để tan từ từ',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111123', 'MED-KATADOL', 'Katrypsin (Chymotrypsin 4200 IU)', 'Viên nén',
    'Dược Vacopharm', 250, 2500.00, '2024-11-15', '2026-11-15',
    'Thuốc kháng viêm dạng men giảm tụ máu, giảm phù nề vùng niêm mạc miệng sau chấn thương hoặc nhổ răng tiểu phẫu.',
    'Ngày uống 3 lần, mỗi lần 2 viên sau ăn với 1 ly nước đầy',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111124', 'MED-PRED-5', 'Prednisolone 5mg', 'Viên nén',
    'Dược Pharbaco', 200, 1200.00, '2025-01-12', '2027-01-12',
    'Corticoid kháng viêm mạnh dùng ngắn ngày (2-3 ngày) trong các trường hợp sưng to sau mở xương nhổ răng khôn ngầm.',
    'Uống 2-4 viên 1 lần duy nhất vào buổi sáng sau ăn no trong 2-3 ngày',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111125', 'MED-DEXA-05', 'Dexamethasone 0.5mg', 'Viên nén',
    'Dược Hậu Giang (DHG)', 180, 800.00, '2024-10-20', '2026-10-20',
    'Kháng viêm glucocorticoid chống phản ứng viêm dữ dội và co thắt mô hạt quanh cuống răng.',
    'Uống 1-2 viên vào buổi sáng sau ăn theo đúng chỉ định bác sĩ',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111126', 'MED-TRAMA-50', 'Tramadol 50mg', 'Viên nang',
    'Stada Arzneimittel', 60, 9500.00, '2025-01-05', '2027-01-05',
    'Thuốc giảm đau trung ương dùng trong các ca đau dữ dội sau phẫu thuật xương hàm phức tạp khi NSAIDs không đủ hiệu quả.',
    'Uống 1 viên khi đau dữ dội, cách nhau tối thiểu 6 giờ (theo đơn)',
    'ACTIVE', NOW(), NOW()
  ),

  -- ── NHÓM 3: THUỐC TÊ NHA KHOA TẠI CHỖ & BÔI TÊ (27 - 32) ───────────────────
  (
    '01a11111-1111-1111-1111-111111111127', 'MED-LIDO-2', 'Lidocaine 2% with Epinephrine 1:100.000', 'Ống tiêm',
    'Septodont (Pháp)', 250, 22000.00, '2025-02-20', '2027-02-20',
    'Thuốc tê dạng ống nha khoa 1.8ml tiêu chuẩn, gây tê tiêm ngấm và gây tê vùng thần kinh hàm dưới, có co mạch giảm chảy máu.',
    'Tiêm tê tại chỗ hoặc gây tê vùng theo chỉ định thủ thuật của nha sĩ',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111128', 'MED-SEPT-4', 'Septanest 4% with Adrenaline 1:100.000', 'Ống tiêm',
    'Septodont (Pháp)', 200, 28000.00, '2025-03-05', '2027-03-05',
    'Thuốc tê Articaine khuếch tán qua vỏ xương cực tốt, gây tê tủy răng êm ái, nhổ răng khó và cắm trụ Implant.',
    'Tiêm tê tại chỗ hoặc tiêm ngấm xương vỏ theo chỉ định của nha sĩ',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111129', 'MED-SCAN-3', 'Scandonest 3% Plain (Mepivacaine)', 'Ống tiêm',
    'Septodont (Pháp)', 120, 26000.00, '2025-01-15', '2027-01-15',
    'Thuốc tê không chứa chất co mạch (không Adrenaline), an toàn tuyệt đối cho bệnh nhân cao huyết áp, tim mạch, cường giáp.',
    'Gây tê vùng/tiêm ngấm cho người có bệnh lý tim mạch, cao huyết áp theo chỉ định nha sĩ',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111130', 'MED-XYLO-SPRAY', 'Xylocaine Spray 10%', 'Chai xịt',
    'AstraZeneca', 15, 340000.00, '2024-12-10', '2026-12-10',
    'Thuốc tê xịt bề mặt niêm mạc miệng chai 50ml, chống nôn khi lấy dấu răng và trước khi chích tê tại chỗ.',
    'Xịt 1-2 nhát vào vị trí niêm mạc cần gây tê trước thủ thuật 1-2 phút',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111131', 'MED-EMLA-5', 'EMLA Cream 5%', 'Tuýp',
    'AstraZeneca', 25, 145000.00, '2025-02-10', '2027-02-10',
    'Kem bôi tê bề mặt niêm mạc lợi (Lidocaine + Prilocaine) giảm đau khi chích kim gây tê cho trẻ em và người sợ đau.',
    'Bôi một lớp mỏng lên niêm mạc cần gây tê trước khi chích tê 3-5 phút',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111132', 'MED-BENZO-20', 'Benzocaine 20% Gel (Hurricaine)', 'Hũ',
    'Beutlich Pharmaceuticals', 20, 285000.00, '2025-01-25', '2027-01-25',
    'Gel bôi tê bề mặt tác dụng nhanh trong 30 giây vị anh đào dễ chịu, dùng trước khi tiêm tê và cạo vôi dưới nướu.',
    'Dùng tăm bông lấy một lượng nhỏ gel bôi lên niêm mạc trong 30 giây',
    'ACTIVE', NOW(), NOW()
  ),

  -- ── NHÓM 4: NƯỚC SÚC MIỆNG & SÁT KHUẨN KHOANG MIỆNG (33 - 38) ──────────────
  (
    '01a11111-1111-1111-1111-111111111133', 'MED-KIN-GING', 'Nước súc miệng Kin Gingival 0.12%', 'Chai',
    'Laboratorios KIN (Tây Ban Nha)', 80, 135000.00, '2025-03-12', '2028-03-12',
    'Dung dịch súc miệng chứa Chlorhexidine Digluconate 0.12% và Alpantha, bảo vệ nướu răng, dự phòng viêm nha chu và phục hồi sau nhổ răng.',
    'Súc miệng 15ml nguyên chất trong 30-60 giây, ngày 2 lần sau khi chải răng (không nuốt)',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111134', 'MED-MEDORAL', 'Medoral Nước súc miệng 0.2%', 'Chai',
    'Dược Merap', 90, 95000.00, '2025-02-18', '2028-02-18',
    'Sát khuẩn họng miệng phổ rộng, ngừa mảng bám vi khuẩn sau phẫu thuật nha khoa, không gây cay rát niêm mạc.',
    'Súc miệng 10-15ml trong 1 phút, ngày 2 lần sau ăn, không ăn uống trong 30 phút sau súc',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111135', 'MED-BETA-GARG', 'Betadine Gargle & Mouthwash 1%', 'Chai',
    'Mundipharma', 100, 75000.00, '2025-01-10', '2027-07-10',
    'Dung dịch súc miệng diệt khuẩn, nấm và virus khoang miệng, dùng sát khuẩn miệng trước thủ thuật phẫu thuật.',
    'Pha loãng với nước ấm tỉ lệ 1:1, súc miệng và họng trong 30 giây, ngày 2-3 lần',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111136', 'MED-POVI-10', 'Povidone Iodine 10%', 'Chai',
    'Dược Pharmedic', 60, 25000.00, '2024-11-05', '2026-11-05',
    'Dung dịch bôi sát trùng phẫu trường trong miệng và quanh môi trước khi cấy ghép Implant hoặc nhổ răng tiểu phẫu.',
    'Dùng gạc vô khuẩn thấm dung dịch sát khuẩn phẫu trường trước phẫu thuật',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111137', 'MED-ELUDRIL', 'Eludril Classic Nước súc miệng', 'Chai',
    'Pierre Fabre Medicament (Pháp)', 50, 140000.00, '2025-02-01', '2028-02-01',
    'Phối hợp Chlorhexidine 0.10% và Chlorobutanol 0.5%, vừa kháng khuẩn vừa làm dịu cơn đau rát nướu răng.',
    'Pha 10-15ml dung dịch vào cốc nước ấm đến vạch, súc miệng ngày 2-3 lần',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111138', 'MED-NACL-09', 'Nước muối sinh lý NaCl 0.9%', 'Chai',
    'Dược Vĩnh Phúc', 300, 8000.00, '2025-01-01', '2028-01-01',
    'Dung dịch đẳng trương dùng rửa ổ răng sau nhổ, bơm rửa ống tủy răng và súc miệng vệ sinh răng miệng hằng ngày.',
    'Súc miệng thật nhẹ nhàng sau mỗi bữa ăn và trước khi đi ngủ, ngày 3-4 lần',
    'ACTIVE', NOW(), NOW()
  ),

  -- ── NHÓM 5: GEL BÔI NHIỆT MIỆNG, NHA CHU, VẾT LOÉT (39 - 44) ───────────────
  (
    '01a11111-1111-1111-1111-111111111139', 'MED-KAMI-GEL', 'Kamistad Gel N 10g', 'Tuýp',
    'STADA Arzneimittel (Đức)', 75, 52000.00, '2025-02-20', '2028-02-20',
    'Chiết xuất hoa cúc kết hợp Lidocaine, giảm đau chống viêm loét niêm mạc miệng, nhiệt miệng, đau do đeo hàm giả hoặc niềng răng.',
    'Bôi một lượng gel cỡ hạt đậu lên vùng niêm mạc tổn thương, ngày 3 lần sau ăn',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111140', 'MED-GENG-GEL', 'Gengigel Nha Chu 20ml', 'Tuýp',
    'Ricerfarma (Ý)', 40, 290000.00, '2025-03-05', '2028-03-05',
    'Gel sinh học Hyaluronic Acid 0.2% thúc đẩy lành thương nướu, tái tạo mô nha chu sau cạo vôi sâu và phẫu thuật lật vạt.',
    'Bôi trực tiếp gel lên vùng nướu viêm sau khi vệ sinh răng, massage nhẹ 1-2 phút, ngày 3-4 lần',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111141', 'MED-METRO-DENT', 'Metrogyl Denta Gel 10g', 'Tuýp',
    'Unique Pharmaceutical Laboratories', 85, 48000.00, '2025-01-15', '2027-01-15',
    'Phối hợp Metronidazole và Chlorhexidine dạng gel bôi nha chu, đặc trị viêm nướu chảy máu chân răng và viêm quanh thân răng khôn.',
    'Thoa gel vào túi nha chu hoặc chân răng viêm ngày 2 lần sau khi chải răng sạch',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111142', 'MED-PERIO-GEL', 'Periokin Gel 30ml (Chlorhexidine 0.2%)', 'Tuýp',
    'Laboratorios KIN (Tây Ban Nha)', 35, 165000.00, '2025-02-14', '2027-08-14',
    'Gel bám dính sinh học kháng khuẩn tại chỗ quanh cổ Implant và túi lợi sâu, chống viêm quanh Implant.',
    'Bôi gel quanh cổ Implant hoặc vùng nướu tổn thương ngày 2-3 lần sau ăn',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111143', 'MED-ZYTEE-RB', 'Zytee RB Gel 10ml', 'Tuýp',
    'Raptakos Brett', 60, 38000.00, '2024-10-10', '2026-10-10',
    'Choline Salicylate giảm đau nhanh các vết trợt loét do cọ xát dây cung niềng răng trong vòng 3-4 phút.',
    'Nhỏ 1-2 giọt gel lên đầu ngón tay sạch, thoa nhẹ lên vết trợt loét ngày 3-4 lần',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111144', 'MED-ORACORTIA', 'Oracortia Mouthpaste (Triamcinolone 0.1%)', 'Gói',
    'Mega Lifesciences', 150, 16000.00, '2025-01-10', '2027-01-10',
    'Corticoid dạng mỡ dính niêm mạc điều trị loét aphthe tái phát nặng, viêm môi bong vảy do dị ứng.',
    'Bôi một lượng nhỏ lên vết loét trước khi đi ngủ hoặc sau ăn ngày 2-3 lần (không chà xát)',
    'ACTIVE', NOW(), NOW()
  ),

  -- ── NHÓM 6: THUỐC CẦM MÁU & HỖ TRỢ ĐIỀU TRỊ HẬU PHẪU (45 - 50) ─────────────
  (
    '01a11111-1111-1111-1111-111111111145', 'MED-SPONGO', 'Bọt xốp cầm máu Spongostan Dental', 'Hộp',
    'Johnson & Johnson (Mỹ)', 30, 420000.00, '2024-12-05', '2027-12-05',
    'Miếng xốp Gelatin cầm máu tự tiêu đặt vào huyệt ổ răng sau nhổ, giúp hình thành cục máu đông nhanh và chống chảy máu tái phát.',
    'Đặt trực tiếp miếng xốp vào ổ răng sau nhổ, cắn gạc chặt trong 30-45 phút',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111146', 'MED-TRANS-500', 'Transamin 500mg (Acid Tranexamic)', 'Viên nén',
    'Daiichi Sankyo', 100, 6800.00, '2025-01-20', '2027-01-20',
    'Thuốc cầm máu chống tiêu Fibrin dùng đường uống trước và sau phẫu thuật nhổ răng phức tạp ở người có cơ địa dễ chảy máu.',
    'Ngày uống 2-3 lần, mỗi lần 1 viên sau ăn để hỗ trợ cầm máu theo đơn',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111147', 'MED-BIOFLORA', 'Men vi sinh Bioflora 250mg', 'Gói',
    'Biocodex (Pháp)', 120, 11500.00, '2025-03-01', '2027-03-01',
    'Bổ sung nấm men Saccharomyces boulardii phòng ngừa tiêu chảy và rối loạn tiêu hóa khi uống kháng sinh nha khoa liều cao kéo dài.',
    'Hòa tan gói men vào nước ấm hoặc uống trực tiếp, ngày 1-2 gói cách xa thời điểm uống kháng sinh 2 giờ',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111148', 'MED-OMEP-20', 'Omeprazole 20mg', 'Viên nang',
    'Dược Hậu Giang (DHG)', 200, 2000.00, '2025-01-05', '2028-01-05',
    'Ức chế bơm proton bảo vệ niêm mạc dạ dày khi kê đơn thuốc kháng viêm NSAIDs giảm đau sau phẫu thuật răng hàm mặt.',
    'Uống 1 viên trước bữa ăn sáng 30 phút',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111149', 'MED-VITC-500', 'Vitamin C 500mg', 'Viên nén',
    'Dược Mekophar', 300, 1500.00, '2025-02-10', '2028-02-10',
    'Tăng sức bền thành mạch, giảm chảy máu chân răng và tăng cường tổng hợp collagen làm nhanh lành thương nướu răng.',
    'Ngày uống 1 lần, 1 viên sau bữa ăn sáng (không uống vào buổi tối)',
    'ACTIVE', NOW(), NOW()
  ),
  (
    '01a11111-1111-1111-1111-111111111150', 'MED-ENAMELAST', 'Véc-ni Fluoride Enamelast 5% NaF', 'Tuýp',
    'Ultradent Products (Mỹ)', 50, 85000.00, '2025-03-10', '2027-09-10',
    'Vecni bôi phóng thích fluor kéo dài, đặc trị ê buốt cổ chân răng và ngừa sâu răng tái phát quanh mắc cài niềng răng.',
    'Lau khô bề mặt răng, quét một lớp vecni mỏng lên vùng cổ răng ê buốt theo chỉ định nha sĩ',
    'ACTIVE', NOW(), NOW()
  )

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  unit = EXCLUDED.unit,
  manufacturer = EXCLUDED.manufacturer,
  stock_quantity = EXCLUDED.stock_quantity,
  price = EXCLUDED.price,
  manufacture_date = EXCLUDED.manufacture_date,
  expiry_date = EXCLUDED.expiry_date,
  description = EXCLUDED.description,
  usage_instruction = EXCLUDED.usage_instruction,
  status = EXCLUDED.status,
  updated_at = NOW();

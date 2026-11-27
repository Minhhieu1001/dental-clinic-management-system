-- ============================================================================
-- data.sql — Dữ liệu khởi tạo chuẩn Production cho Nha khoa Crown Dental
-- Tương thích cả chế độ tạo mới (ddl-auto=create) và khởi động lại (ddl-auto=update)
-- Toàn bộ lệnh INSERT dùng ON CONFLICT DO NOTHING để đảm bảo an toàn tuyệt đối
-- ============================================================================

-- ============================================================================
-- 1. BẢNG CLINICS (Thông tin Hệ thống Nha khoa - đầy đủ 16 thuộc tính)
-- ============================================================================
INSERT INTO clinics (
    clinic_id, clinic_code, brand_name, legal_name, tax_code,
    business_license_no, established_year, representative, phone_number,
    email, logo_url, registered_address, description, image, created_at, updated_at
) VALUES (
    'clinic-main-01',
    'CROWN-HQ',
    'Nha Khoa Quốc Tế Crown Dental',
    'Công Ty TNHH Nha Khoa Quốc Tế Crown Dental Việt Nam',
    '0108923456',
    '0108923456-GP/SYT-HN',
    2015,
    'TTƯT. BS. CKII Nguyễn Văn Hùng',
    '1900 8059',
    'contact@crowndental.vn',
    '/logo.png',
    '328 Phố Huế, Phường Phố Huế, Quận Hai Bà Trưng, TP. Hà Nội',
    'Hệ thống Nha khoa Quốc tế Crown Dental đạt chuẩn Châu Âu chuyên sâu Chỉnh nha Invisalign, Cấy ghép Implant kỹ thuật số, Phục hình Răng sứ thẩm mỹ và Nha khoa tổng quát công nghệ cao.',
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80',
    NOW(),
    NOW()
) ON CONFLICT (clinic_id) DO NOTHING;

-- ============================================================================
-- 2. BẢNG BRANCHES (3 Chi nhánh trực thuộc Nha khoa Crown Dental)
-- ============================================================================
INSERT INTO branches (
    branch_id, clinic_id, branch_code, branch_name, phone_number,
    email, address, open_time, close_time, image_branch, status
) VALUES
    ('branch-hn-01', 'clinic-main-01', 'CN-HN01', 'Crown Dental Phố Huế - Hà Nội', '024 7300 8059', 'hanoi@crowndental.vn', '328 Phố Huế, Phường Phố Huế, Quận Hai Bà Trưng, TP. Hà Nội', '08:00:00', '19:30:00', 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80', 'ACTIVE'),
    ('branch-hcm-01', 'clinic-main-01', 'CN-HCM01', 'Crown Dental Nam Kỳ Khởi Nghĩa - TP.HCM', '028 7300 8059', 'hcm@crowndental.vn', '215 Nam Kỳ Khởi Nghĩa, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh', '08:00:00', '19:30:00', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80', 'ACTIVE'),
    ('branch-bd-01', 'clinic-main-01', 'CN-BD01', 'Crown Dental Thủ Dầu Một - Bình Dương', '0274 730 8059', 'binhduong@crowndental.vn', '564 Đại Lộ Bình Dương, Phường Hiệp Thành, TP. Thủ Dầu Một, Bình Dương', '08:00:00', '19:30:00', 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80', 'ACTIVE')
ON CONFLICT (branch_id) DO NOTHING;

-- ============================================================================
-- 3. BẢNG ROOMS (10 Phòng khám: 4 phòng CN1, 3 phòng CN2, 3 phòng CN3)
-- ============================================================================
INSERT INTO rooms (id, room_name, floor_name, branch_id, create_at) VALUES
    -- Chi nhánh 1: Hà Nội (4 phòng)
    ('f1000000-0000-4000-8000-000000000001', 'Phòng Khám Tổng Quát 101', 'Tầng 1', 'branch-hn-01', NOW()),
    ('f1000000-0000-4000-8000-000000000002', 'Phòng Chỉnh Nha Kỹ Thuật Số 201', 'Tầng 2', 'branch-hn-01', NOW()),
    ('f1000000-0000-4000-8000-000000000003', 'Phòng Phục Hình Thẩm Mỹ 202', 'Tầng 2', 'branch-hn-01', NOW()),
    ('f1000000-0000-4000-8000-000000000004', 'Phòng Cấy Ghép Implant Vô Khuẩn 301', 'Tầng 3', 'branch-hn-01', NOW()),

    -- Chi nhánh 2: TP.HCM (3 phòng)
    ('f2000000-0000-4000-8000-000000000001', 'Phòng Khám Tổng Quát 101', 'Tầng 1', 'branch-hcm-01', NOW()),
    ('f2000000-0000-4000-8000-000000000002', 'Phòng Chỉnh Nha & Thẩm Mỹ 201', 'Tầng 2', 'branch-hcm-01', NOW()),
    ('f2000000-0000-4000-8000-000000000003', 'Phòng Tiểu Phẫu & Implant 301', 'Tầng 3', 'branch-hcm-01', NOW()),

    -- Chi nhánh 3: Bình Dương (3 phòng)
    ('f3000000-0000-4000-8000-000000000001', 'Phòng Khám Tổng Quát 101', 'Tầng 1', 'branch-bd-01', NOW()),
    ('f3000000-0000-4000-8000-000000000002', 'Phòng Chỉnh Nha & Nha Khoa Trẻ Em 201', 'Tầng 2', 'branch-bd-01', NOW()),
    ('f3000000-0000-4000-8000-000000000003', 'Phòng Phục Hình & Implant 301', 'Tầng 3', 'branch-bd-01', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. BẢNG PRIMARY_DIAGNOSIS (30 Chẩn đoán chính theo chuẩn ICD-10 Nha khoa)
-- ============================================================================
INSERT INTO primary_diagnosis (id, primary_diagnosis_name, status) VALUES
    ('d1000000-0000-4000-8000-000000000001', 'K02.0 - Sâu men răng (Sâu răng giai đoạn sớm)', TRUE),
    ('d1000000-0000-4000-8000-000000000002', 'K02.1 - Sâu ngà răng nông và sâu', TRUE),
    ('d1000000-0000-4000-8000-000000000003', 'K02.2 - Sâu xê-măng chân răng', TRUE),
    ('d1000000-0000-4000-8000-000000000004', 'K02.5 - Sâu răng lộ tủy', TRUE),
    ('d1000000-0000-4000-8000-000000000005', 'K02.8 - Sâu răng thứ phát tái phát quanh miếng trám', TRUE),
    ('d1000000-0000-4000-8000-000000000006', 'K03.0 - Mòn mặt nhai răng quá mức', TRUE),
    ('d1000000-0000-4000-8000-000000000007', 'K03.1 - Tiêu cổ răng hình chêm (Mòn cổ chân răng)', TRUE),
    ('d1000000-0000-4000-8000-000000000008', 'K03.6 - Cao răng (Vôi răng) và mảng bám răng', TRUE),
    ('d1000000-0000-4000-8000-000000000009', 'K03.8 - Quá cảm ngà răng (Ê buốt răng)', TRUE),
    ('d1000000-0000-4000-8000-000000000010', 'K04.0 - Viêm tủy răng có hồi phục', TRUE),
    ('d1000000-0000-4000-8000-000000000011', 'K04.01 - Viêm tủy răng cấp không hồi phục', TRUE),
    ('d1000000-0000-4000-8000-000000000012', 'K04.1 - Hoại tử tủy răng', TRUE),
    ('d1000000-0000-4000-8000-000000000013', 'K04.4 - Viêm quanh chóp răng cấp tính có nguồn gốc tủy', TRUE),
    ('d1000000-0000-4000-8000-000000000014', 'K04.5 - Viêm quanh chóp răng mạn tính (U hạt quanh chóp)', TRUE),
    ('d1000000-0000-4000-8000-000000000015', 'K04.6 - Áp xe quanh chóp răng có lỗ dò', TRUE),
    ('d1000000-0000-4000-8000-000000000016', 'K04.7 - Áp xe quanh chóp răng không có lỗ dò', TRUE),
    ('d1000000-0000-4000-8000-000000000017', 'K04.8 - Nang chân răng (Nang quanh chóp)', TRUE),
    ('d1000000-0000-4000-8000-000000000018', 'K05.0 - Viêm nướu răng cấp tính', TRUE),
    ('d1000000-0000-4000-8000-000000000019', 'K05.1 - Viêm nướu răng mạn tính do mảng bám', TRUE),
    ('d1000000-0000-4000-8000-000000000020', 'K05.2 - Viêm nha chu cấp tính (Áp xe nha chu)', TRUE),
    ('d1000000-0000-4000-8000-000000000021', 'K05.3 - Viêm nha chu mạn tính tiêu xương ổ răng', TRUE),
    ('d1000000-0000-4000-8000-000000000022', 'K05.4 - Viêm quanh thân răng khôn (Lợi trùm)', TRUE),
    ('d1000000-0000-4000-8000-000000000023', 'K06.0 - Tụt nướu chân răng khu trú hoặc toàn thể', TRUE),
    ('d1000000-0000-4000-8000-000000000024', 'K01.0 - Răng mọc ngầm trong xương hàm', TRUE),
    ('d1000000-0000-4000-8000-000000000025', 'K01.1 - Răng khôn mọc lệch / mọc kẹt', TRUE),
    ('d1000000-0000-4000-8000-000000000026', 'K07.2 - Sai khớp cắn hạng II / hạng III (Hô, móm, cắn ngược)', TRUE),
    ('d1000000-0000-4000-8000-000000000027', 'K07.3 - Răng mọc chen chúc, lệch lạc hoặc thưa kẽ', TRUE),
    ('d1000000-0000-4000-8000-000000000028', 'K07.6 - Rối loạn thái dương hàm (Đau khớp thái dương hàm)', TRUE),
    ('d1000000-0000-4000-8000-000000000029', 'K08.1 - Mất răng bán phần hoặc toàn bộ do tai nạn, nhổ răng hoặc bệnh nha chu', TRUE),
    ('d1000000-0000-4000-8000-000000000030', 'S02.5 - Gãy, nứt mẻ thân răng hoặc chân răng do chấn thương', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. BẢNG TOOTH_STATUS (10 Bệnh lý hiện tại của răng để đánh dấu & lên phác đồ)
-- ============================================================================
INSERT INTO tooth_status (id, tooth_code, label, color) VALUES
    ('e1000000-0000-4000-8000-000000000001', 'ENAMEL_CARIES', 'Sâu men răng', '#EAB308'),
    ('e1000000-0000-4000-8000-000000000002', 'CARIES', 'Sâu ngà răng', '#EF4444'),
    ('e1000000-0000-4000-8000-000000000003', 'PULPITIS', 'Viêm tủy răng', '#F97316'),
    ('e1000000-0000-4000-8000-000000000004', 'FRACTURED', 'Răng vỡ, mẻ', '#DC2626'),
    ('e1000000-0000-4000-8000-000000000005', 'GINGIVITIS', 'Viêm lợi', '#EC4899'),
    ('e1000000-0000-4000-8000-000000000006', 'PERIODONTITIS', 'Viêm nha chu', '#BE123C'),
    ('e1000000-0000-4000-8000-000000000007', 'APICAL_ABSCESS', 'Viêm quanh chóp', '#9333EA'),
    ('e1000000-0000-4000-8000-000000000008', 'IMPACTED', 'Răng mọc lệch', '#D97706'),
    ('e1000000-0000-4000-8000-000000000009', 'MOBILITY', 'Mất răng', '#6366F1'),
    ('e1000000-0000-4000-8000-000000000010', 'CERVICAL_WEAR', 'Mòn cổ răng', '#0EA5E9')
ON CONFLICT (id) DO UPDATE SET
    tooth_code = EXCLUDED.tooth_code,
    label = EXCLUDED.label,
    color = EXCLUDED.color;

-- ============================================================================
-- 6. BẢNG MEDICINES (50 Loại thuốc nha khoa chuyên dụng)
-- ============================================================================
INSERT INTO medicines (
    id, code, name, unit, manufacturer, stock_quantity, price,
    manufacture_date, expiry_date, description, usage_instruction, status, created_at, updated_at
) VALUES
    -- Nhóm 1: Kháng sinh nha khoa (13 thuốc)
    ('01a11111-1111-4111-8111-111111111101', 'MED-AMOX-500', 'Amoxicillin 500mg', 'Viên nang', 'Dược Hậu Giang (DHG)', 500, 2000.00, DATE '2025-06-01', DATE '2028-06-01', 'Kháng sinh nhóm Penicillin điều trị nhiễm trùng răng miệng, áp xe quanh chóp, viêm tủy cấp.', 'Ngày uống 2 lần, mỗi lần 1-2 viên sau ăn', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111102', 'MED-AUG-625', 'Augmentin 625mg', 'Viên nén bao phim', 'GlaxoSmithKline (GSK)', 300, 9000.00, DATE '2025-06-15', DATE '2028-06-15', 'Kháng sinh phối hợp Amoxicillin + Acid Clavulanic đặc trị nhiễm khuẩn răng hàm mặt và sau nhổ răng khôn.', 'Ngày uống 2 lần, mỗi lần 1 viên ngay đầu bữa ăn', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111103', 'MED-AUG-1000', 'Augmentin 1g', 'Viên nén bao phim', 'GlaxoSmithKline (GSK)', 250, 12000.00, DATE '2025-07-01', DATE '2028-07-01', 'Kháng sinh liều cao cho viêm mô tế bào vùng hàm mặt và cấy ghép Implant xương hàm.', 'Ngày uống 2 lần, mỗi lần 1 viên sau ăn sáng - tối', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111104', 'MED-CLAM-500', 'Clamoxyl 500mg', 'Viên nang', 'GlaxoSmithKline (GSK)', 250, 4000.00, DATE '2025-05-20', DATE '2028-05-20', 'Kháng sinh Amoxicillin tinh khiết dự phòng nhiễm khuẩn trước thủ thuật nhổ răng có chảy máu.', 'Ngày uống 2 lần, mỗi lần 1 viên sau ăn', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111105', 'MED-SPI-15M', 'Spiramycin 1.5 MUI (Rovamycine)', 'Viên nén bao phim', 'Sanofi Aventis', 300, 6000.00, DATE '2025-06-05', DATE '2028-06-05', 'Kháng sinh Macrolid thấm tốt vào mô nha chu và nước bọt, điều trị viêm nướu, viêm nha chu.', 'Ngày uống 2-3 lần, mỗi lần 1 viên sau ăn', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111106', 'MED-RODO-250', 'Rodogyl', 'Viên nén bao phim', 'Sanofi Aventis', 400, 5000.00, DATE '2025-06-10', DATE '2028-06-10', 'Phối hợp Spiramycin và Metronidazole, thuốc đầu tay điều trị viêm quanh thân răng khôn và áp xe lợi.', 'Ngày uống 2-3 lần, mỗi lần 2 viên trong bữa ăn', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111107', 'MED-METRO-250', 'Metronidazole 250mg', 'Viên nén', 'Gedeon Richter', 400, 1500.00, DATE '2025-05-15', DATE '2028-05-15', 'Kháng sinh diệt vi khuẩn kỵ khí đặc trị túi mủ nha chu và viêm quanh chóp răng.', 'Ngày uống 2-3 lần, mỗi lần 1 viên sau ăn, kiêng rượu bia', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111108', 'MED-CLIN-300', 'Clindamycin 300mg (Dalacin C)', 'Viên nang', 'Pfizer', 200, 8000.00, DATE '2025-06-18', DATE '2028-06-18', 'Kháng sinh thâm nhập tốt vào mô xương, dùng thay thế khi bệnh nhân dị ứng nhóm Penicillin.', 'Ngày uống 2-3 lần, mỗi lần 1 viên với nhiều nước', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111109', 'MED-ZIN-500', 'Zinnat 500mg (Cefuroxime)', 'Viên nén bao phim', 'GlaxoSmithKline (GSK)', 220, 11000.00, DATE '2025-07-10', DATE '2028-07-10', 'Kháng sinh Cephalosporin thế hệ 2 điều trị nhiễm khuẩn xoang hàm do răng và tiểu phẫu hàm mặt.', 'Ngày uống 2 lần, mỗi lần 1 viên sau ăn', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111110', 'MED-AZI-500', 'Azithromycin 500mg', 'Viên nén bao phim', 'Pfizer', 180, 12000.00, DATE '2025-07-15', DATE '2028-07-15', 'Kháng sinh Macrolid phác đồ 3 ngày tiện lợi cho viêm nha chu tiến triển nhanh.', 'Ngày uống 1 lần duy nhất 1 viên sau ăn trong 3 ngày', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111111', 'MED-CIPRO-500', 'Ciprofloxacin 500mg', 'Viên nén bao phim', 'Dược Hậu Giang (DHG)', 240, 3000.00, DATE '2025-05-01', DATE '2028-05-01', 'Kháng sinh nhóm Quinolon dùng cho nhiễm khuẩn răng miệng phối hợp viêm xoang hàm.', 'Ngày uống 2 lần, mỗi lần 1 viên sau ăn', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111112', 'MED-CEPH-500', 'Cephalexin 500mg', 'Viên nang', 'Mekophar', 300, 2000.00, DATE '2025-04-10', DATE '2028-04-10', 'Kháng sinh Cephalosporin thế hệ 1 dự phòng nhiễm khuẩn sau nhổ răng thông thường.', 'Ngày uống 2-3 lần, mỗi lần 1 viên sau ăn', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111113', 'MED-DOXY-100', 'Doxycycline 100mg', 'Viên nang', 'Domesco', 260, 2500.00, DATE '2025-06-01', DATE '2028-06-01', 'Hỗ trợ ức chế tiêu xương ổ răng và kiểm soát viêm nha chu mạn tính.', 'Ngày uống 1-2 lần, mỗi lần 1 viên sau ăn, ngồi thẳng sau uống', 'ACTIVE', NOW(), NOW()),

    -- Nhóm 2: Giảm đau - Kháng viêm - Chống phù nề (13 thuốc)
    ('01a11111-1111-4111-8111-111111111114', 'MED-PARA-500', 'Paracetamol 500mg', 'Viên nén', 'Dược Hậu Giang (DHG)', 600, 1000.00, DATE '2025-06-01', DATE '2028-06-01', 'Giảm đau hạ sốt nhẹ đến vừa sau lấy cao răng, trám răng hoặc siết dây cung chỉnh nha.', 'Uống 1 viên khi đau, cách nhau tối thiểu 4-6 giờ', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111115', 'MED-PANADOL-EX', 'Panadol Extra', 'Viên nén', 'GlaxoSmithKline (GSK)', 500, 2000.00, DATE '2025-06-05', DATE '2028-06-05', 'Giảm đau răng nhanh nhờ phối hợp Paracetamol 500mg và Caffeine 65mg.', 'Uống 1 viên khi đau sau ăn, không quá 6 viên/ngày', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111116', 'MED-EF-500', 'Efferalgan 500mg sủi', 'Viên sủi', 'UPSA SAS (Pháp)', 320, 3500.00, DATE '2025-06-15', DATE '2028-06-15', 'Viên sủi hòa tan hấp thu nhanh giảm nhức răng cấp, dễ uống cho bệnh nhân sưng hàm.', 'Hòa tan 1 viên trong 200ml nước lọc, uống khi đau', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111117', 'MED-EF-COD', 'Efferalgan Codeine', 'Viên sủi', 'UPSA SAS (Pháp)', 200, 7000.00, DATE '2025-06-20', DATE '2028-06-20', 'Giảm đau mức độ vừa đến mạnh sau tiểu phẫu nhổ răng khôn mọc lệch ngầm.', 'Hòa tan 1 viên trong cốc nước, ngày tối đa 3 lần khi đau nhiều', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111118', 'MED-IBU-400', 'Ibuprofen 400mg', 'Viên nén bao phim', 'Stella Pharm', 450, 2000.00, DATE '2025-06-10', DATE '2028-06-10', 'Kháng viêm NSAID giảm đau răng và sưng nướu hiệu quả sau điều trị tủy.', 'Ngày uống 2 lần, mỗi lần 1 viên ngay sau bữa ăn no', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111119', 'MED-MELOX-75', 'Meloxicam 7.5mg (Mobic)', 'Viên nén', 'Boston Pharma', 250, 3000.00, DATE '2025-06-25', DATE '2028-06-25', 'Kháng viêm chọn lọc COX-2 giảm sưng đau sau cấy trụ Implant, êm dịu dạ dày.', 'Ngày uống 1-2 lần, mỗi lần 1 viên sau ăn no', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111120', 'MED-VOLT-50', 'Voltaren 50mg (Diclofenac)', 'Viên bao tan ruột', 'Novartis', 260, 5000.00, DATE '2025-06-15', DATE '2028-06-15', 'Kháng viêm giảm đau mạnh sau phẫu thuật cắt chóp răng và nạo nang chân răng.', 'Ngày uống 2 lần, mỗi lần 1 viên sau ăn no', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111121', 'MED-CELE-200', 'Celebrex 200mg (Celecoxib)', 'Viên nang', 'Pfizer', 200, 12000.00, DATE '2025-07-01', DATE '2028-07-01', 'Kháng viêm chọn lọc COX-2 kiểm soát đau sau nhổ nhiều răng khôn và ghép xương.', 'Ngày uống 1-2 lần, mỗi lần 1 viên sau ăn', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111122', 'MED-ALPHACHOAY', 'Alpha Choay (Alphachymotrypsin)', 'Viên ngậm', 'Sanofi Aventis', 500, 3500.00, DATE '2025-06-01', DATE '2028-06-01', 'Men chống phù nề giảm sưng má và tan bầm tím nhanh sau tiểu phẫu răng miệng.', 'Ngậm dưới lưỡi 2 viên/lần, ngày 2-3 lần', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111123', 'MED-KATRYPSIN', 'Katrypsin 4200 IU', 'Viên nén', 'Vacopharm', 350, 2000.00, DATE '2025-05-15', DATE '2028-05-15', 'Men kháng viêm giảm tụ máu và phù nề mô mềm sau nhổ răng và chấn thương.', 'Ngậm dưới lưỡi hoặc uống 2 viên/lần, ngày 2 lần', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111124', 'MED-PRED-5', 'Prednisolone 5mg', 'Viên nén', 'Pharbaco', 300, 1000.00, DATE '2025-06-12', DATE '2028-06-12', 'Corticoid chống sưng nề mạnh ngắn ngày sau phẫu thuật mở xương răng khôn ngầm.', 'Uống 1-2 viên buổi sáng sau ăn no trong 2-3 ngày đầu', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111125', 'MED-MEDROL-16', 'Medrol 16mg (Methylprednisolone)', 'Viên nén', 'Pfizer', 220, 4500.00, DATE '2025-06-20', DATE '2028-06-20', 'Kháng viêm mạnh kiểm soát sưng má sau phẫu thuật cấy ghép toàn hàm All-on-4.', 'Uống 1 viên duy nhất buổi sáng sau ăn no theo đơn bác sĩ', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111126', 'MED-ETORI-60', 'Arcoxia 60mg (Etoricoxib)', 'Viên nén bao phim', 'MSD', 180, 10000.00, DATE '2025-07-05', DATE '2028-07-05', 'Giảm đau kháng viêm kéo dài 24 giờ chỉ với 1 viên mỗi ngày sau tiểu phẫu nha khoa.', 'Ngày uống 1 viên duy nhất sau ăn', 'ACTIVE', NOW(), NOW()),

    -- Nhóm 3: Thuốc tê nha khoa tại chỗ & Bôi tê (6 thuốc)
    ('01a11111-1111-4111-8111-111111111127', 'MED-LIDO-2', 'Lidocaine 2% Epinephrine 1:100.000', 'Ống tiêm', 'Septodont (Pháp)', 350, 12000.00, DATE '2025-06-20', DATE '2028-06-20', 'Thuốc tê ống nha khoa 1.8ml tiêu chuẩn gây tê ngấm và gây tê vùng hàm dưới.', 'Bác sĩ thực hiện tiêm gây tê tại ghế nha khoa', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111128', 'MED-SEPT-4', 'Septanest 4% Articaine 1:100.000', 'Ống tiêm', 'Septodont (Pháp)', 300, 15000.00, DATE '2025-07-05', DATE '2028-07-05', 'Thuốc tê Articaine khuếch tán xương tốt dùng cho điều trị tủy và cắm trụ Implant.', 'Bác sĩ thực hiện tiêm gây tê chuyên sâu tại phòng khám', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111129', 'MED-SCAN-3', 'Scandonest 3% Plain (Mepivacaine)', 'Ống tiêm', 'Septodont (Pháp)', 180, 14000.00, DATE '2025-06-15', DATE '2028-06-15', 'Thuốc tê không co mạch an toàn cho bệnh nhân cao huyết áp và bệnh lý tim mạch.', 'Bác sĩ thực hiện tiêm gây tê tại phòng khám', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111130', 'MED-XYLO-SPRAY', 'Xylocaine Spray 10%', 'Chai xịt', 'AstraZeneca', 60, 35000.00, DATE '2025-05-10', DATE '2028-05-10', 'Thuốc tê xịt bề mặt niêm mạc lợi giảm phản xạ buồn nôn khi lấy dấu răng.', 'Xịt bề mặt niêm mạc 1-2 nhát trước thủ thuật', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111131', 'MED-EMLA-5', 'EMLA Cream 5%', 'Tuýp', 'AstraZeneca', 80, 28000.00, DATE '2025-06-10', DATE '2028-06-10', 'Kem bôi tê bề mặt niêm mạc nướu giúp trẻ em không đau trước khi tiêm tê.', 'Bôi lớp mỏng lên vùng niêm mạc khô 2 phút trước thủ thuật', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111132', 'MED-BENZO-20', 'Benzocaine 20% Gel vị dâu', 'Hũ', 'Sultan Healthcare', 70, 30000.00, DATE '2025-06-25', DATE '2028-06-25', 'Gel bôi tê tác dụng nhanh trong 30 giây dùng cho nha khoa trẻ em và cạo vôi dưới nướu.', 'Thoa tại chỗ bằng tăm bông vô khuẩn tại phòng khám', 'ACTIVE', NOW(), NOW()),

    -- Nhóm 4: Nước súc miệng & Sát khuẩn khoang miệng (6 thuốc)
    ('01a11111-1111-4111-8111-111111111133', 'MED-KIN-GING', 'Nước súc miệng Kin Gingival 0.12%', 'Chai', 'Laboratorios KIN (Tây Ban Nha)', 150, 25000.00, DATE '2025-07-12', DATE '2028-07-12', 'Dung dịch Chlorhexidine 0.12% sát khuẩn khoang miệng sau nhổ răng khôn và cấy Implant.', 'Ngậm súc miệng 15ml trong 30 giây sáng - tối, không súc lại bằng nước', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111134', 'MED-MEDORAL', 'Nước súc miệng Medoral 0.2%', 'Chai', 'Merap Group', 160, 20000.00, DATE '2025-06-18', DATE '2028-06-18', 'Dung dịch sát khuẩn ngăn mảng bám vi khuẩn và dự phòng viêm ổ răng khô sau nhổ.', 'Súc miệng 10-15ml ngày 2 lần sau đánh răng', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111135', 'MED-BETA-GARG', 'Betadine Gargle & Mouthwash 1%', 'Chai', 'Mundipharma', 140, 18000.00, DATE '2025-06-10', DATE '2028-06-10', 'Dung dịch Povidone-Iodine 1% diệt khuẩn, nấm khoang miệng trước và sau tiểu phẫu.', 'Pha loãng hoặc súc trực tiếp 10ml trong 30 giây rồi nhổ bỏ', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111136', 'MED-ELUDRIL', 'Nước súc miệng Eludril Classic', 'Chai', 'Pierre Fabre (Pháp)', 120, 26000.00, DATE '2025-06-01', DATE '2028-06-01', 'Phối hợp Chlorhexidine và Chlorobutanol làm dịu nướu sưng đau sau cạo vôi sâu.', 'Pha 15ml với nước ấm tới vạch cốc đo, súc ngày 2 lần', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111137', 'MED-LISTER-ZERO', 'Listerine Healthy White Zero Alcohol', 'Chai', 'Johnson & Johnson', 180, 16000.00, DATE '2025-06-15', DATE '2028-06-15', 'Nước súc miệng chứa Fluoride không cồn hỗ trợ tái khoáng men răng cho người đeo mắc cài.', 'Súc miệng 20ml trong 30 giây sau khi chải răng', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111138', 'MED-NACL-09', 'Nước muối sinh lý NaCl 0.9% 500ml', 'Chai', 'Vĩnh Phúc Pharma', 500, 5000.00, DATE '2025-06-01', DATE '2028-06-01', 'Dung dịch đẳng trương vệ sinh khoang miệng nhẹ nhàng từ ngày thứ 2 sau nhổ răng.', 'Súc miệng nhẹ nhàng sau mỗi bữa ăn, tránh khạc nhổ mạnh ngày đầu', 'ACTIVE', NOW(), NOW()),

    -- Nhóm 5: Gel bôi nướu, nhiệt miệng & Chăm sóc chỉnh nha (6 thuốc)
    ('01a11111-1111-4111-8111-111111111139', 'MED-KAMI-GEL', 'Kamistad Gel N 10g', 'Tuýp', 'STADA (Đức)', 140, 18000.00, DATE '2025-06-20', DATE '2028-06-20', 'Gel hoa cúc và Lidocaine giảm đau loét nhiệt miệng và vết cọ mắc cài chỉnh nha.', 'Bôi lượng nhỏ bằng hạt đậu lên vùng niêm mạc đau ngày 3 lần', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111140', 'MED-GENG-GEL', 'Gengigel Hyaluronic Acid 0.2%', 'Tuýp', 'Ricerfarma (Ý)', 90, 32000.00, DATE '2025-07-05', DATE '2028-07-05', 'Gel sinh học Hyaluronic Acid thúc đẩy lành thương nướu sau nạo túi nha chu và lật vạt.', 'Thoa nhẹ lớp mỏng lên nướu sau khi vệ sinh răng miệng, ngày 3 lần', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111141', 'MED-METRO-DENT', 'Metrogyl Denta Gel 10g', 'Tuýp', 'Unique Pharma', 160, 15000.00, DATE '2025-06-15', DATE '2028-06-15', 'Gel kháng khuẩn tại chỗ đặc trị viêm nướu chảy máu chân răng và viêm túi lợi.', 'Thoa lên viền nướu ngày 2 lần sáng - tối, kiêng ăn uống 30 phút sau bôi', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111142', 'MED-PERIO-GEL', 'Periokin Gel Chlorhexidine 0.2%', 'Tuýp', 'Laboratorios KIN (Tây Ban Nha)', 100, 28000.00, DATE '2025-06-14', DATE '2028-06-14', 'Gel bám dính sinh học kháng khuẩn quanh cổ trụ Implant và vùng khâu tiểu phẫu.', 'Bôi trực tiếp lên vùng phẫu thuật 2-3 lần/ngày sau ăn', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111143', 'MED-ORACORTIA', 'Oracortia Triamcinolone 0.1%', 'Gói', 'Mega Lifesciences', 250, 8000.00, DATE '2025-06-10', DATE '2028-06-10', 'Mỡ bôi niêm mạc miệng điều trị loét áp-tơ tái phát và viêm niêm mạc do cọ xát.', 'Chấm nhẹ lên vết loét trước khi đi ngủ để thuốc bám qua đêm', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111144', 'MED-ORTHO-WAX', 'Sáp nha khoa chỉnh nha Gum Ortho Wax', 'Hộp', 'Sunstar GUM (Mỹ)', 220, 12000.00, DATE '2025-06-01', DATE '2028-06-01', 'Sáp y tế bọc đầu dây cung và mắc cài giúp bảo vệ môi má khỏi trầy xước khi mới niềng.', 'Vo viên nhỏ gắn phủ lên mắc cài gây cộm sau khi làm khô bề mặt', 'ACTIVE', NOW(), NOW()),

    -- Nhóm 6: Cầm máu, Bảo vệ dạ dày, Tái khoáng & Hỗ trợ hậu phẫu (6 thuốc)
    ('01a11111-1111-4111-8111-111111111145', 'MED-SPONGO', 'Xốp cầm máu tự tiêu Spongostan Dental', 'Miếng', 'Johnson & Johnson', 180, 15000.00, DATE '2025-05-05', DATE '2028-05-05', 'Xốp Gelatin tự tiêu đặt vào ổ răng sau nhổ giúp ổn định cục máu đông nhanh chóng.', 'Bác sĩ đặt trực tiếp vào huyệt ổ răng trước khi khâu đóng', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111146', 'MED-TRANS-500', 'Transamin 500mg (Acid Tranexamic)', 'Viên nén', 'Daiichi Sankyo', 200, 5000.00, DATE '2025-06-20', DATE '2028-06-20', 'Thuốc cầm máu đường uống hỗ trợ sau nhổ răng phức tạp hoặc nạo viêm diện rộng.', 'Ngày uống 2-3 lần, mỗi lần 1 viên trong 2 ngày đầu sau tiểu phẫu', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111147', 'MED-OMEP-20', 'Omeprazole 20mg', 'Viên nang', 'Dược Hậu Giang (DHG)', 350, 2000.00, DATE '2025-06-05', DATE '2028-06-05', 'Bảo vệ niêm mạc dạ dày khi bệnh nhân sử dụng thuốc kháng viêm giảm đau NSAIDs.', 'Ngày uống 1 viên trước bữa ăn sáng 30 phút', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111148', 'MED-BIOFLORA', 'Men vi sinh Bioflora 200mg', 'Gói', 'Biocodex (Pháp)', 220, 6000.00, DATE '2025-07-01', DATE '2028-07-01', 'Cân bằng hệ vi sinh đường ruột khi dùng kháng sinh nha khoa phổ rộng.', 'Pha 1 gói với nước nguội uống cách liều kháng sinh 2 giờ', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111149', 'MED-VITC-500', 'Vitamin C 500mg Rutin', 'Viên nén', 'Mekophar', 400, 1500.00, DATE '2025-06-10', DATE '2028-06-10', 'Tăng sức bền thành mạch, giảm chảy máu nướu và thúc đẩy tổng hợp collagen lành thương.', 'Uống 1 viên sau bữa ăn sáng hoặc trưa', 'ACTIVE', NOW(), NOW()),
    ('01a11111-1111-4111-8111-111111111150', 'MED-GC-TOOTH', 'Kem tái khoáng men răng GC Tooth Mousse', 'Tuýp', 'GC Corporation (Nhật Bản)', 90, 35000.00, DATE '2025-07-10', DATE '2028-07-10', 'Bổ sung Canxi và Phosphate sinh học giảm ê buốt sau tẩy trắng răng và tháo mắc cài.', 'Thoa lớp mỏng lên mặt răng để 3 phút sau khi đánh răng buổi tối', 'ACTIVE', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 7. BẢNG PROMOTIONS (30 Chương trình khuyến mãi: 15 EVENT + 15 VOUCHER)
--    - EVENT (15): Có discount_percent, discount_amount = NULL, coupon_code = NULL,
--                  usage_limit = NULL, used_count = NULL
--    - VOUCHER (15): Mã coupon_code đúng 8 ký tự chữ và số, discount_percent = NULL,
--                    có discount_amount (VNĐ), có usage_limit và used_count
-- ============================================================================
INSERT INTO promotions (
    id, title, coupon_code, category, description, image_url, promotion_type,
    discount_percent, discount_amount, max_discount_amount, min_order_amount,
    start_date, end_date, usage_limit, used_count, apply_all_services, status, created_at, updated_at
) VALUES
    -- ── PHẦN A: 15 CHƯƠNG TRÌNH KHUYẾN MÃI SỰ KIỆN (EVENT) ──────────────────
    ('ee000000-0000-4000-8000-000000000001', 'Sự kiện Nụ Cười Học Đường - Ưu đãi Niềng răng Trẻ em', NULL, 'Niềng răng trẻ em', 'Giảm trực tiếp 15% chi phí chỉnh nha tiền tăng trưởng cho học sinh từ 7-15 tuổi trên toàn hệ thống.', 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80', 'EVENT', 15.00, NULL, NULL, NULL, NOW() - INTERVAL '5 days', NOW() + INTERVAL '90 days', NULL, NULL, FALSE, 'ACTIVE', NOW(), NOW()),
    ('ee000000-0000-4000-8000-000000000002', 'Tháng Vàng Invisalign - Chỉnh nha trong suốt chuẩn Mỹ', NULL, 'Niềng răng Invisalign', 'Ưu đãi 20% gói niềng răng trong suốt Invisalign kèm quét dấu răng kỹ thuật số iTero 5D.', 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=800&q=80', 'EVENT', 20.00, NULL, NULL, NULL, NOW() - INTERVAL '5 days', NOW() + INTERVAL '90 days', NULL, NULL, FALSE, 'ACTIVE', NOW(), NOW()),
    ('ee000000-0000-4000-8000-000000000003', 'Tuần Lễ Mắc Cài Tự Buộc Damon - Rút ngắn thời gian niềng', NULL, 'Niềng răng mắc cài', 'Giảm 12% cho khách hàng đăng ký niềng răng mắc cài kim loại hoặc mắc cài sứ tự buộc thông minh.', 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=800&q=80', 'EVENT', 12.00, NULL, NULL, NULL, NOW() - INTERVAL '3 days', NOW() + INTERVAL '60 days', NULL, NULL, FALSE, 'ACTIVE', NOW(), NOW()),
    ('ee000000-0000-4000-8000-000000000004', 'Mùa Cưới Rạng Rỡ - Ưu đãi Mặt dán sứ Veneer e.max', NULL, 'Răng sứ thẩm mỹ', 'Ưu đãi 25% dòng mặt dán sứ siêu mỏng Veneer e.max bảo tồn tối đa mô răng thật cho các cặp đôi.', 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=800&q=80', 'EVENT', 25.00, NULL, NULL, NULL, NOW() - INTERVAL '5 days', NOW() + INTERVAL '75 days', NULL, NULL, FALSE, 'ACTIVE', NOW(), NOW()),
    ('ee000000-0000-4000-8000-000000000005', 'Đại Tiệc Răng Toàn Sứ Đức - Chuẩn thẩm mỹ Châu Âu', NULL, 'Răng sứ thẩm mỹ', 'Giảm 20% khi phục hình răng toàn sứ Cercon HT và Lava Plus chính hãng bảo hành dài hạn.', 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=800&q=80', 'EVENT', 20.00, NULL, NULL, NULL, NOW() - INTERVAL '2 days', NOW() + INTERVAL '60 days', NULL, NULL, FALSE, 'ACTIVE', NOW(), NOW()),
    ('ee000000-0000-4000-8000-000000000006', 'Tri Ân Cha Mẹ - Ưu đãi Trồng răng Implant Thụy Sĩ', NULL, 'Cấy ghép Implant', 'Giảm 15% dòng trụ Implant Straumann SLA và Nobel Biocare phục hồi ăn nhai vững chắc cho người lớn tuổi.', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80', 'EVENT', 15.00, NULL, NULL, NULL, NOW() - INTERVAL '5 days', NOW() + INTERVAL '90 days', NULL, NULL, FALSE, 'ACTIVE', NOW(), NOW()),
    ('ee000000-0000-4000-8000-000000000007', 'Ngày Hội Implant Hàn Quốc - Phục hình răng mất tiết kiệm', NULL, 'Cấy ghép Implant', 'Ưu đãi 10% trụ Implant Osstem và Dentium chính hãng kèm chụp phim khảo sát xương CBCT 3D.', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80', 'EVENT', 10.00, NULL, NULL, NULL, NOW() - INTERVAL '3 days', NOW() + INTERVAL '60 days', NULL, NULL, FALSE, 'ACTIVE', NOW(), NOW()),
    ('ee000000-0000-4000-8000-000000000008', 'Nụ Cười Trắng Sáng Đón Hè - Tẩy trắng Zoom Laser', NULL, 'Tẩy trắng răng', 'Giảm 30% dịch vụ tẩy trắng răng công nghệ Laser Whitening và Zoom 2 không ê buốt.', 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80', 'EVENT', 30.00, NULL, NULL, NULL, NOW() - INTERVAL '4 days', NOW() + INTERVAL '45 days', NULL, NULL, FALSE, 'ACTIVE', NOW(), NOW()),
    ('ee000000-0000-4000-8000-000000000009', 'Chăm Sóc Nụ Cười Gia Đình - Cạo vôi & Đánh bóng siêu âm', NULL, 'Khám & Điều trị', 'Giảm 25% gói lấy cao răng siêu âm và đánh bóng Air-Flow cho khách hàng đi theo nhóm gia đình.', 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=800&q=80', 'EVENT', 25.00, NULL, NULL, NULL, NOW() - INTERVAL '5 days', NOW() + INTERVAL '60 days', NULL, NULL, FALSE, 'ACTIVE', NOW(), NOW()),
    ('ee000000-0000-4000-8000-000000000010', 'Nhổ Răng Khôn Không Đau Piezotome - Hồi phục siêu tốc', NULL, 'Khám & Điều trị', 'Ưu đãi 15% chi phí tiểu phẫu nhổ răng khôn mọc lệch bằng sóng siêu âm Piezotome.', 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80', 'EVENT', 15.00, NULL, NULL, NULL, NOW() - INTERVAL '3 days', NOW() + INTERVAL '60 days', NULL, NULL, FALSE, 'ACTIVE', NOW(), NOW()),
    ('ee000000-0000-4000-8000-000000000011', 'Kỷ Niệm Thành Lập Crown Dental - Ưu đãi Toàn Hệ Thống', NULL, 'Sự kiện đặc biệt', 'Mừng sinh nhật hệ thống Crown Dental giảm 18% áp dụng cho toàn bộ danh mục dịch vụ nha khoa.', 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80', 'EVENT', 18.00, NULL, NULL, NULL, NOW() - INTERVAL '2 days', NOW() + INTERVAL '90 days', NULL, NULL, TRUE, 'ACTIVE', NOW(), NOW()),
    ('ee000000-0000-4000-8000-000000000012', 'Ngày Hội Răng Khỏe Cho Bé - Dự phòng sâu răng toàn diện', NULL, 'Nha khoa trẻ em', 'Giảm 20% các dịch vụ bôi Vecni Fluoride và trám bít hố rãnh ngừa sâu răng cho bé.', 'https://images.unsplash.com/photo-1513415277900-a62401e5084d?auto=format&fit=crop&w=800&q=80', 'EVENT', 20.00, NULL, NULL, NULL, NOW() - INTERVAL '4 days', NOW() + INTERVAL '60 days', NULL, NULL, FALSE, 'ACTIVE', NOW(), NOW()),
    ('ee000000-0000-4000-8000-000000000013', 'Chăm Sóc Nha Chu Chuyên Sâu - Nướu khỏe răng bền', NULL, 'Khám & Điều trị', 'Ưu đãi 15% liệu trình điều trị viêm nha chu, nạo túi lợi chuyên sâu và chăm sóc mô nướu.', 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80', 'EVENT', 15.00, NULL, NULL, NULL, NOW() - INTERVAL '3 days', NOW() + INTERVAL '60 days', NULL, NULL, FALSE, 'ACTIVE', NOW(), NOW()),
    ('ee000000-0000-4000-8000-000000000014', 'Ưu Đãi Sinh Viên Thanh Lịch - Tự tin giao tiếp', NULL, 'Niềng răng mắc cài', 'Giảm 10% dịch vụ chỉnh nha và trám răng thẩm mỹ dành cho học sinh - sinh viên.', 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=800&q=80', 'EVENT', 10.00, NULL, NULL, NULL, NOW() - INTERVAL '5 days', NOW() + INTERVAL '90 days', NULL, NULL, FALSE, 'ACTIVE', NOW(), NOW()),
    ('ee000000-0000-4000-8000-000000000015', 'Tuần Lễ Phục Hình Toàn Hàm All-on-4 / All-on-6', NULL, 'Cấy ghép Implant', 'Ưu đãi đặc biệt 12% cho giải pháp trồng răng toàn hàm kỹ thuật số chịu lực tức thì.', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80', 'EVENT', 12.00, NULL, NULL, NULL, NOW() - INTERVAL '2 days', NOW() + INTERVAL '75 days', NULL, NULL, FALSE, 'ACTIVE', NOW(), NOW()),

    -- ── PHẦN B: 15 MÃ VOUCHER GIẢM TIỀN (VOUCHER - Mã đúng 8 chữ cái & số) ──
    ('ee000000-0000-4000-8000-000000000016', 'Voucher Chào Bạn Mới - Giảm 5.000đ hóa đơn đầu tiên', 'CRWN05K1', 'Khách hàng mới', 'Mã ưu đãi giảm trực tiếp 5.000đ cho khách hàng lần đầu sử dụng dịch vụ tại Crown Dental.', 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80', 'VOUCHER', NULL, 5000.00, NULL, 15000.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '90 days', 200, 12, TRUE, 'ACTIVE', NOW(), NOW()),
    ('ee000000-0000-4000-8000-000000000017', 'Voucher Đặt Lịch Online - Giảm 8.000đ khi đặt hẹn trước', 'BOOK08K2', 'Đặt lịch trực tuyến', 'Tặng ngay 8.000đ trừ thẳng vào hóa đơn cho bệnh nhân đặt lịch khám trước qua Website hoặc App.', 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=800&q=80', 'VOUCHER', NULL, 8000.00, NULL, 20000.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '90 days', 150, 8, TRUE, 'ACTIVE', NOW(), NOW()),
    ('ee000000-0000-4000-8000-000000000018', 'Voucher Cạo Vôi Sạch Mảng Bám - Giảm 5.000đ', 'CLEAN05K', 'Khám & Điều trị', 'Giảm 5.000đ chi phí cạo vôi đánh bóng và chăm sóc răng miệng định kỳ.', 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80', 'VOUCHER', NULL, 5000.00, NULL, 15000.00, NOW() - INTERVAL '4 days', NOW() + INTERVAL '60 days', 120, 5, TRUE, 'ACTIVE', NOW(), NOW()),
    ('ee000000-0000-4000-8000-000000000019', 'Voucher Trám Răng Thẩm Mỹ - Giảm 10.000đ', 'FILL10K4', 'Khám & Điều trị', 'Giảm trực tiếp 10.000đ cho hóa đơn trám răng thẩm mỹ Composite từ 25.000đ trở lên.', 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80', 'VOUCHER', NULL, 10000.00, NULL, 25000.00, NOW() - INTERVAL '4 days', NOW() + INTERVAL '60 days', 100, 6, TRUE, 'ACTIVE', NOW(), NOW()),
    ('ee000000-0000-4000-8000-000000000020', 'Voucher Tẩy Trắng Nụ Cười - Giảm 12.000đ', 'WHIT12K5', 'Tẩy trắng răng', 'Trừ ngay 12.000đ khi thực hiện gói tẩy trắng răng công nghệ cao tại phòng khám.', 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80', 'VOUCHER', NULL, 12000.00, NULL, 30000.00, NOW() - INTERVAL '3 days', NOW() + INTERVAL '60 days', 100, 4, TRUE, 'ACTIVE', NOW(), NOW()),
    ('ee000000-0000-4000-8000-000000000021', 'Voucher Tiểu Phẫu Răng Khôn - Giảm 15.000đ', 'WISD15K6', 'Khám & Điều trị', 'Hỗ trợ giảm 15.000đ chi phí nhổ răng khôn không đau Piezotome.', 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80', 'VOUCHER', NULL, 15000.00, NULL, 35000.00, NOW() - INTERVAL '3 days', NOW() + INTERVAL '60 days', 80, 3, TRUE, 'ACTIVE', NOW(), NOW()),
    ('ee000000-0000-4000-8000-000000000022', 'Voucher Răng Sứ Tinh Anh - Giảm 15.000đ', 'CERA15K7', 'Răng sứ thẩm mỹ', 'Giảm trực tiếp 15.000đ cho các dịch vụ phục hình mão răng toàn sứ cao cấp.', 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=800&q=80', 'VOUCHER', NULL, 15000.00, NULL, 40000.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '75 days', 100, 7, TRUE, 'ACTIVE', NOW(), NOW()),
    ('ee000000-0000-4000-8000-000000000023', 'Voucher Mặt Dán Veneer - Giảm 18.000đ', 'VENE18K8', 'Răng sứ thẩm mỹ', 'Tặng 18.000đ cho hóa đơn phục hình thẩm mỹ mặt dán sứ Veneer từ 45.000đ.', 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=800&q=80', 'VOUCHER', NULL, 18000.00, NULL, 45000.00, NOW() - INTERVAL '3 days', NOW() + INTERVAL '75 days', 80, 2, TRUE, 'ACTIVE', NOW(), NOW()),
    ('ee000000-0000-4000-8000-000000000024', 'Voucher Chỉnh Nha Khởi Đầu - Giảm 20.000đ', 'BRAC20K9', 'Niềng răng mắc cài', 'Giảm 20.000đ trên hóa đơn đăng ký gói niềng răng mắc cài kim loại hoặc mắc cài sứ.', 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=800&q=80', 'VOUCHER', NULL, 20000.00, NULL, 50000.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '90 days', 100, 9, TRUE, 'ACTIVE', NOW(), NOW()),
    ('ee000000-0000-4000-8000-000000000025', 'Voucher Invisalign VIP - Giảm 25.000đ', 'INVI25KA', 'Niềng răng Invisalign', 'Mã quà tặng trị giá 25.000đ áp dụng cho gói chỉnh nha khay trong suốt Invisalign.', 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=800&q=80', 'VOUCHER', NULL, 25000.00, NULL, 60000.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '90 days', 60, 4, TRUE, 'ACTIVE', NOW(), NOW()),
    ('ee000000-0000-4000-8000-000000000026', 'Voucher Trợ Giá Implant - Giảm 25.000đ', 'IMPL25KB', 'Cấy ghép Implant', 'Giảm trực tiếp 25.000đ trên hóa đơn cấy ghép trụ Implant chính hãng.', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80', 'VOUCHER', NULL, 25000.00, NULL, 60000.00, NOW() - INTERVAL '4 days', NOW() + INTERVAL '90 days', 70, 5, TRUE, 'ACTIVE', NOW(), NOW()),
    ('ee000000-0000-4000-8000-000000000027', 'Voucher Bé Ngoan Răng Xinh - Giảm 6.000đ', 'KIDS06KC', 'Nha khoa trẻ em', 'Tặng 6.000đ cho các dịch vụ nhổ răng sữa, trám răng sữa và bôi Fluor cho bé.', 'https://images.unsplash.com/photo-1513415277900-a62401e5084d?auto=format&fit=crop&w=800&q=80', 'VOUCHER', NULL, 6000.00, NULL, 15000.00, NOW() - INTERVAL '4 days', NOW() + INTERVAL '60 days', 150, 10, TRUE, 'ACTIVE', NOW(), NOW()),
    ('ee000000-0000-4000-8000-000000000028', 'Voucher Khám Chẩn Đoán Phim 3D - Giảm 7.000đ', 'XRAY07KD', 'Khám & Điều trị', 'Giảm 7.000đ khi chụp phim X-quang toàn cảnh Panorama hoặc phim cắt lớp CBCT 3D.', 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=800&q=80', 'VOUCHER', NULL, 7000.00, NULL, 20000.00, NOW() - INTERVAL '3 days', NOW() + INTERVAL '60 days', 120, 6, TRUE, 'ACTIVE', NOW(), NOW()),
    ('ee000000-0000-4000-8000-000000000029', 'Voucher Tri Ân Tái Khám - Giảm 10.000đ', 'CARE10KE', 'Chăm sóc thân thiết', 'Dành tặng bệnh nhân thân thiết quay lại tái khám và điều trị định kỳ tại Crown Dental.', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80', 'VOUCHER', NULL, 10000.00, NULL, 25000.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '90 days', 180, 14, TRUE, 'ACTIVE', NOW(), NOW()),
    ('ee000000-0000-4000-8000-000000000030', 'Voucher Ưu Đãi Cuối Tuần - Giảm 30.000đ đơn lớn', 'WEEK30KF', 'Sự kiện cuối tuần', 'Giảm ngay 30.000đ cho hóa đơn điều trị chuyên sâu từ 70.000đ trở lên vào dịp cuối tuần.', 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80', 'VOUCHER', NULL, 30000.00, NULL, 70000.00, NOW() - INTERVAL '2 days', NOW() + INTERVAL '90 days', 50, 0, TRUE, 'ACTIVE', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 8. BẢNG SERVICES (50 Dịch vụ nha khoa - mức giá 10.000đ đến 95.000đ phục vụ thanh toán thật)
-- ============================================================================
INSERT INTO services (
    id, service_code, service_name, description, price, cost_price,
    estimated_duration, sessions_count, category, sub_category, unit,
    warranty_period, image_url, sort_order, is_featured, is_active, promotion_id
) VALUES
    -- ── NHÓM 1: NIỀNG RĂNG - NIENG_RANG (10 dịch vụ) ────────────────────────
    ('51000000-0000-4000-8000-000000000001', 'SVC-001', 'Mắc cài kim loại tiêu chuẩn 3M', 'Chỉnh nha truyền thống sử dụng mắc cài thép không gỉ y tế 3M Unitek bền chắc, lực kéo ổn định.', 55000.00, 32000.00, 60, '18-24 tháng', 'NIENG_RANG', 'Niềng răng mắc cài kim loại', 'Cả 2 hàm', '5 năm', 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80', 1, TRUE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000002', 'SVC-002', 'Mắc cài kim loại tự buộc Damon Q2', 'Hệ thống nắp trượt thông minh giảm ma sát, hạn chế ê tức và rút ngắn thời gian đeo niềng.', 68000.00, 40000.00, 60, '16-20 tháng', 'NIENG_RANG', 'Niềng răng mắc cài kim loại', 'Cả 2 hàm', '5 năm', 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=600&q=80', 2, TRUE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000003', 'SVC-003', 'Mắc cài kim loại mặt lưỡi (Mặt trong)', 'Gắn mắc cài phía mặt trong thân răng giúp giấu hoàn toàn khí cụ khi giao tiếp.', 75000.00, 45000.00, 90, '18-24 tháng', 'NIENG_RANG', 'Niềng răng mắc cài kim loại', 'Cả 2 hàm', '5 năm', 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80', 3, FALSE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000004', 'SVC-004', 'Mắc cài sứ thẩm mỹ tiêu chuẩn', 'Mắc cài sứ đa tinh thể đồng màu men răng thật, thẩm mỹ cao và an toàn cho mô mềm.', 62000.00, 36000.00, 60, '18-24 tháng', 'NIENG_RANG', 'Niềng răng mắc cài sứ', 'Cả 2 hàm', '5 năm', 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80', 4, FALSE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000005', 'SVC-005', 'Mắc cài sứ tự buộc Damon Clear', 'Kết hợp chất liệu sứ trong suốt chống bám màu và cơ chế nắp trượt tự động nhẹ nhàng.', 72000.00, 42000.00, 60, '16-22 tháng', 'NIENG_RANG', 'Niềng răng mắc cài sứ', 'Cả 2 hàm', '5 năm', 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80', 5, TRUE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000006', 'SVC-006', 'Niềng răng trong suốt Invisalign Express', 'Gói tối đa 7 cặp khay trong suốt chỉnh nhẹ răng thưa hoặc tái phát nhẹ sau chỉnh nha.', 78000.00, 48000.00, 45, '4-6 tháng', 'NIENG_RANG', 'Niềng răng trong suốt Invisalign', 'Cả 2 hàm', '5 năm', 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=600&q=80', 6, FALSE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000007', 'SVC-007', 'Niềng răng trong suốt Invisalign Lite', 'Gói 14 cặp khay SmartTrack thiết kế cá nhân hóa bằng ClinCheck 3D cho sai lệch nhẹ.', 82000.00, 50000.00, 45, '6-10 tháng', 'NIENG_RANG', 'Niềng răng trong suốt Invisalign', 'Cả 2 hàm', '5 năm', 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=600&q=80', 7, FALSE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000008', 'SVC-008', 'Niềng răng trong suốt Invisalign Moderate', 'Gói tới 26 cặp khay điều trị hiệu quả các ca răng khấp khểnh, hô móm mức độ vừa.', 88000.00, 55000.00, 45, '12-18 tháng', 'NIENG_RANG', 'Niềng răng trong suốt Invisalign', 'Cả 2 hàm', '5 năm', 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=600&q=80', 8, TRUE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000009', 'SVC-009', 'Niềng răng Invisalign Comprehensive toàn diện', 'Gói cao cấp nhất không giới hạn số khay tinh chỉnh trong 5 năm cho các ca phức tạp.', 95000.00, 60000.00, 60, '18-30 tháng', 'NIENG_RANG', 'Niềng răng trong suốt Invisalign', 'Trọn gói', 'Trọn đời', 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=600&q=80', 9, TRUE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000010', 'SVC-010', 'Hàm duy trì trong suốt Vivera sau niềng', 'Bộ khay duy trì chính hãng ôm sát cung răng giữ ổn định kết quả sau khi tháo niềng.', 30000.00, 16000.00, 30, '1 buổi', 'NIENG_RANG', 'Khí cụ duy trì chỉnh nha', 'Cả 2 hàm', '12 tháng', 'https://images.unsplash.com/photo-1513415277900-a62401e5084d?auto=format&fit=crop&w=600&q=80', 10, FALSE, TRUE, NULL),

    -- ── NHÓM 2: CẤY GHÉP IMPLANT - IMPLANT (8 dịch vụ) ──────────────────────
    ('51000000-0000-4000-8000-000000000011', 'SVC-011', 'Trụ Implant Osstem (Hàn Quốc)', 'Trụ Titanium tinh khiết phổ biến số 1 Châu Á, tích hợp xương ổn định và chi phí hợp lý.', 65000.00, 38000.00, 45, '2-3 buổi', 'IMPLANT', 'Trụ Implant đơn lẻ', '/trụ', '10 năm', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80', 11, TRUE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000012', 'SVC-012', 'Trụ Implant Dentium SuperLine (Hàn Quốc)', 'Thiết kế bước ren kép giúp tăng độ ổn định sơ khởi ngay sau khi cấy vào xương hàm.', 68000.00, 40000.00, 45, '2-3 buổi', 'IMPLANT', 'Trụ Implant đơn lẻ', '/trụ', '10 năm', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80', 12, FALSE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000013', 'SVC-013', 'Trụ Implant Tekka Global D (Pháp)', 'Kết nối côn thuôn Morse khít sát tuyệt đối ngăn vi khuẩn xâm nhập quanh cổ trụ.', 75000.00, 45000.00, 45, '2-3 buổi', 'IMPLANT', 'Trụ Implant đơn lẻ', '/trụ', '15 năm', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80', 13, FALSE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000014', 'SVC-014', 'Trụ Implant Straumann SLA (Thụy Sĩ)', 'Thương hiệu Implant hàng đầu thế giới rút ngắn thời gian lành thương xuống còn 6 tuần.', 85000.00, 52000.00, 45, '2-3 buổi', 'IMPLANT', 'Trụ Implant đơn lẻ', '/trụ', '20 năm', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80', 14, TRUE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000015', 'SVC-015', 'Trụ Implant Nobel Biocare Active (Thụy Điển)', 'Dòng trụ cao cấp thích hợp cấy tức thì ngay sau nhổ răng và xương hàm xốp.', 89000.00, 55000.00, 60, '2-3 buổi', 'IMPLANT', 'Trụ Implant đơn lẻ', '/trụ', 'Trọn đời', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80', 15, TRUE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000016', 'SVC-016', 'Mão răng toàn sứ Zirconia trên Implant', 'Phục hình thân răng sứ CAD/CAM gắn trên khớp nối Abutment chính hãng bền chắc.', 42000.00, 24000.00, 40, '2 buổi', 'IMPLANT', 'Phục hình trên Implant', '/răng', '10 năm', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80', 16, FALSE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000017', 'SVC-017', 'Ghép xương nhân tạo Bio-Oss hỗ trợ Implant', 'Bổ sung thể tích xương ổ răng bị tiêu hõm lâu ngày trước hoặc trong khi đặt trụ Implant.', 48000.00, 28000.00, 45, '1 buổi', 'IMPLANT', 'Phẫu thuật tiền phục hình', '/đơn vị', 'Không', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80', 17, FALSE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000018', 'SVC-018', 'Phục hình toàn hàm All-on-4 kỹ thuật số', 'Cấy 4 trụ Implant nâng đỡ cầu 12 răng cố định khôi phục toàn bộ cung hàm mất răng.', 95000.00, 62000.00, 120, '3-4 buổi', 'IMPLANT', 'Trồng răng toàn hàm', '/hàm', '20 năm', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80', 18, TRUE, TRUE, NULL),

    -- ── NHÓM 3: RĂNG SỨ THẨM MỸ - RANG_SU (8 dịch vụ) ───────────────────────
    ('51000000-0000-4000-8000-000000000019', 'SVC-019', 'Răng sứ kim loại Ceramco III (Mỹ)', 'Mão răng sườn hợp kim phủ sứ thẩm mỹ cứng chắc, phù hợp phục hình nhóm răng hàm.', 32000.00, 18000.00, 45, '2 buổi', 'RANG_SU', 'Răng sứ kim loại', '/răng', '3 năm', 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80', 19, FALSE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000020', 'SVC-020', 'Răng sứ Titan Vita (Đức)', 'Sườn hợp kim Titan nhẹ, tương hợp sinh học tốt và hạn chế nhạy cảm nóng lạnh.', 38000.00, 22000.00, 45, '2 buổi', 'RANG_SU', 'Răng sứ kim loại', '/răng', '5 năm', 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80', 20, FALSE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000021', 'SVC-021', 'Răng toàn sứ Zirconia DDBio (Đức)', 'Chế tác 100% phôi sứ Zirconia nguyên khối CAD/CAM, không đen viền nướu theo thời gian.', 50000.00, 29000.00, 45, '2 buổi', 'RANG_SU', 'Răng toàn sứ Ceramic', '/răng', '10 năm', 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80', 21, TRUE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000022', 'SVC-022', 'Răng toàn sứ Cercon HT (Đức)', 'Độ trong mờ tự nhiên cao và khả năng chịu lực nhai lên tới 900 MPa cho cả răng cửa và răng hàm.', 58000.00, 34000.00, 45, '2 buổi', 'RANG_SU', 'Răng toàn sứ Ceramic', '/răng', '10 năm', 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80', 22, TRUE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000023', 'SVC-023', 'Răng toàn sứ Lava Plus 3M ESPE (Mỹ)', 'Dòng sứ cao cấp chống bám màu thực phẩm tuyệt đối, vân răng sống động như răng thật.', 68000.00, 40000.00, 45, '2 buổi', 'RANG_SU', 'Răng toàn sứ Ceramic', '/răng', '15 năm', 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80', 23, TRUE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000024', 'SVC-024', 'Răng toàn sứ Orodent Bleach (Ý)', 'Sứ tinh thể ánh kim lấp lánh sang trọng kèm thẻ bảo hành chính hãng toàn cầu.', 76000.00, 46000.00, 50, '2 buổi', 'RANG_SU', 'Răng toàn sứ Ceramic', '/răng', '15 năm', 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80', 24, FALSE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000025', 'SVC-025', 'Mặt dán sứ Veneer e.max Press siêu mỏng', 'Mặt dán sứ dày chỉ 0.3mm hạn chế mài răng tối đa, bảo tồn tủy răng nguyên bản.', 72000.00, 43000.00, 50, '2 buổi', 'RANG_SU', 'Mặt dán sứ Veneer', '/răng', '12 năm', 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80', 25, TRUE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000026', 'SVC-026', 'Phục hồi Inlay / Onlay sứ nguyên khối', 'Miếng đắp sứ CAD/CAM tái tạo thân răng hàm vỡ lớn mà không cần mài bọc toàn bộ răng.', 48000.00, 28000.00, 45, '2 buổi', 'RANG_SU', 'Phục hình bảo tồn', '/răng', '10 năm', 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80', 26, FALSE, TRUE, NULL),

    -- ── NHÓM 4: TẨY TRẮNG RĂNG - TAY_TRANG (6 dịch vụ) ──────────────────────
    ('51000000-0000-4000-8000-000000000027', 'SVC-027', 'Tẩy trắng răng công nghệ đèn Plasma', 'Hoạt hóa gel tẩy trắng an toàn bằng ánh sáng lạnh Plasma trong 45 phút tại phòng khám.', 35000.00, 18000.00, 45, '1 buổi', 'TAY_TRANG', 'Tẩy trắng tại phòng khám', '/2 hàm', 'Không', 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80', 27, FALSE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000028', 'SVC-028', 'Tẩy trắng răng Laser Whitening chuyên sâu', 'Bật sáng từ 3-5 tông màu răng kết hợp gel chống ê buốt tái khoáng men răng.', 45000.00, 24000.00, 60, '1 buổi', 'TAY_TRANG', 'Tẩy trắng tại phòng khám', '/2 hàm', 'Không', 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80', 28, TRUE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000029', 'SVC-029', 'Tẩy trắng răng Philips Zoom WhiteSpeed (Mỹ)', 'Công nghệ ánh sáng LED lạnh hàng đầu Hoa Kỳ cho răng ố vàng sẫm màu.', 55000.00, 30000.00, 60, '1 buổi', 'TAY_TRANG', 'Tẩy trắng tại phòng khám', '/2 hàm', 'Không', 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80', 29, TRUE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000030', 'SVC-030', 'Ép máng tẩy trắng răng cá nhân tại nhà', 'Lấy dấu ép cặp máng nhựa trong suốt ôm khít răng kèm 2 tuýp thuốc tẩy trắng tại nhà.', 28000.00, 14000.00, 30, '1 buổi', 'TAY_TRANG', 'Tẩy trắng tại nhà', '/bộ', 'Không', 'https://images.unsplash.com/photo-1513415277900-a62401e5084d?auto=format&fit=crop&w=600&q=80', 30, FALSE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000031', 'SVC-031', 'Tuýp thuốc tẩy trắng lẻ Opalescence 15%', 'Gel tẩy trắng duy trì chính hãng Ultradent Mỹ bổ sung khoáng chất Potassium Nitrate.', 18000.00, 10000.00, 15, '1 buổi', 'TAY_TRANG', 'Tẩy trắng tại nhà', '/tuýp', 'Không', 'https://images.unsplash.com/photo-1513415277900-a62401e5084d?auto=format&fit=crop&w=600&q=80', 31, FALSE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000032', 'SVC-032', 'Tẩy trắng răng nội nha (Răng chết tủy đổi màu)', 'Làm sáng từ bên trong buồng tủy cho răng đơn lẻ bị sẫm màu sau chấn thương hoặc chữa tủy.', 26000.00, 14000.00, 30, '2 buổi', 'TAY_TRANG', 'Tẩy trắng chuyên biệt', '/răng', 'Không', 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80', 32, FALSE, TRUE, NULL),

    -- ── NHÓM 5: KHÁM & ĐIỀU TRỊ TỔNG QUÁT - KHAM_DIEU_TRI (10 dịch vụ) ──────
    ('51000000-0000-4000-8000-000000000033', 'SVC-033', 'Khám tổng quát & Lập kế hoạch điều trị chuyên sâu', 'Thăm khám toàn diện răng - nướu - khớp cắn bằng camera nội soi trong miệng.', 10000.00, 5000.00, 20, '1 buổi', 'KHAM_DIEU_TRI', 'Khám & Chẩn đoán hình ảnh', '/lần', 'Không', 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=600&q=80', 33, TRUE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000034', 'SVC-034', 'Chụp phim X-quang toàn cảnh Panorama kỹ thuật số', 'Khảo sát tổng thể hai hàm, mầm răng khôn và cấu trúc xoang hàm với liều tia cực thấp.', 20000.00, 10000.00, 15, '1 buổi', 'KHAM_DIEU_TRI', 'Khám & Chẩn đoán hình ảnh', '/phim', 'Không', 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=600&q=80', 34, FALSE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000035', 'SVC-035', 'Chụp phim cắt lớp vi tính ConeBeam CT 3D', 'Phim 3 chiều độ phân giải cao đo mật độ xương hàm và vị trí ống thần kinh răng dưới.', 32000.00, 16000.00, 20, '1 buổi', 'KHAM_DIEU_TRI', 'Khám & Chẩn đoán hình ảnh', '/phim', 'Không', 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=600&q=80', 35, FALSE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000036', 'SVC-036', 'Cạo vôi răng siêu âm & Đánh bóng hai hàm', 'Làm sạch mảng bám vôi răng trên và dưới nướu bằng đầu siêu âm êm ái không ê buốt.', 22000.00, 11000.00, 30, '1 buổi', 'KHAM_DIEU_TRI', 'Nha chu & Dự phòng', '/2 hàm', 'Không', 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80', 36, TRUE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000037', 'SVC-037', 'Đánh bóng thổi cát thẩm mỹ Air-Flow (Thụy Sĩ)', 'Đánh bay vết ố trà, cà phê trong từng kẽ răng nhỏ bằng hạt bột Erythritol siêu mịn.', 28000.00, 15000.00, 30, '1 buổi', 'KHAM_DIEU_TRI', 'Nha chu & Dự phòng', '/2 hàm', 'Không', 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80', 37, FALSE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000038', 'SVC-038', 'Trám răng thẩm mỹ Composite Filtek Z350', 'Phục hồi xoang sâu răng hoặc mẻ kẽ răng cửa bằng vật liệu nano-composite trùng màu răng.', 25000.00, 12000.00, 30, '1 buổi', 'KHAM_DIEU_TRI', 'Nha khoa phục hồi', '/xoang', '12 tháng', 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80', 38, TRUE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000039', 'SVC-039', 'Điều trị tủy răng cửa / răng tiền cối bằng trâm máy', 'Làm sạch hệ thống ống tủy bằng trâm máy NiTi ProTaper và trám bít nhiệt 3 chiều.', 40000.00, 22000.00, 45, '1-2 buổi', 'KHAM_DIEU_TRI', 'Nội nha chữa tủy', '/răng', '12 tháng', 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80', 39, FALSE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000040', 'SVC-040', 'Điều trị tủy răng hàm lớn nhiều ống tủy', 'Nội nha vi phẫu kết hợp máy định vị chóp điện tử chính xác cho răng hàm số 6 - số 7.', 50000.00, 28000.00, 60, '2 buổi', 'KHAM_DIEU_TRI', 'Nội nha chữa tủy', '/răng', '12 tháng', 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80', 40, FALSE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000041', 'SVC-041', 'Nhổ răng khôn hàm trên mọc thẳng / lệch nhẹ', 'Tiểu phẫu nhẹ nhàng trong điều kiện vô khuẩn tuyệt đối, cầm máu nhanh.', 38000.00, 20000.00, 30, '1 buổi', 'KHAM_DIEU_TRI', 'Tiểu phẫu trong miệng', '/răng', 'Không', 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80', 41, FALSE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000042', 'SVC-042', 'Tiểu phẫu nhổ răng khôn hàm dưới mọc lệch Piezotome', 'Ứng dụng sóng siêu âm cắt răng sang chấn tối thiểu, hạn chế sưng đau và lành thương nhanh.', 52000.00, 28000.00, 45, '1 buổi', 'KHAM_DIEU_TRI', 'Tiểu phẫu trong miệng', '/răng', 'Không', 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80', 42, TRUE, TRUE, NULL),

    -- ── NHÓM 6: NHA KHOA TRẺ EM - NHA_KHOA_TRE_EM (8 dịch vụ) ────────────────
    ('51000000-0000-4000-8000-000000000043', 'SVC-043', 'Nhổ răng sữa lung lay không đau bằng gel bôi tê', 'Bôi tê bề mặt hương trái cây dịu nhẹ giúp bé hợp tác vui vẻ không sợ nha sĩ.', 15000.00, 7000.00, 15, '1 buổi', 'NHA_KHOA_TRE_EM', 'Điều trị răng sữa', '/răng', 'Không', 'https://images.unsplash.com/photo-1513415277900-a62401e5084d?auto=format&fit=crop&w=600&q=80', 43, TRUE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000044', 'SVC-044', 'Bôi Vecni Fluoride ngừa sâu răng cho bé', 'Phủ lớp màng khoáng Fluoride 5% bảo vệ men răng sữa và răng vĩnh viễn mới mọc.', 20000.00, 10000.00, 20, '1 buổi', 'NHA_KHOA_TRE_EM', 'Dự phòng sâu răng trẻ em', '/2 hàm', 'Không', 'https://images.unsplash.com/photo-1513415277900-a62401e5084d?auto=format&fit=crop&w=600&q=80', 44, TRUE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000045', 'SVC-045', 'Trám bít hố rãnh mặt nhai răng số 6 cho trẻ', 'Che phủ các rãnh sâu trên răng hàm lớn đầu tiên ngăn thức ăn đọng gây sâu răng.', 18000.00, 9000.00, 20, '1 buổi', 'NHA_KHOA_TRE_EM', 'Dự phòng sâu răng trẻ em', '/răng', '6 tháng', 'https://images.unsplash.com/photo-1513415277900-a62401e5084d?auto=format&fit=crop&w=600&q=80', 45, FALSE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000046', 'SVC-046', 'Hàn trám răng sữa bằng GIC giải phóng Fluor', 'Vật liệu Glass Ionomer Cement Fuji IX bám dính hóa học tốt và ngăn ngừa sâu tái phát.', 18000.00, 9000.00, 25, '1 buổi', 'NHA_KHOA_TRE_EM', 'Điều trị răng sữa', '/răng', '6 tháng', 'https://images.unsplash.com/photo-1513415277900-a62401e5084d?auto=format&fit=crop&w=600&q=80', 46, FALSE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000047', 'SVC-047', 'Điều trị tủy buồng răng sữa (Pulpotomy)', 'Giữ lại răng sữa đúng vị trí trên cung hàm chờ tới tuổi thay răng vĩnh viễn tự nhiên.', 28000.00, 15000.00, 35, '1 buổi', 'NHA_KHOA_TRE_EM', 'Điều trị răng sữa', '/răng', '6 tháng', 'https://images.unsplash.com/photo-1513415277900-a62401e5084d?auto=format&fit=crop&w=600&q=80', 47, FALSE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000048', 'SVC-048', 'Chụp thép tiền chế bảo vệ răng hàm sữa (SSC)', 'Mão thép y tế bảo vệ thân răng sữa sau điều trị tủy giúp bé ăn nhai bình thường.', 32000.00, 17000.00, 30, '1 buổi', 'NHA_KHOA_TRE_EM', 'Phục hồi răng sữa', '/răng', '12 tháng', 'https://images.unsplash.com/photo-1513415277900-a62401e5084d?auto=format&fit=crop&w=600&q=80', 48, FALSE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000049', 'SVC-049', 'Khí cụ giữ khoảng cố định sau mất răng sữa sớm', 'Ngăn các răng kế cận nghiêng đổ làm mất chỗ mọc của mầm răng vĩnh viễn bên dưới.', 36000.00, 19000.00, 30, '2 buổi', 'NHA_KHOA_TRE_EM', 'Chỉnh nha dự phòng trẻ em', '/khí cụ', '12 tháng', 'https://images.unsplash.com/photo-1513415277900-a62401e5084d?auto=format&fit=crop&w=600&q=80', 49, FALSE, TRUE, NULL),
    ('51000000-0000-4000-8000-000000000050', 'SVC-050', 'Hàm Trainer silicon tiền chỉnh nha cho trẻ 6-12 tuổi', 'Khí cụ hướng dẫn cơ chức năng loại bỏ thói quen mút tay, đẩy lưỡi và thở miệng.', 45000.00, 25000.00, 30, '1 buổi', 'NHA_KHOA_TRE_EM', 'Chỉnh nha dự phòng trẻ em', '/hàm', '12 tháng', 'https://images.unsplash.com/photo-1513415277900-a62401e5084d?auto=format&fit=crop&w=600&q=80', 50, TRUE, TRUE, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 9. BẢNG USERS (15 Tài khoản: 1 Admin + 3 Nhân viên + 10 Bác sĩ + CHỈ 1 Bệnh nhân)
--    Mật khẩu mặc định của toàn bộ tài khoản mẫu: 123456
--    Lưu ý: Tài khoản bệnh nhân duy nhất có code_name = 'PA-839092' KHỚP 100%
--           với patient_code của Bệnh nhân số 1 bên dưới
-- ============================================================================
INSERT INTO users (
    id, username, code_name, email, password, phone, avatar_url, role, status, created_at, updated_at
) VALUES
    -- 1 Quản trị viên hệ thống (Admin)
    ('11111111-1111-1111-1111-111111111111', 'Admin', 'ADMIN-001', 'admin@dental.com', '$2a$10$EGvcf2dZ1EA0Egj28geKruQphZIcvHEuAg/imSQc/ek1.DCOXRXge', '0900000000', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80', 'ADMIN', 'ACTIVE', NOW(), NOW()),

    -- 3 Nhân viên tương ứng 3 chi nhánh
    ('41000000-0000-4000-8000-000000000001', 'Nguyễn Phương Thảo', 'EM-100001', 'thao.nguyen@dental.com', '$2a$10$EGvcf2dZ1EA0Egj28geKruQphZIcvHEuAg/imSQc/ek1.DCOXRXge', '0912345601', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80', 'EMPLOYEE', 'ACTIVE', NOW(), NOW()),
    ('41000000-0000-4000-8000-000000000002', 'Trần Quốc Minh', 'EM-100002', 'minh.tran@dental.com', '$2a$10$EGvcf2dZ1EA0Egj28geKruQphZIcvHEuAg/imSQc/ek1.DCOXRXge', '0912345602', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80', 'EMPLOYEE', 'ACTIVE', NOW(), NOW()),
    ('41000000-0000-4000-8000-000000000003', 'Lê Ngọc Lan', 'EM-100003', 'lan.le@dental.com', '$2a$10$EGvcf2dZ1EA0Egj28geKruQphZIcvHEuAg/imSQc/ek1.DCOXRXge', '0912345603', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80', 'EMPLOYEE', 'ACTIVE', NOW(), NOW()),

    -- 10 Bác sĩ phân bổ tại 3 chi nhánh (4 CN1 + 3 CN2 + 3 CN3)
    ('21000000-0000-4000-8000-000000000001', 'Nguyễn Thị Phương', 'BS-100001', 'phuong.nguyen@dental.com', '$2a$10$EGvcf2dZ1EA0Egj28geKruQphZIcvHEuAg/imSQc/ek1.DCOXRXge', '0901122301', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80', 'DENTIST', 'ACTIVE', NOW(), NOW()),
    ('21000000-0000-4000-8000-000000000002', 'Phạm Hoàng Nam', 'BS-100002', 'nam.pham@dental.com', '$2a$10$EGvcf2dZ1EA0Egj28geKruQphZIcvHEuAg/imSQc/ek1.DCOXRXge', '0901122302', 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=300&q=80', 'DENTIST', 'ACTIVE', NOW(), NOW()),
    ('21000000-0000-4000-8000-000000000003', 'Đặng Thu Hà', 'BS-100003', 'ha.dang@dental.com', '$2a$10$EGvcf2dZ1EA0Egj28geKruQphZIcvHEuAg/imSQc/ek1.DCOXRXge', '0901122303', 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=300&q=80', 'DENTIST', 'ACTIVE', NOW(), NOW()),
    ('21000000-0000-4000-8000-000000000004', 'Vũ Đức Anh', 'BS-100004', 'anh.vu@dental.com', '$2a$10$EGvcf2dZ1EA0Egj28geKruQphZIcvHEuAg/imSQc/ek1.DCOXRXge', '0901122304', 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80', 'DENTIST', 'ACTIVE', NOW(), NOW()),
    ('21000000-0000-4000-8000-000000000005', 'Trần Quang Huy', 'BS-100005', 'quang.tran@dental.com', '$2a$10$EGvcf2dZ1EA0Egj28geKruQphZIcvHEuAg/imSQc/ek1.DCOXRXge', '0901122305', 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=300&q=80', 'DENTIST', 'ACTIVE', NOW(), NOW()),
    ('21000000-0000-4000-8000-000000000006', 'Lê Minh Châu', 'BS-100006', 'chau.le@dental.com', '$2a$10$EGvcf2dZ1EA0Egj28geKruQphZIcvHEuAg/imSQc/ek1.DCOXRXge', '0901122306', 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&w=300&q=80', 'DENTIST', 'ACTIVE', NOW(), NOW()),
    ('21000000-0000-4000-8000-000000000007', 'Hoàng Gia Bảo', 'BS-100007', 'bao.hoang@dental.com', '$2a$10$EGvcf2dZ1EA0Egj28geKruQphZIcvHEuAg/imSQc/ek1.DCOXRXge', '0901122307', 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=300&q=80', 'DENTIST', 'ACTIVE', NOW(), NOW()),
    ('21000000-0000-4000-8000-000000000008', 'Bùi Thanh Trúc', 'BS-100008', 'truc.bui@dental.com', '$2a$10$EGvcf2dZ1EA0Egj28geKruQphZIcvHEuAg/imSQc/ek1.DCOXRXge', '0901122308', 'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?auto=format&fit=crop&w=300&q=80', 'DENTIST', 'ACTIVE', NOW(), NOW()),
    ('21000000-0000-4000-8000-000000000009', 'Ngô Tuấn Kiệt', 'BS-100009', 'kiet.ngo@dental.com', '$2a$10$EGvcf2dZ1EA0Egj28geKruQphZIcvHEuAg/imSQc/ek1.DCOXRXge', '0901122309', 'https://images.unsplash.com/photo-1612531386530-97286d97c2d2?auto=format&fit=crop&w=300&q=80', 'DENTIST', 'ACTIVE', NOW(), NOW()),
    ('21000000-0000-4000-8000-000000000010', 'Đỗ Khánh Linh', 'BS-100010', 'linh.do@dental.com', '$2a$10$EGvcf2dZ1EA0Egj28geKruQphZIcvHEuAg/imSQc/ek1.DCOXRXge', '0901122310', 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&w=300&q=80', 'DENTIST', 'ACTIVE', NOW(), NOW()),

    -- CHỈ 1 Tài khoản Bệnh nhân (khớp mã PA-839092 và SĐT 0343632524 với Bệnh nhân số 1)
    ('55555555-5555-5555-5555-555555555555', 'Nguyễn Tâm Thành', 'PA-839092', 'tamthanh@patient.clinic.vn', '$2a$10$EGvcf2dZ1EA0Egj28geKruQphZIcvHEuAg/imSQc/ek1.DCOXRXge', '0343632524', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80', 'PATIENT', 'ACTIVE', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 10. BẢNG EMPLOYEES (3 Nhân viên ứng với 3 Chi nhánh)
-- ============================================================================
INSERT INTO employees (
    id, user_id, full_name, position, salary, hire_date, status, gender, date_of_birth, address, branch_id
) VALUES
    ('b1000000-0000-4000-8000-000000000001', '41000000-0000-4000-8000-000000000001', 'Nguyễn Phương Thảo', 'RECEPTIONIST', 10500000.00, NOW() - INTERVAL '2 years', TRUE, 'Nữ', DATE '1996-03-15', '120 Bạch Mai, Quận Hai Bà Trưng, Hà Nội', 'branch-hn-01'),
    ('b1000000-0000-4000-8000-000000000002', '41000000-0000-4000-8000-000000000002', 'Trần Quốc Minh', 'RECEPTIONIST', 11000000.00, NOW() - INTERVAL '18 months', TRUE, 'Nam', DATE '1995-08-22', '45 Lê Văn Sỹ, Quận 3, TP. Hồ Chí Minh', 'branch-hcm-01'),
    ('b1000000-0000-4000-8000-000000000003', '41000000-0000-4000-8000-000000000003', 'Lê Ngọc Lan', 'RECEPTIONIST', 10000000.00, NOW() - INTERVAL '1 year', TRUE, 'Nữ', DATE '1998-11-09', '88 Phú Lợi, TP. Thủ Dầu Một, Bình Dương', 'branch-bd-01')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 11. BẢNG DENTISTS (10 Bác sĩ ứng với từng Chi nhánh: 4 CN1, 3 CN2, 3 CN3)
-- ============================================================================
INSERT INTO dentists (
    id, user_id, full_name, gender, date_of_birth, address,
    education, description, experience_years, license_number, branch_id
) VALUES
    -- Chi nhánh 1: Hà Nội (4 bác sĩ)
    ('a1000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000001', 'BS. CKI Nguyễn Thị Phương', 'Nữ', DATE '1988-05-12', 'Quận Hai Bà Trưng, Hà Nội', 'Bác sĩ Chuyên khoa I Răng Hàm Mặt - Đại học Y Hà Nội', 'Chuyên gia Chỉnh nha khay trong suốt Invisalign & Mắc cài tự buộc', 12, 'CCHN-HN-001024', 'branch-hn-01'),
    ('a1000000-0000-4000-8000-000000000002', '21000000-0000-4000-8000-000000000002', 'ThS. BS. Phạm Hoàng Nam', 'Nam', DATE '1985-09-18', 'Quận Đống Đa, Hà Nội', 'Thạc sĩ Răng Hàm Mặt - Đại học Y Hà Nội', 'Chuyên gia Cấy ghép Implant kỹ thuật số & Ghép xương toàn hàm', 14, 'CCHN-HN-001089', 'branch-hn-01'),
    ('a1000000-0000-4000-8000-000000000003', '21000000-0000-4000-8000-000000000003', 'BS. Đặng Thu Hà', 'Nữ', DATE '1991-02-24', 'Quận Hoàn Kiếm, Hà Nội', 'Bác sĩ Răng Hàm Mặt - Đại học Y Hà Nội', 'Chuyên sâu Phục hình răng sứ thẩm mỹ Veneer & Nội nha vi phẫu', 9, 'CCHN-HN-001245', 'branch-hn-01'),
    ('a1000000-0000-4000-8000-000000000004', '21000000-0000-4000-8000-000000000004', 'BS. Vũ Đức Anh', 'Nam', DATE '1990-11-05', 'Quận Cầu Giấy, Hà Nội', 'Bác sĩ Răng Hàm Mặt - Học viện Quân Y', 'Chuyên sâu Tiểu phẫu răng khôn Piezotome & Điều trị nha chu', 10, 'CCHN-HN-001312', 'branch-hn-01'),

    -- Chi nhánh 2: TP.HCM (3 bác sĩ)
    ('a1000000-0000-4000-8000-000000000005', '21000000-0000-4000-8000-000000000005', 'BS. CKII Trần Quang Huy', 'Nam', DATE '1983-07-20', 'Quận 3, TP. Hồ Chí Minh', 'Bác sĩ Chuyên khoa II - Đại học Y Dược TP.HCM', 'Chuyên gia Phục hình toàn hàm All-on-4 / All-on-6 & Implant Thụy Sĩ', 16, 'CCHN-HCM-002015', 'branch-hcm-01'),
    ('a1000000-0000-4000-8000-000000000006', '21000000-0000-4000-8000-000000000006', 'ThS. BS. Lê Minh Châu', 'Nữ', DATE '1989-04-14', 'Quận 1, TP. Hồ Chí Minh', 'Thạc sĩ Chỉnh hình Răng Mặt - Đại học Y Dược TP.HCM', 'Chuyên gia Niềng răng thẩm mỹ & Chỉnh nha tăng trưởng trẻ em', 11, 'CCHN-HCM-002188', 'branch-hcm-01'),
    ('a1000000-0000-4000-8000-000000000007', '21000000-0000-4000-8000-000000000007', 'BS. Hoàng Gia Bảo', 'Nam', DATE '1992-10-30', 'Quận Phú Nhuận, TP. Hồ Chí Minh', 'Bác sĩ Răng Hàm Mặt - Đại học Y Khoa Phạm Ngọc Thạch', 'Chuyên sâu Thiết kế nụ cười kỹ thuật số DSD & Nha khoa tổng quát', 8, 'CCHN-HCM-002309', 'branch-hcm-01'),

    -- Chi nhánh 3: Bình Dương (3 bác sĩ)
    ('a1000000-0000-4000-8000-000000000008', '21000000-0000-4000-8000-000000000008', 'BS. CKI Bùi Thanh Trúc', 'Nữ', DATE '1987-06-08', 'TP. Thủ Dầu Một, Bình Dương', 'Bác sĩ Chuyên khoa I - Đại học Y Dược TP.HCM', 'Chuyên gia Chỉnh nha mắc cài & Nha khoa trẻ em không đau', 13, 'CCHN-BD-003041', 'branch-bd-01'),
    ('a1000000-0000-4000-8000-000000000009', '21000000-0000-4000-8000-000000000009', 'BS. Ngô Tuấn Kiệt', 'Nam', DATE '1989-12-19', 'TP. Thuận An, Bình Dương', 'Bác sĩ Răng Hàm Mặt - Đại học Y Dược Cần Thơ', 'Chuyên sâu Cấy ghép Implant Hàn Quốc - Châu Âu & Tiểu phẫu miệng', 11, 'CCHN-BD-003112', 'branch-bd-01'),
    ('a1000000-0000-4000-8000-000000000010', '21000000-0000-4000-8000-000000000010', 'BS. Đỗ Khánh Linh', 'Nữ', DATE '1993-03-27', 'TP. Dĩ An, Bình Dương', 'Bác sĩ Răng Hàm Mặt - Đại học Quốc gia TP.HCM', 'Chuyên sâu Răng toàn sứ thẩm mỹ, Tẩy trắng Laser & Nội nha', 7, 'CCHN-BD-003276', 'branch-bd-01')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 11B. BẢNG CERTIFICATES (20 Chứng chỉ cho 10 Bác sĩ: mỗi bác sĩ có đủ 2 chứng chỉ
--      gồm 1 Chứng chỉ hành nghề PRACTICE_LICENSE + 1 Chứng chỉ chuyên môn)
-- ============================================================================
INSERT INTO certificates (
    id, dentist_id, certificate_name, certificate_number, certificate_type,
    issued_by, issue_date, expiry_date, is_lifetime, practicing_doctor_name,
    qualification, scope_of_practice, identity_card_number, certificate_file_url,
    created_at, updated_at
) VALUES
    -- 1. BS. CKI Nguyễn Thị Phương (CN1 - Hà Nội)
    ('81000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'Chứng chỉ hành nghề Khám bệnh', 'CCHN-HN-001024', 'PRACTICE_LICENSE', 'Sở Y tế Thành phố Hà Nội', TIMESTAMP '2014-06-15 00:00:00', NULL, TRUE, 'Nguyễn Thị Phương', 'Bác sĩ Chuyên khoa I (CKI)', 'Khám bệnh, chữa bệnh chuyên khoa Răng hàm mặt', '001188010241', 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=800&q=80', NOW(), NOW()),
    ('81000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', 'Chứng chỉ Chuyên môn Chỉnh hình Răng Mặt & Invisalign Quốc tế', 'CCCM-ORT-201801', 'ORTHODONTICS', 'Trường Đại học Y Hà Nội', TIMESTAMP '2018-09-20 00:00:00', TIMESTAMP '2030-09-20 00:00:00', FALSE, 'Nguyễn Thị Phương', 'Bác sĩ Chuyên khoa I (CKI)', 'Chỉnh hình răng mặt chuyên sâu bằng mắc cài và khay trong suốt Invisalign', '001188010241', 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=800&q=80', NOW(), NOW()),

    -- 2. ThS. BS. Phạm Hoàng Nam (CN1 - Hà Nội)
    ('81000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000002', 'Chứng chỉ hành nghề Khám bệnh, chữa bệnh Răng Hàm Mặt', 'CCHN-HN-001089', 'PRACTICE_LICENSE', 'Sở Y tế Thành phố Hà Nội', TIMESTAMP '2012-04-10 00:00:00', NULL, TRUE, 'Phạm Hoàng Nam', 'Thạc sĩ - Bác sĩ', 'Khám bệnh, chữa bệnh chuyên khoa Răng hàm mặt', '001085010892', 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=800&q=80', NOW(), NOW()),
    ('81000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000002', 'Chứng chỉ Chuyên môn Cấy ghép Nha khoa Kỹ thuật số & Ghép xương', 'CCCM-IMP-201602', 'IMPLANT_DENTISTRY', 'Bệnh viện Răng Hàm Mặt Trung ương Hà Nội', TIMESTAMP '2016-11-12 00:00:00', TIMESTAMP '2031-11-12 00:00:00', FALSE, 'Phạm Hoàng Nam', 'Thạc sĩ - Bác sĩ', 'Cấy ghép Nha khoa (Dental Implant) và ghép xương nâng xoang hàm', '001085010892', 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=800&q=80', NOW(), NOW()),

    -- 3. BS. Đặng Thu Hà (CN1 - Hà Nội)
    ('81000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000003', 'Chứng chỉ hành nghề Khám bệnh', 'CCHN-HN-001245', 'PRACTICE_LICENSE', 'Sở Y tế Thành phố Hà Nội', TIMESTAMP '2017-05-18 00:00:00', NULL, TRUE, 'Đặng Thu Hà', 'Bác sĩ Răng Hàm Mặt', 'Khám bệnh, chữa bệnh chuyên khoa Răng hàm mặt', '001191012453', 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=800&q=80', NOW(), NOW()),
    ('81000000-0000-4000-8000-000000000006', 'a1000000-0000-4000-8000-000000000003', 'Chứng chỉ Chuyên môn Phục hình Răng sứ Thẩm mỹ & Mặt dán Veneer', 'CCCM-COS-201903', 'COSMETIC_DENTISTRY', 'Trường Đại học Y Hà Nội', TIMESTAMP '2019-08-05 00:00:00', TIMESTAMP '2030-08-05 00:00:00', FALSE, 'Đặng Thu Hà', 'Bác sĩ Răng Hàm Mặt', 'Phục hình thẩm mỹ xâm lấn tối thiểu Veneer và mão toàn sứ CAD/CAM', '001191012453', 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=800&q=80', NOW(), NOW()),

    -- 4. BS. Vũ Đức Anh (CN1 - Hà Nội)
    ('81000000-0000-4000-8000-000000000007', 'a1000000-0000-4000-8000-000000000004', 'Chứng chỉ hành nghề Khám bệnh', 'CCHN-HN-001312', 'PRACTICE_LICENSE', 'Sở Y tế Thành phố Hà Nội', TIMESTAMP '2016-07-22 00:00:00', NULL, TRUE, 'Vũ Đức Anh', 'Bác sĩ Răng Hàm Mặt', 'Khám bệnh, chữa bệnh chuyên khoa Răng hàm mặt', '001090013124', 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=800&q=80', NOW(), NOW()),
    ('81000000-0000-4000-8000-000000000008', 'a1000000-0000-4000-8000-000000000004', 'Chứng chỉ Chuyên môn Phẫu thuật Nhổ răng khôn Siêu âm Piezotome', 'CCCM-EXT-201804', 'TOOTH_EXTRACTION', 'Học viện Quân Y', TIMESTAMP '2018-10-14 00:00:00', TIMESTAMP '2030-10-14 00:00:00', FALSE, 'Vũ Đức Anh', 'Bác sĩ Răng Hàm Mặt', 'Tiểu phẫu trong miệng và phẫu thuật nhổ răng khôn mọc lệch ngầm', '001090013124', 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=800&q=80', NOW(), NOW()),

    -- 5. BS. CKII Trần Quang Huy (CN2 - TP.HCM)
    ('81000000-0000-4000-8000-000000000009', 'a1000000-0000-4000-8000-000000000005', 'Chứng chỉ hành nghề Khám bệnh', 'CCHN-HCM-002015', 'PRACTICE_LICENSE', 'Sở Y tế Thành phố Hồ Chí Minh', TIMESTAMP '2010-03-12 00:00:00', NULL, TRUE, 'Trần Quang Huy', 'Bác sĩ Chuyên khoa II (CKII)', 'Khám bệnh, chữa bệnh chuyên khoa Răng hàm mặt', '079083020155', 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=800&q=80', NOW(), NOW()),
    ('81000000-0000-4000-8000-000000000010', 'a1000000-0000-4000-8000-000000000005', 'Chứng chỉ Chuyên môn Cấy ghép Implant Toàn hàm All-on-4 / All-on-6', 'CCCM-IMP-201505', 'IMPLANT_DENTISTRY', 'Đại học Y Dược TP. Hồ Chí Minh', TIMESTAMP '2015-06-30 00:00:00', TIMESTAMP '2032-06-30 00:00:00', FALSE, 'Trần Quang Huy', 'Bác sĩ Chuyên khoa II (CKII)', 'Cấy ghép Nha khoa chuyên sâu và phục hình toàn hàm kỹ thuật số', '079083020155', 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=800&q=80', NOW(), NOW()),

    -- 6. ThS. BS. Lê Minh Châu (CN2 - TP.HCM)
    ('81000000-0000-4000-8000-000000000011', 'a1000000-0000-4000-8000-000000000006', 'Chứng chỉ hành nghề Khám bệnh', 'CCHN-HCM-002188', 'PRACTICE_LICENSE', 'Sở Y tế Thành phố Hồ Chí Minh', TIMESTAMP '2015-08-19 00:00:00', NULL, TRUE, 'Lê Minh Châu', 'Thạc sĩ - Bác sĩ', 'Khám bệnh, chữa bệnh chuyên khoa Răng hàm mặt', '079189021886', 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=800&q=80', NOW(), NOW()),
    ('81000000-0000-4000-8000-000000000012', 'a1000000-0000-4000-8000-000000000006', 'Chứng chỉ Chuyên môn Chỉnh hình Răng Mặt & Chỉnh nha Tăng trưởng', 'CCCM-ORT-201706', 'ORTHODONTICS', 'Đại học Y Dược TP. Hồ Chí Minh', TIMESTAMP '2017-12-10 00:00:00', TIMESTAMP '2031-12-10 00:00:00', FALSE, 'Lê Minh Châu', 'Thạc sĩ - Bác sĩ', 'Chỉnh hình răng mặt thẩm mỹ và can thiệp sai khớp cắn trẻ em', '079189021886', 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=800&q=80', NOW(), NOW()),

    -- 7. BS. Hoàng Gia Bảo (CN2 - TP.HCM)
    ('81000000-0000-4000-8000-000000000013', 'a1000000-0000-4000-8000-000000000007', 'Chứng chỉ hành nghề Khám bệnh', 'CCHN-HCM-002309', 'PRACTICE_LICENSE', 'Sở Y tế Thành phố Hồ Chí Minh', TIMESTAMP '2018-04-25 00:00:00', NULL, TRUE, 'Hoàng Gia Bảo', 'Bác sĩ Răng Hàm Mặt', 'Khám bệnh, chữa bệnh chuyên khoa Răng hàm mặt', '079092023097', 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=800&q=80', NOW(), NOW()),
    ('81000000-0000-4000-8000-000000000014', 'a1000000-0000-4000-8000-000000000007', 'Chứng chỉ Chuyên môn Phẫu thuật Nha chu & Thiết kế Nụ cười DSD', 'CCCM-PER-202007', 'PERIODONTICS', 'Bệnh viện Răng Hàm Mặt Trung ương TP.HCM', TIMESTAMP '2020-09-15 00:00:00', TIMESTAMP '2030-09-15 00:00:00', FALSE, 'Hoàng Gia Bảo', 'Bác sĩ Răng Hàm Mặt', 'Điều trị bệnh lý nha chu chuyên sâu và tạo hình viền nướu thẩm mỹ', '079092023097', 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=800&q=80', NOW(), NOW()),

    -- 8. BS. CKI Bùi Thanh Trúc (CN3 - Bình Dương)
    ('81000000-0000-4000-8000-000000000015', 'a1000000-0000-4000-8000-000000000008', 'Chứng chỉ hành nghề Khám bệnh', 'CCHN-BD-003041', 'PRACTICE_LICENSE', 'Sở Y tế Tỉnh Bình Dương', TIMESTAMP '2013-07-08 00:00:00', NULL, TRUE, 'Bùi Thanh Trúc', 'Bác sĩ Chuyên khoa I (CKI)', 'Khám bệnh, chữa bệnh chuyên khoa Răng hàm mặt', '074187030418', 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=800&q=80', NOW(), NOW()),
    ('81000000-0000-4000-8000-000000000016', 'a1000000-0000-4000-8000-000000000008', 'Chứng chỉ Chuyên môn Chỉnh nha Mắc cài & Nha khoa Trẻ em', 'CCCM-ORT-201608', 'ORTHODONTICS', 'Đại học Y Dược TP. Hồ Chí Minh', TIMESTAMP '2016-10-22 00:00:00', TIMESTAMP '2031-10-22 00:00:00', FALSE, 'Bùi Thanh Trúc', 'Bác sĩ Chuyên khoa I (CKI)', 'Chỉnh nha cố định mắc cài và điều trị dự phòng nha khoa trẻ em', '074187030418', 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=800&q=80', NOW(), NOW()),

    -- 9. BS. Ngô Tuấn Kiệt (CN3 - Bình Dương)
    ('81000000-0000-4000-8000-000000000017', 'a1000000-0000-4000-8000-000000000009', 'Chứng chỉ hành nghề Khám bệnh', 'CCHN-BD-003112', 'PRACTICE_LICENSE', 'Sở Y tế Tỉnh Bình Dương', TIMESTAMP '2015-05-14 00:00:00', NULL, TRUE, 'Ngô Tuấn Kiệt', 'Bác sĩ Răng Hàm Mặt', 'Khám bệnh, chữa bệnh chuyên khoa Răng hàm mặt', '074089031129', 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=800&q=80', NOW(), NOW()),
    ('81000000-0000-4000-8000-000000000018', 'a1000000-0000-4000-8000-000000000009', 'Chứng chỉ Chuyên môn Cấy ghép Implant Nha khoa Lâm sàng', 'CCCM-IMP-201809', 'IMPLANT_DENTISTRY', 'Đại học Y Dược Cần Thơ', TIMESTAMP '2018-04-18 00:00:00', TIMESTAMP '2030-04-18 00:00:00', FALSE, 'Ngô Tuấn Kiệt', 'Bác sĩ Răng Hàm Mặt', 'Cấy ghép Nha khoa (Dental Implant) và tiểu phẫu phục hình trên Implant', '074089031129', 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=800&q=80', NOW(), NOW()),

    -- 10. BS. Đỗ Khánh Linh (CN3 - Bình Dương)
    ('81000000-0000-4000-8000-000000000019', 'a1000000-0000-4000-8000-000000000010', 'Chứng chỉ hành nghề Khám bệnh', 'CCHN-BD-003276', 'PRACTICE_LICENSE', 'Sở Y tế Tỉnh Bình Dương', TIMESTAMP '2019-06-11 00:00:00', NULL, TRUE, 'Đỗ Khánh Linh', 'Bác sĩ Răng Hàm Mặt', 'Khám bệnh, chữa bệnh chuyên khoa Răng hàm mặt', '074193032760', 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=800&q=80', NOW(), NOW()),
    ('81000000-0000-4000-8000-000000000020', 'a1000000-0000-4000-8000-000000000010', 'Chứng chỉ Chuyên môn Nội nha Vi phẫu & Phục hình Thẩm mỹ', 'CCCM-GEN-202110', 'GENERAL_DENTISTRY', 'Bệnh viện Răng Hàm Mặt Trung ương TP.HCM', TIMESTAMP '2021-08-25 00:00:00', TIMESTAMP '2031-08-25 00:00:00', FALSE, 'Đỗ Khánh Linh', 'Bác sĩ Răng Hàm Mặt', 'Nội nha vi phẫu trâm máy và phục hình răng toàn sứ thẩm mỹ', '074193032760', 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=800&q=80', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 12. BẢNG PATIENTS (3 Bệnh nhân mẫu - đầy đủ thuộc tính)
--     - Bệnh nhân 1 (PA-839092): Đã liên kết user_id ('55555555-...') để đăng nhập ngay
--     - Bệnh nhân 2 (PA-100002) & Bệnh nhân 3 (PA-100003): user_id = NULL
--       (hồ sơ có sẵn tại phòng khám, có thể dùng để test Kích hoạt tài khoản)
-- ============================================================================
INSERT INTO patients (
    id, user_id, created_branch_id, patient_code, full_name, nationality, hometown,
    job, phone_number, cccd, email, gender, date_of_birth, address,
    contact_name, contact_phone, contact_relationship,
    systemic_disease, allergies, current_medications, surgical_history, created_at, version
) VALUES
    (
        'c1111111-1111-1111-1111-111111111111',
        '55555555-5555-5555-5555-555555555555',
        'branch-hn-01',
        'PA-839092',
        'Nguyễn Tâm Thành',
        'Việt Nam',
        'Hà Nội',
        'Kỹ sư phần mềm',
        '0343632524',
        '001095012345',
        'tamthanh@patient.clinic.vn',
        'MALE',
        TIMESTAMP '1995-04-10 00:00:00',
        'Số 85 Nguyễn Du, Quận Hai Bà Trưng, TP. Hà Nội',
        'Nguyễn Thị Mai',
        '0912888999',
        'Vợ',
        'Không có bệnh lý toàn thân',
        'Không dị ứng thuốc',
        'Không dùng thuốc định kỳ',
        'Chưa từng phẫu thuật',
        NOW(),
        0
    ),
    (
        'c2222222-2222-2222-2222-222222222222',
        NULL,
        'branch-hcm-01',
        'PA-100002',
        'Lê Thị Hương',
        'Việt Nam',
        'Đà Nẵng',
        'Giáo viên THPT',
        '0901112233',
        '079194023456',
        'huong.le@patient.clinic.vn',
        'FEMALE',
        TIMESTAMP '1994-08-22 00:00:00',
        'Số 142 Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh',
        'Lê Văn Dũng',
        '0909333444',
        'Chồng',
        'Huyết áp ổn định',
        'Dị ứng nhẹ hải sản',
        'Vitamin tổng hợp',
        'Đã nhổ răng số 38 năm 2022',
        NOW(),
        0
    ),
    (
        'c3333333-3333-3333-3333-333333333333',
        NULL,
        'branch-bd-01',
        'PA-100003',
        'Trần Minh Long',
        'Việt Nam',
        'Bình Dương',
        'Chuyên viên tài chính',
        '0903456789',
        '074091034567',
        'long.tran@patient.clinic.vn',
        'MALE',
        TIMESTAMP '1991-12-05 00:00:00',
        'Số 210 Đại Lộ Bình Dương, TP. Thủ Dầu Một, Bình Dương',
        'Trần Thị Thu',
        '0988777666',
        'Mẹ',
        'Không',
        'Không dị ứng kháng sinh Penicillin',
        'Không',
        'Chưa từng phẫu thuật ngoại khoa',
        NOW(),
        0
    )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 13. BẢNG MEDICAL_RECORDS (3 Hồ sơ bệnh án khớp tương ứng với 3 Bệnh nhân mẫu)
-- ============================================================================
INSERT INTO medical_records (
    id, medical_record_code, patient_id, dentist_id, branch_id, appointment_id, treatment_notes, record_date
) VALUES
    (
        '91000000-0000-4000-8000-000000000001',
        'HSBA-00000001',
        'c1111111-1111-1111-1111-111111111111',
        'a1000000-0000-4000-8000-000000000001',
        'branch-hn-01',
        NULL,
        'Hồ sơ bệnh án điện tử của bệnh nhân Nguyễn Tâm Thành (PA-839092): Khám tổng quát, cạo vôi răng định kỳ và theo dõi tư vấn chỉnh nha khay trong suốt.',
        NOW()
    ),
    (
        '91000000-0000-4000-8000-000000000002',
        'HSBA-00000002',
        'c2222222-2222-2222-2222-222222222222',
        'a1000000-0000-4000-8000-000000000005',
        'branch-hcm-01',
        NULL,
        'Hồ sơ bệnh án điện tử của bệnh nhân Lê Thị Hương (PA-100002): Theo dõi phục hồi trám răng thẩm mỹ Composite R24 và kiểm tra men răng định kỳ 6 tháng.',
        NOW()
    ),
    (
        '91000000-0000-4000-8000-000000000003',
        'HSBA-00000003',
        'c3333333-3333-3333-3333-333333333333',
        'a1000000-0000-4000-8000-000000000008',
        'branch-bd-01',
        NULL,
        'Hồ sơ bệnh án điện tử của bệnh nhân Trần Minh Long (PA-100003): Khám kiểm tra khớp cắn, chăm sóc nha chu chuyên sâu và tư vấn phục hình răng.',
        NOW()
    )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 14. RÀNG BUỘC QUAN TRỌNG: ĐẶT DƯỚI CÙNG SAU TOÀN BỘ DỮ LIỆU SEED
-- ============================================================================

-- Dọn dẹp ràng buộc khóa ngoại cũ không tương thích kiểu dữ liệu (nếu có)
ALTER TABLE IF EXISTS invoice_details DROP CONSTRAINT IF EXISTS fk6olubg9il8wjve6h3dql5wpi;

-- Đảm bảo đầy đủ các cột bổ sung & Optimistic Locking khi chạy trên CSDL đã tồn tại
ALTER TABLE IF EXISTS appointments ADD COLUMN IF NOT EXISTS appointment_code VARCHAR(40);
ALTER TABLE IF EXISTS appointments ADD COLUMN IF NOT EXISTS is_check BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS appointments ADD COLUMN IF NOT EXISTS email VARCHAR(254);
ALTER TABLE IF EXISTS appointments ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;
ALTER TABLE IF EXISTS patients ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;
ALTER TABLE IF EXISTS patients ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255);
ALTER TABLE IF EXISTS patients ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
ALTER TABLE IF EXISTS patients ADD COLUMN IF NOT EXISTS contact_relationship VARCHAR(100);
ALTER TABLE IF EXISTS appointment_requests ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;

UPDATE patients SET version = 0 WHERE version IS NULL;
UPDATE appointments SET version = 0 WHERE version IS NULL;
UPDATE appointment_requests SET version = 0 WHERE version IS NULL;

-- Đồng bộ CHECK constraint cho loại chương trình khuyến mãi
ALTER TABLE IF EXISTS promotions
    DROP CONSTRAINT IF EXISTS promotions_promotion_type_check,
    ADD CONSTRAINT promotions_promotion_type_check
        CHECK (promotion_type IS NULL OR promotion_type IN ('VOUCHER', 'EVENT', 'DISCOUNT_PERCENT', 'FIXED_AMOUNT'));

-- Đồng bộ CHECK constraint cho loại tin nhắn Chat tư vấn (bao gồm IMAGE và STICKER)
ALTER TABLE IF EXISTS chat_messages
    DROP CONSTRAINT IF EXISTS chat_messages_message_type_check,
    ADD CONSTRAINT chat_messages_message_type_check
        CHECK (message_type IN ('TEXT', 'IMAGE', 'VIDEO', 'FILE', 'AUDIO', 'SYSTEM', 'STICKER'));

-- Dọn dẹp lịch trùng lặp (nếu có) trước khi đánh Unique Index khung giờ bác sĩ
UPDATE appointments
SET status = 'CANCELLED'
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (
            PARTITION BY dentist_id, appointment_date, appointment_time
            ORDER BY id
        ) AS rn
        FROM appointments
        WHERE dentist_id IS NOT NULL AND status != 'CANCELLED'
    ) t WHERE t.rn > 1
);

-- Không cho phép một bác sĩ có hai lịch đang hoạt động cùng thời điểm (trừ lịch CANCELLED)
CREATE UNIQUE INDEX IF NOT EXISTS uk_dentist_active_timeslot
    ON appointments (dentist_id, appointment_date, appointment_time)
    WHERE status != 'CANCELLED';

-- Mỗi kết quả khám chỉ được gắn với một kế hoạch điều trị
CREATE UNIQUE INDEX IF NOT EXISTS uk_treatment_plans_examination_result
    ON treatment_plans (examination_result_id);

-- Không cho phép trùng mã thuốc, mã dịch vụ, mã tình trạng răng và mã bệnh nhân
CREATE UNIQUE INDEX IF NOT EXISTS uk_medicines_code
    ON medicines (code);

CREATE UNIQUE INDEX IF NOT EXISTS uk_services_code
    ON services (service_code);

CREATE UNIQUE INDEX IF NOT EXISTS uk_tooth_status_code
    ON tooth_status (tooth_code);

CREATE UNIQUE INDEX IF NOT EXISTS uk_patients_patient_code
    ON patients (patient_code);

-- Không cho phép trùng mã coupon của Voucher
CREATE UNIQUE INDEX IF NOT EXISTS uk_promotions_coupon_code
    ON promotions (coupon_code)
    WHERE coupon_code IS NOT NULL;

-- Mỗi bệnh nhân chỉ có một quan hệ đang hoạt động với cùng đối tượng
CREATE UNIQUE INDEX IF NOT EXISTS uq_patient_relationships_active_target
    ON patient_relationships (related_patient_id)
    WHERE status = true;

-- Chuẩn hóa mã lịch hẹn & ràng buộc NOT NULL cho cờ is_check
UPDATE appointments SET appointment_code = 'APT-' || UPPER(REPLACE(id::text, '-', ''))
WHERE appointment_code IS NULL OR appointment_code = '';
UPDATE appointments SET is_check = TRUE
WHERE status IN ('WAITING', 'CALLED', 'IN_PROGRESS', 'COMPLETED');
UPDATE appointments SET is_check = FALSE WHERE is_check IS NULL;
ALTER TABLE appointments ALTER COLUMN is_check SET DEFAULT FALSE;
ALTER TABLE appointments ALTER COLUMN is_check SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uk_appointments_code ON appointments (appointment_code);

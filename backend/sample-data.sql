-- ============================================
-- INSERT DỮ LIỆU CHUYÊN MÔN (SPECIALIZATIONS)
-- ============================================
INSERT INTO specializations (id, name, description, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Chỉnh nha', 'Chuyên về xếp chỉnh các hàm nhai, niềng răng', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'Phục hình', 'Phục hình các chiếc răng bị hỏng, cấy ghép implant', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'Nha chu', 'Điều trị bệnh lý nướu và xương quanh răng', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'Nha khoa trẻ em', 'Điều trị và chăm sóc các vấn đề nha khoa ở trẻ em', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'Nha khoa thẩm mỹ', 'Tẩy trắng, bọc sứ, cắt nướu thẩm mỹ', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440006', 'Phẫu thuật răng hàm mặt', 'Phẫu thuật nhổ răng khôn, tạo hình hàm', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440007', 'Nội nha', 'Điều trị tủy răng, chữa viêm tủy', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440008', 'Bảo tồn nha', 'Lấy cao, súc miệng, dự phòng bệnh', NOW(), NOW());

-- ============================================
-- INSERT CHỨNG CHỈ (CERTIFICATES)
-- Thay thế {dentist_id_1}, {dentist_id_2}, ... bằng UUID nha sĩ thực tế
-- ============================================

-- Chứng chỉ cho nha sĩ 1
INSERT INTO certificates (id, certificate_name, certificate_number, issued_by, issue_date, expiry_date, certificate_file_url, dentist_id, created_at, updated_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Bằng Cấp III - Nha khoa', 'NK2020-001', 'Trường Đại học Y Dược TP.HCM', '2020-06-15 00:00:00', '2030-06-15 00:00:00', '/certificates/dentist1-cert1.pdf', '{dentist_id_1}', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440002', 'Chứng chỉ Chỉnh nha', 'CC2021-001', 'Hiệp hội Nha khoa Việt Nam', '2021-03-20 00:00:00', '2026-03-20 00:00:00', '/certificates/dentist1-cert2.pdf', '{dentist_id_1}', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440003', 'Giấy phép hành nghề', 'GPHP2022-001', 'Sở Y tế TP.HCM', '2022-01-10 00:00:00', '2027-01-10 00:00:00', '/certificates/dentist1-cert3.pdf', '{dentist_id_1}', NOW(), NOW()),

-- Chứng chỉ cho nha sĩ 2
('660e8400-e29b-41d4-a716-446655440004', 'Bằng Cấp II - Nha khoa', 'NK2019-002', 'Trường Đại học Y Dược Hà Nội', '2019-07-05 00:00:00', '2029-07-05 00:00:00', '/certificates/dentist2-cert1.pdf', '{dentist_id_2}', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440005', 'Chứng chỉ Phục hình', 'PH2020-001', 'Viện Nha khoa Quốc tế', '2020-05-12 00:00:00', '2025-05-12 00:00:00', '/certificates/dentist2-cert2.pdf', '{dentist_id_2}', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440006', 'Chứng chỉ Nha chu', 'NC2021-001', 'Hiệp hội Nha khoa Việt Nam', '2021-11-08 00:00:00', '2026-11-08 00:00:00', '/certificates/dentist2-cert3.pdf', '{dentist_id_2}', NOW(), NOW()),

-- Chứng chỉ cho nha sĩ 3
('660e8400-e29b-41d4-a716-446655440007', 'Bằng Cạo Cao Cấp', 'BCC2020-001', 'Đại học Y Tế Công Cộng', '2020-09-18 00:00:00', '2025-09-18 00:00:00', '/certificates/dentist3-cert1.pdf', '{dentist_id_3}', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440008', 'Giấy phép hành nghề', 'GPHP2021-001', 'Sở Y tế Hà Nội', '2021-02-15 00:00:00', '2026-02-15 00:00:00', '/certificates/dentist3-cert2.pdf', '{dentist_id_3}', NOW(), NOW());

-- ============================================
-- INSERT CHUYÊN MÔN CỦA NHA SĨ (DENTIST_SPECIALIZATIONS)
-- Gắn mối quan hệ giữa nha sĩ và chuyên môn
-- ============================================

-- Nha sĩ 1 có chuyên môn: Chỉnh nha, Nha khoa thẩm mỹ
INSERT INTO dentist_specializations (id, dentist_id, specialization_id, created_at) VALUES
('770e8400-e29b-41d4-a716-446655440001', '{dentist_id_1}', '550e8400-e29b-41d4-a716-446655440001', NOW()),
('770e8400-e29b-41d4-a716-446655440002', '{dentist_id_1}', '550e8400-e29b-41d4-a716-446655440005', NOW());

-- Nha sĩ 2 có chuyên môn: Phục hình, Nha chu
INSERT INTO dentist_specializations (id, dentist_id, specialization_id, created_at) VALUES
('770e8400-e29b-41d4-a716-446655440003', '{dentist_id_2}', '550e8400-e29b-41d4-a716-446655440002', NOW()),
('770e8400-e29b-41d4-a716-446655440004', '{dentist_id_2}', '550e8400-e29b-41d4-a716-446655440003', NOW());

-- Nha sĩ 3 có chuyên môn: Bảo tồn nha, Nha khoa trẻ em
INSERT INTO dentist_specializations (id, dentist_id, specialization_id, created_at) VALUES
('770e8400-e29b-41d4-a716-446655440005', '{dentist_id_3}', '550e8400-e29b-41d4-a716-446655440008', NOW()),
('770e8400-e29b-41d4-a716-446655440006', '{dentist_id_3}', '550e8400-e29b-41d4-a716-446655440004', NOW());

-- ============================================
-- HƯỚNG DẪN SỬ DỤNG:
-- ============================================
-- 1. Lấy ID của các nha sĩ từ bảng dentists:
--    SELECT id FROM dentists LIMIT 3;
--
-- 2. Thay thế các placeholder sau bằng UUID thực tế:
--    - {dentist_id_1}: ID nha sĩ thứ 1
--    - {dentist_id_2}: ID nha sĩ thứ 2
--    - {dentist_id_3}: ID nha sĩ thứ 3
--
-- 3. Chạy file SQL này để insert dữ liệu

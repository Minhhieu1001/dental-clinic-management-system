-- Clean and enrich appointments & care records for realistic dental clinic CRM operations
BEGIN;

-- 1. Ensure all patients have clean data
UPDATE patients SET 
  customer_group = CASE 
    WHEN patient_code IN ('34352347 16', '34352347 22', '34352347 0', '12354', 'PAT-0001') THEN 'Khách VIP'
    WHEN patient_code IN ('34352347 11', '34352346 26', '20220715 77', '202207152 5', 'PAT-0002', 'PAT-0003') THEN 'Khách thân thiết'
    WHEN patient_code IN ('34352347 19', 'PA-002', 'PA-003') THEN 'Khách tiềm năng'
    ELSE 'Khách mới'
  END,
  customer_source = CASE 
    WHEN patient_code IN ('34352347 16', '34352347 17', '34352347 19') THEN 'Facebook'
    WHEN patient_code IN ('34352347 11', '34352346 26', '343523454 3') THEN 'Website'
    WHEN patient_code IN ('12354', '34352347 22', '34352347 0') THEN 'Người quen giới thiệu'
    WHEN patient_code IN ('20220715 77', '202207154 0', '34352347 14') THEN 'Hotline'
    WHEN patient_code IN ('343523463 6') THEN 'Tiktok'
    ELSE 'Trực tiếp'
  END;

-- 2. Make sure today (15/10) has birthdays
UPDATE patients SET date_of_birth = '1991-10-15 00:00:00' WHERE patient_code = 'PA-993153'; -- Nguyễn Tất Thành
UPDATE patients SET date_of_birth = '1992-10-15 00:00:00' WHERE patient_code = 'PA-245481'; -- Vũ Minh Quân
UPDATE patients SET date_of_birth = '1987-10-15 00:00:00' WHERE patient_code = '202207152 5'; -- Lê Thị Thu Hương

-- Upcoming birthdays in October
UPDATE patients SET date_of_birth = '1995-10-16 00:00:00' WHERE patient_code = 'PAT-0001'; -- Sinh nhật ngày mai (16/10)
UPDATE patients SET date_of_birth = '1990-10-17 00:00:00' WHERE patient_code = 'PAT-0002'; -- Sinh nhật 17/10
UPDATE patients SET date_of_birth = '1995-10-18 00:00:00' WHERE patient_code = '34352347 22'; -- Nguyễn Phương Linh (18/10)
UPDATE patients SET date_of_birth = '1999-10-20 00:00:00' WHERE patient_code = '343523463 6'; -- Nguyễn Linh Chi (20/10)
UPDATE patients SET date_of_birth = '1994-10-25 00:00:00' WHERE patient_code = '202207154 0'; -- Đỗ Duy Thắng (25/10)
UPDATE patients SET date_of_birth = '1995-10-26 00:00:00' WHERE patient_code = '12354'; -- Nguyen Tien Hiep (26/10)
UPDATE patients SET date_of_birth = '1990-10-27 00:00:00' WHERE patient_code = '343523454 3'; -- Nguyễn Văn An (27/10)
UPDATE patients SET date_of_birth = '1989-10-30 00:00:00' WHERE patient_code = '34352347 11'; -- Đỗ Minh Quang (30/10)

-- 3. Update dentists full_name if empty
UPDATE dentists SET full_name = 'BS. Lê Hoàng Long' WHERE id = '20000000-0000-0000-0000-000000000001' AND (full_name IS NULL OR full_name = '');
UPDATE dentists SET full_name = 'BS. Vũ Đình Trọng' WHERE id = '20000000-0000-0000-0000-000000000002' AND (full_name IS NULL OR full_name = '');
UPDATE dentists SET full_name = 'BS. Đỗ Mỹ Linh' WHERE id = '20000000-0000-0000-0000-000000000003' AND (full_name IS NULL OR full_name = '');
UPDATE dentists SET full_name = 'BS. Hoàng Gia Bảo' WHERE id = '20000000-0000-0000-0000-000000000004' AND (full_name IS NULL OR full_name = '');
UPDATE dentists SET full_name = 'BS. Phạm Khánh Huyền' WHERE id = '20000000-0000-0000-0000-000000000005' AND (full_name IS NULL OR full_name = '');

-- 4. Delete old customer care records referencing old IDs so we have clean, consistent data
DELETE FROM customer_care_records;

-- 5. Reposition appointments to surround October 15, 2026 (Today)
-- Let's define appointments with realistic times and services (reason):

-- Appointment 1: Hôm nay 15/10/2026 08:30 - Nguyễn Tất Thành (PA-993153)
UPDATE appointments SET 
  appointment_date = '2026-10-15 00:00:00',
  appointment_time = '2026-10-15 08:30:00',
  patient_id = (SELECT id FROM patients WHERE patient_code = 'PA-993153' LIMIT 1),
  dentist_id = 'b1c2d3e4-f5a6-7890-bcde-fa1234567811', -- BS Hoàng Văn Tiến
  reason = 'Lấy cao răng & Chăm sóc răng miệng định kỳ',
  status = 'CONFIRMED',
  patient_name = 'Nguyễn Tất Thành',
  phone = '0908112233'
WHERE id = '40000000-0000-0000-0000-000000000001';

-- Appointment 2: Hôm nay 15/10/2026 09:15 - Đào Phương Hòa (34352347 16)
UPDATE appointments SET 
  appointment_date = '2026-10-15 00:00:00',
  appointment_time = '2026-10-15 09:15:00',
  patient_id = (SELECT id FROM patients WHERE patient_code = '34352347 16' LIMIT 1),
  dentist_id = '5f170ddc-efee-4375-a467-007ea279ce6d', -- ThS. BS. Nguyễn Thị Phương
  reason = 'Tái khám chỉnh nha mắc cài sứ định kỳ tháng 10',
  status = 'CONFIRMED',
  patient_name = 'Đào Phương Hòa',
  phone = '0945123675'
WHERE id = '40000000-0000-0000-0000-000000000002';

-- Appointment 3: Hôm nay 15/10/2026 10:00 - Vũ Minh Quân (PA-245481)
UPDATE appointments SET 
  appointment_date = '2026-10-15 00:00:00',
  appointment_time = '2026-10-15 10:00:00',
  patient_id = (SELECT id FROM patients WHERE patient_code = 'PA-245481' LIMIT 1),
  dentist_id = 'b1c2d3e4-f5a6-7890-bcde-fa1234567804', -- BS. Trần Minh Đức
  reason = 'Trám răng sâu thẩm mỹ xoang I răng 26',
  status = 'CONFIRMED',
  patient_name = 'Vũ Minh Quân',
  phone = '0988777666'
WHERE id = '40000000-0000-0000-0000-000000000003';

-- Appointment 4: Hôm nay 15/10/2026 11:30 - Phan Hoài Nam (20220715 77)
UPDATE appointments SET 
  appointment_date = '2026-10-15 00:00:00',
  appointment_time = '2026-10-15 11:30:00',
  patient_id = (SELECT id FROM patients WHERE patient_code = '20220715 77' LIMIT 1),
  dentist_id = 'aba82188-0c5a-42f2-b013-19c129ead37f', -- BS. Nguyễn Tuấn Anh
  reason = 'Kiểm tra mão răng sứ thẩm mỹ sau 1 năm',
  status = 'CONFIRMED',
  patient_name = 'Phan Hoài Nam',
  phone = '0903112233'
WHERE id = '40000000-0000-0000-0000-000000000004';

-- Appointment 5: Hôm nay 15/10/2026 14:00 - Lê Thị Thu Hương (202207152 5)
UPDATE appointments SET 
  appointment_date = '2026-10-15 00:00:00',
  appointment_time = '2026-10-15 14:00:00',
  patient_id = (SELECT id FROM patients WHERE patient_code = '202207152 5' LIMIT 1),
  dentist_id = '2949223f-5667-4437-889f-b8c92593026e', -- BS. Lê Thị Mai
  reason = 'Nhổ răng khôn hàm dưới mọc lệch số 48',
  status = 'CONFIRMED',
  patient_name = 'Lê Thị Thu Hương',
  phone = '0901665050'
WHERE id = '40000000-0000-0000-0000-000000000005';

-- Appointment 6: Hôm nay 15/10/2026 15:30 - Trần Bích Thủy (PA-590893)
UPDATE appointments SET 
  appointment_date = '2026-10-15 00:00:00',
  appointment_time = '2026-10-15 15:30:00',
  patient_id = (SELECT id FROM patients WHERE patient_code = 'PA-590893' LIMIT 1),
  dentist_id = 'b1c2d3e4-f5a6-7890-bcde-fa1234567804', -- BS. Trần Minh Đức
  reason = 'Điều trị tủy răng số 36 lần 2 & trám tạm',
  status = 'CONFIRMED',
  patient_name = 'Trần Bích Thủy',
  phone = '0343638888'
WHERE id = 'b0000001-0000-0000-0000-000000000001';

-- Appointment 7: Hôm nay 15/10/2026 16:30 - Nguyễn Phương Linh (34352347 22)
UPDATE appointments SET 
  appointment_date = '2026-10-15 00:00:00',
  appointment_time = '2026-10-15 16:30:00',
  patient_id = (SELECT id FROM patients WHERE patient_code = '34352347 22' LIMIT 1),
  dentist_id = 'b1c2d3e4-f5a6-7890-bcde-fa1234567805', -- BS. Phạm Thị Lan
  reason = 'Tẩy trắng răng công nghệ Laser Zoom Whitening',
  status = 'CONFIRMED',
  patient_name = 'Nguyễn Phương Linh',
  phone = '0913765876'
WHERE id = 'b0000001-0000-0000-0000-000000000002';

-- Appointment 8: Hôm nay 15/10/2026 17:30 - Đỗ Minh Quang (34352347 11)
UPDATE appointments SET 
  appointment_date = '2026-10-15 00:00:00',
  appointment_time = '2026-10-15 17:30:00',
  patient_id = (SELECT id FROM patients WHERE patient_code = '34352347 11' LIMIT 1),
  dentist_id = '5f170ddc-efee-4375-a467-007ea279ce6d', -- ThS. BS. Nguyễn Thị Phương
  reason = 'Khám & Lập kế hoạch niềng răng trong suốt Invisalign',
  status = 'CONFIRMED',
  patient_name = 'Đỗ Minh Quang',
  phone = '0915103089'
WHERE id = 'b0000001-0000-0000-0000-000000000003';

-- Appointment 9: Ngày mai 16/10/2026 08:30 - Trần Mỹ Duyên (34352345 58)
UPDATE appointments SET 
  appointment_date = '2026-10-16 00:00:00',
  appointment_time = '2026-10-16 08:30:00',
  patient_id = (SELECT id FROM patients WHERE patient_code = '34352345 58' LIMIT 1),
  dentist_id = 'b1c2d3e4-f5a6-7890-bcde-fa1234567811', -- BS Hoàng Văn Tiến
  reason = 'Lấy cao răng & Điều trị viêm nướu nhẹ',
  status = 'CONFIRMED',
  patient_name = 'Trần Mỹ Duyên',
  phone = '0968415284'
WHERE id = 'b0000001-0000-0000-0000-000000000004';

-- Appointment 10: Ngày mai 16/10/2026 09:15 - Nguyễn Văn An (343523454 3)
UPDATE appointments SET 
  appointment_date = '2026-10-16 00:00:00',
  appointment_time = '2026-10-16 09:15:00',
  patient_id = (SELECT id FROM patients WHERE patient_code = '343523454 3' LIMIT 1),
  dentist_id = '2949223f-5667-4437-889f-b8c92593026e', -- BS. Lê Thị Mai
  reason = 'Cắt chỉ sau phẫu thuật nhổ răng khôn & Kiểm tra lành thương',
  status = 'CONFIRMED',
  patient_name = 'Nguyễn Văn An',
  phone = '0949473689'
WHERE id = 'c4bbf316-57c2-4f30-ae4c-8f2e067559ef';

-- Appointment 11: Ngày mai 16/10/2026 10:00 - Hoàng Tuấn Anh (34352347 0)
UPDATE appointments SET 
  appointment_date = '2026-10-16 00:00:00',
  appointment_time = '2026-10-16 10:00:00',
  patient_id = (SELECT id FROM patients WHERE patient_code = '34352347 0' LIMIT 1),
  dentist_id = '2949223f-5667-4437-889f-b8c92593026e', -- BS. Lê Thị Mai
  reason = 'Khám tư vấn và chụp phim CT Cone Beam cấy ghép Implant Straumann',
  status = 'CONFIRMED',
  patient_name = 'Hoàng Tuấn Anh',
  phone = '0987112233'
WHERE id = '2e42b876-c849-478b-aec5-f7786ac00e9e';

-- Appointment 12: Ngày mai 16/10/2026 11:00 - Nguyễn Linh Chi (343523463 6)
UPDATE appointments SET 
  appointment_date = '2026-10-16 00:00:00',
  appointment_time = '2026-10-16 11:00:00',
  patient_id = (SELECT id FROM patients WHERE patient_code = '343523463 6' LIMIT 1),
  dentist_id = '5f170ddc-efee-4375-a467-007ea279ce6d', -- ThS. BS. Nguyễn Thị Phương
  reason = 'Giao khay niềng răng trong suốt Invisalign đợt 3',
  status = 'CONFIRMED',
  patient_name = 'Nguyễn Linh Chi',
  phone = '0123456789'
WHERE id = 'bd141b7c-1282-4ca8-945a-22bca8a50940';

-- Appointment 13: Ngày mai 16/10/2026 14:00 - Lê Bá Hùng (34352346 26)
UPDATE appointments SET 
  appointment_date = '2026-10-16 00:00:00',
  appointment_time = '2026-10-16 14:00:00',
  patient_id = (SELECT id FROM patients WHERE patient_code = '34352346 26' LIMIT 1),
  dentist_id = 'b1c2d3e4-f5a6-7890-bcde-fa1234567804', -- BS. Trần Minh Đức
  reason = 'Trám răng composite thẩm mỹ kẽ răng cửa 11 - 21',
  status = 'CONFIRMED',
  patient_name = 'Lê Bá Hùng',
  phone = '0937317217'
WHERE id = '063dc54e-bd47-489f-8895-7a117e7ecd97';

-- Appointment 14: Ngày mai 16/10/2026 15:00 - Trịnh Tuấn Kiệt (PA-430905)
UPDATE appointments SET 
  appointment_date = '2026-10-16 00:00:00',
  appointment_time = '2026-10-16 15:00:00',
  patient_id = (SELECT id FROM patients WHERE patient_code = 'PA-430905' LIMIT 1),
  dentist_id = 'b1c2d3e4-f5a6-7890-bcde-fa1234567811', -- BS Hoàng Văn Tiến
  reason = 'Tái khám điều trị viêm quanh chân răng & Bơm rửa túi lợi',
  status = 'CONFIRMED',
  patient_name = 'Trịnh Tuấn Kiệt',
  phone = '0912345678'
WHERE id = '01db3472-5097-450e-9db8-da4cf164ced0';

-- Appointment 15: Ngày mai 16/10/2026 16:00 - Nguyễn Thị Việt (34352347 14)
UPDATE appointments SET 
  appointment_date = '2026-10-16 00:00:00',
  appointment_time = '2026-10-16 16:00:00',
  patient_id = (SELECT id FROM patients WHERE patient_code = '34352347 14' LIMIT 1),
  dentist_id = 'b1c2d3e4-f5a6-7890-bcde-fa1234567805', -- BS. Phạm Thị Lan
  reason = 'Tẩy trắng răng tại phòng khám công nghệ Zoom WhiteSpeed',
  status = 'CONFIRMED',
  patient_name = 'Nguyễn Thị Việt',
  phone = '0336789012'
WHERE id = 'ef962b41-203e-466f-968a-e69284d8ff81';

-- Update remaining appointments to dates in October 2026 (17/10 to 25/10) with realistic reasons
UPDATE appointments SET 
  appointment_date = '2026-10-17 00:00:00',
  appointment_time = '2026-10-17 09:00:00',
  reason = 'Lắp mão răng toàn sứ Lava Plus phục hình răng 16',
  dentist_id = 'aba82188-0c5a-42f2-b013-19c129ead37f'
WHERE appointment_time < '2026-10-15 00:00:00' AND id IN (SELECT id FROM appointments LIMIT 5);

UPDATE appointments SET 
  appointment_date = '2026-10-18 00:00:00',
  appointment_time = '2026-10-18 10:30:00',
  reason = 'Khám răng trẻ em & Trám bít hố rãnh ngừa sâu răng',
  dentist_id = 'b1c2d3e4-f5a6-7890-bcde-fa1234567804'
WHERE appointment_time < '2026-10-15 00:00:00' AND id IN (SELECT id FROM appointments LIMIT 5);

UPDATE appointments SET 
  appointment_date = '2026-10-19 00:00:00',
  appointment_time = '2026-10-19 14:30:00',
  reason = 'Khám định kỳ & Đánh giá khớp cắn sau chỉnh nha',
  dentist_id = '5f170ddc-efee-4375-a467-007ea279ce6d'
WHERE appointment_time < '2026-10-15 00:00:00' AND id IN (SELECT id FROM appointments LIMIT 5);

UPDATE appointments SET 
  appointment_date = '2026-10-20 00:00:00',
  appointment_time = '2026-10-20 15:00:00',
  reason = 'Tái khám sau phẫu thuật cấy ghép Implant',
  dentist_id = '2949223f-5667-4437-889f-b8c92593026e'
WHERE appointment_time < '2026-10-15 00:00:00';

-- Sync all patient_name and phone in appointments from patients table
UPDATE appointments a
SET 
  patient_name = p.full_name,
  phone = p.phone_number
FROM patients p
WHERE a.patient_id = p.id;

-- 6. Insert realistic customer_care_records
-- Employee ID for employee02: 30000000-0000-0000-0000-000000000002
INSERT INTO customer_care_records (
  id, appointment_id, patient_id, employee_id, care_type, channel, status, care_time, notes, created_at, updated_at
) VALUES
-- Hôm nay: Nhắc lịch hẹn cho các bệnh nhân sáng nay
(
  gen_random_uuid(),
  '40000000-0000-0000-0000-000000000001',
  (SELECT id FROM patients WHERE patient_code = 'PA-993153' LIMIT 1),
  '30000000-0000-0000-0000-000000000002',
  'APPOINTMENT_REMINDER',
  'PHONE',
  'COMPLETED',
  '2026-10-15 07:45:00',
  'Đã gọi điện nhắc khách lịch lấy cao răng sáng nay lúc 8h30. Khách xác nhận sẽ đến đúng giờ.',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '40000000-0000-0000-0000-000000000002',
  (SELECT id FROM patients WHERE patient_code = '34352347 16' LIMIT 1),
  '30000000-0000-0000-0000-000000000002',
  'APPOINTMENT_REMINDER',
  'PHONE',
  'COMPLETED',
  '2026-10-15 08:00:00',
  'Đã gọi điện nhắc bệnh nhân tái khám chỉnh nha lúc 9h15 cùng ThS. BS. Nguyễn Thị Phương. Khách xác nhận đến.',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '40000000-0000-0000-0000-000000000003',
  (SELECT id FROM patients WHERE patient_code = 'PA-245481' LIMIT 1),
  '30000000-0000-0000-0000-000000000002',
  'APPOINTMENT_REMINDER',
  'PHONE',
  'COMPLETED',
  '2026-10-15 08:15:00',
  'Đã gọi nhắc khách lịch trám răng lúc 10h00. Khách báo có thể trễ 10 phút, phòng khám đã lưu ý bác sĩ Đức.',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  '40000000-0000-0000-0000-000000000004',
  (SELECT id FROM patients WHERE patient_code = '20220715 77' LIMIT 1),
  '30000000-0000-0000-0000-000000000002',
  'APPOINTMENT_REMINDER',
  'PHONE',
  'RECARE',
  '2026-10-15 08:20:00',
  'Khách đang bận họp không nghe máy, gửi tin nhắn Zalo nhắc lịch khám mão sứ lúc 11h30 và hẹn gọi lại sau 10h30.',
  NOW(), NOW()
),
-- Ngày mai: Đã nhắc trước một số khách
(
  gen_random_uuid(),
  'ef962b41-203e-466f-968a-e69284d8ff81',
  (SELECT id FROM patients WHERE patient_code = '34352347 14' LIMIT 1),
  '30000000-0000-0000-0000-000000000002',
  'APPOINTMENT_REMINDER',
  'SMS',
  'COMPLETED',
  '2026-10-15 08:05:00',
  'Đã gửi SMS Brandname nhắc lịch tẩy trắng răng chiều mai lúc 16h00. Khách đã nhắn phản hồi OK.',
  NOW(), NOW()
),
-- Chăm sóc sinh nhật hôm nay (15/10)
(
  gen_random_uuid(),
  NULL,
  (SELECT id FROM patients WHERE patient_code = 'PA-993153' LIMIT 1),
  '30000000-0000-0000-0000-000000000002',
  'BIRTHDAY',
  'PHONE',
  'COMPLETED',
  '2026-10-15 08:10:00',
  'Gọi điện chúc mừng sinh nhật khách hàng Nguyễn Tất Thành, tặng voucher ưu đãi 20% dịch vụ và quà tặng lưu niệm Crown Dental.',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  NULL,
  (SELECT id FROM patients WHERE patient_code = '34352347 11' LIMIT 1),
  '30000000-0000-0000-0000-000000000002',
  'BIRTHDAY',
  'SMS',
  'COMPLETED',
  '2026-10-14 16:27:00',
  'Gửi tin nhắn SMS chúc mừng sinh nhật khách hàng và gửi mã voucher giảm 15% cho người thân.',
  NOW(), NOW()
),
-- Chăm sóc tổng hợp
(
  gen_random_uuid(),
  NULL,
  (SELECT id FROM patients WHERE patient_code = 'PA-590893' LIMIT 1),
  '30000000-0000-0000-0000-000000000002',
  'GENERAL_CARE',
  'PHONE',
  'COMPLETED',
  '2026-10-14 21:45:00',
  'Gọi điện thăm hỏi tình trạng sức khỏe răng miệng sau khi lấy cao răng. Bệnh nhân phản hồi rất hài lòng, không còn ê buốt.',
  NOW(), NOW()
),
(
  gen_random_uuid(),
  NULL,
  (SELECT id FROM patients WHERE patient_code = 'PAT-0001' LIMIT 1),
  '30000000-0000-0000-0000-000000000002',
  'GENERAL_CARE',
  'PHONE',
  'COMPLETED',
  '2026-10-14 15:30:00',
  'Gọi điện tư vấn thêm về gói bảo hành niềng răng trong suốt và chính sách thanh toán trả góp không lãi suất.',
  NOW(), NOW()
);

COMMIT;

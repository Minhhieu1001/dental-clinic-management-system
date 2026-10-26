-- Clean up duplicate appointments of PA-839092 and add real care records

-- 1. Reassign 4 duplicates to patients who have no appointments
UPDATE appointments 
SET patient_id = 'a0000001-0000-0000-0000-000000000017', 
    patient_name = 'Nguyễn Trọng Trường', 
    phone = '0879156256', 
    appointment_time = '2026-10-22 09:00:00',
    reason = 'Điều trị tủy răng số 36',
    attribute = 'Đặt trước'
WHERE id = '49597d4b-39c1-480c-ba33-013ac48af79a';

UPDATE appointments 
SET patient_id = 'a0000001-0000-0000-0000-000000000014', 
    patient_name = 'Phạm Thị Thanh Thanh', 
    phone = '0908765432', 
    appointment_time = '2026-10-21 14:15:00',
    reason = 'Tư vấn niềng răng trong suốt',
    attribute = 'Dự kiến'
WHERE id = 'f9950ec4-610b-4e04-aa1a-486ec85fbf92';

UPDATE appointments 
SET patient_id = 'a0000001-0000-0000-0000-000000000013', 
    patient_name = 'Đỗ Duy Thắng', 
    phone = '0964979228', 
    appointment_time = '2026-10-24 10:30:00',
    reason = 'Cạo vôi răng & Đánh bóng',
    attribute = 'Đặt trước'
WHERE id = 'a3e3f411-b040-4515-8607-8c7009004ca1';

UPDATE appointments 
SET patient_id = 'a0000001-0000-0000-0000-000000000012', 
    patient_name = 'Nguyen Tien Hiep', 
    phone = '0918887766', 
    appointment_time = '2026-10-26 15:30:00',
    reason = 'Khám răng trẻ em định kỳ',
    attribute = 'Đặt trước'
WHERE id = '57cd4660-19a5-4089-af3b-5b2c656f5cc0';

-- 2. Remove remaining identical duplicate test rows for PA-839092
DELETE FROM appointments 
WHERE patient_id = (SELECT id FROM patients WHERE patient_code = 'PA-839092')
  AND id IN (
      '088c1e27-c2fa-4fd6-9895-10771f2ed002',
      'e95fb2fd-b069-4b33-be45-89d126dad98c',
      'f58d6474-e25c-4e39-92a3-14017c1ad9e7',
      '34714866-a063-499b-8029-b96b90a1734b'
  );

-- 3. Standardize the attribute on the remaining appointments of PA-839092
UPDATE appointments 
SET attribute = 'Đặt trước' 
WHERE patient_id = (SELECT id FROM patients WHERE patient_code = 'PA-839092')
  AND (attribute IS NULL OR attribute = '' OR attribute LIKE '%-%');

-- 4. Add Customer Care records for PA-839092
INSERT INTO customer_care_records (
    id, patient_id, appointment_id, care_type, channel, status, 
    care_time, notes, created_by_name, created_at, updated_at
) VALUES 
(
    'd0000003-0000-0000-0000-000000000001',
    (SELECT id FROM patients WHERE patient_code = 'PA-839092'),
    'eea56afb-0723-4c40-abd9-e784160c518e',
    'APPOINTMENT_REMINDER',
    'PHONE',
    'COMPLETED',
    '2026-10-14 09:30:00',
    'Đã gọi điện hỏi thăm tình trạng sau điều trị tủy đợt 2. Bệnh nhân phản hồi răng ăn nhai êm, không còn ê buốt. Nhắc lịch tái khám ngày 15/10.',
    'Nguyệt Nguyễn',
    '2026-10-14 09:30:00',
    '2026-10-14 09:30:00'
),
(
    'd0000003-0000-0000-0000-000000000002',
    (SELECT id FROM patients WHERE patient_code = 'PA-839092'),
    NULL,
    'APPOINTMENT_REMINDER',
    'ZALO_SMS',
    'COMPLETED',
    '2026-10-07 16:00:00',
    'Hệ thống tự động gửi tin nhắn Zalo nhắc lịch tái khám kiểm tra định kỳ lúc 03:02 ngày 08/10/2026.',
    'Hệ thống tự động',
    '2026-10-07 16:00:00',
    '2026-10-07 16:00:00'
)
ON CONFLICT (id) DO UPDATE SET notes = EXCLUDED.notes;

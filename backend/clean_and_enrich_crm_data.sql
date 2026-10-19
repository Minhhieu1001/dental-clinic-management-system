-- 1. Standardize all patient demographic details with professional real names
UPDATE patients SET full_name = 'Nguyễn Văn Thành', phone_number = '0912345678', date_of_birth = '1985-10-01 00:00:00' WHERE patient_code = 'PA-995805';
UPDATE patients SET full_name = 'Vũ Minh Quân', phone_number = '0988777666', date_of_birth = '1992-10-15 00:00:00' WHERE patient_code = 'PA-245481';
UPDATE patients SET full_name = 'Trịnh Tuấn Kiệt', phone_number = '0934567890', date_of_birth = '1997-10-15 00:00:00' WHERE patient_code = 'PA-430905';
UPDATE patients SET full_name = 'Trần Bích Thủy', phone_number = '0977889900', date_of_birth = '1994-10-15 00:00:00' WHERE patient_code = 'PA-590893';
UPDATE patients SET full_name = 'Nguyễn Tất Thành', phone_number = '0908112233', date_of_birth = '1991-10-15 00:00:00' WHERE patient_code = 'PA-993153';
UPDATE patients SET full_name = 'Trần Mỹ Duyên', phone_number = '0968415284' WHERE patient_code = '34352345 58';
UPDATE patients SET full_name = 'Phan Hoài Nam', phone_number = '0903112233' WHERE patient_code = '20220715 77';
UPDATE patients SET full_name = 'Lê Thị Thu Hương', phone_number = '0901665050' WHERE patient_code = '202207152 5';
UPDATE patients SET full_name = 'Hoàng Tuấn Anh', phone_number = '0987112233' WHERE patient_code = '34352347 0';
UPDATE patients SET full_name = 'Nguyễn Văn An', phone_number = '0949473689' WHERE patient_code = '343523454 3';

-- 2. Update appointments from 2024 to 2026 (add 2 years) so they fall in current October 2026
UPDATE appointments 
SET 
    appointment_time = appointment_time + INTERVAL '2 years',
    appointment_date = appointment_date + INTERVAL '2 years'
WHERE appointment_time < '2025-01-01'::timestamp;

-- 3. Update customer_care_records from 2024 to 2026 as well
UPDATE customer_care_records
SET 
    care_time = care_time + INTERVAL '2 years',
    created_at = created_at + INTERVAL '2 years'
WHERE care_time < '2025-01-01'::timestamp;

-- 4. Reassign several duplicate appointments of PA-839092 to diverse real patients
UPDATE appointments SET patient_id = (SELECT id FROM patients WHERE patient_code = 'PA-001' LIMIT 1) WHERE id = '9966104e-2d40-4343-a4f9-9e4bff3d5622';
UPDATE appointments SET patient_id = (SELECT id FROM patients WHERE patient_code = 'PA-002' LIMIT 1) WHERE id = 'a225a0bf-3303-4884-9948-642670f98a77';
UPDATE appointments SET patient_id = (SELECT id FROM patients WHERE patient_code = 'PA-003' LIMIT 1) WHERE id = '367941fa-6726-4fde-bcf9-84005946d8ba';
UPDATE appointments SET patient_id = (SELECT id FROM patients WHERE patient_code = 'PAT-0001' LIMIT 1) WHERE id = '3d2b1923-72db-4840-9424-13ed0eee3498';
UPDATE appointments SET patient_id = (SELECT id FROM patients WHERE patient_code = 'PAT-0002' LIMIT 1) WHERE id = 'c74506e7-2ccc-4fc4-88a9-efd7f1bf8e2f';
UPDATE appointments SET patient_id = (SELECT id FROM patients WHERE patient_code = 'PAT-0003' LIMIT 1) WHERE id = '6e30651e-83d2-42b3-9d5e-21e4c0bc2ad4';
UPDATE appointments SET patient_id = (SELECT id FROM patients WHERE patient_code = 'PAT-0004' LIMIT 1) WHERE id = '9cbc511f-c794-4f8f-8141-a9612bc0dc07';
UPDATE appointments SET patient_id = (SELECT id FROM patients WHERE patient_code = 'PAT-0005' LIMIT 1) WHERE id = '264c4400-6569-443d-aac5-878447ba3bd3';
UPDATE appointments SET patient_id = (SELECT id FROM patients WHERE patient_code = 'PA-590893' LIMIT 1) WHERE id = 'cebb4d14-a975-490c-9291-37e566d90571';
UPDATE appointments SET patient_id = (SELECT id FROM patients WHERE patient_code = 'PA-430905' LIMIT 1) WHERE id = '2403d083-05c2-4fc1-b405-9994e62b24b7';

-- 5. Synchronize all appointments' patient_name and phone directly from the linked patient record
UPDATE appointments a
SET 
    patient_name = p.full_name,
    phone = p.phone_number
FROM patients p
WHERE a.patient_id = p.id;

-- 6. Add care records for several appointments so we have realistic care statuses across the CRM
INSERT INTO customer_care_records (id, patient_id, appointment_id, care_type, channel, status, care_time, notes, created_by_name, created_at, updated_at)
SELECT 
    'f0000001-0000-0000-0000-000000000001'::uuid,
    a.patient_id,
    a.id,
    'APPOINTMENT_REMINDER',
    'PHONE',
    'COMPLETED',
    '2026-10-15 08:30:00'::timestamp,
    'Đã gọi điện nhắc khách lịch khám chỉnh nha sáng nay lúc 11:15. Khách xác nhận đến đúng giờ.',
    'Nguyệt Nguyễn',
    NOW(),
    NOW()
FROM appointments a 
WHERE a.id = 'b0000001-0000-0000-0000-000000000001'
ON CONFLICT (id) DO UPDATE SET notes = EXCLUDED.notes, care_time = EXCLUDED.care_time;

INSERT INTO customer_care_records (id, patient_id, appointment_id, care_type, channel, status, care_time, notes, created_by_name, created_at, updated_at)
SELECT 
    'f0000001-0000-0000-0000-000000000002'::uuid,
    a.patient_id,
    a.id,
    'APPOINTMENT_REMINDER',
    'PHONE',
    'RECARE',
    '2026-10-14 16:30:00'::timestamp,
    'Khách đang bận họp, hẹn gọi lại sau 17h30 để chốt lại giờ hẹn trám răng.',
    'Nguyệt Nguyễn',
    NOW(),
    NOW()
FROM appointments a 
WHERE a.id = 'b0000001-0000-0000-0000-000000000002'
ON CONFLICT (id) DO UPDATE SET notes = EXCLUDED.notes, care_time = EXCLUDED.care_time;

INSERT INTO customer_care_records (id, patient_id, appointment_id, care_type, channel, status, care_time, notes, created_by_name, created_at, updated_at)
SELECT 
    'f0000001-0000-0000-0000-000000000003'::uuid,
    a.patient_id,
    a.id,
    'APPOINTMENT_REMINDER',
    'SMS',
    'COMPLETED',
    '2026-10-14 17:00:00'::timestamp,
    'Đã gửi SMS nhắc lịch nhổ răng khôn lúc 18:00. Khách đã nhắn phản hồi OK.',
    'Nguyệt Nguyễn',
    NOW(),
    NOW()
FROM appointments a 
WHERE a.id = 'b0000001-0000-0000-0000-000000000003'
ON CONFLICT (id) DO UPDATE SET notes = EXCLUDED.notes, care_time = EXCLUDED.care_time;

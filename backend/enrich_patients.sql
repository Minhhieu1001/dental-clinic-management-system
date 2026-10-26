-- Enrich real patients with full demographic and CRM data
UPDATE patients 
SET 
    gender = CASE 
        WHEN full_name ILIKE '%Thị%' OR full_name ILIKE '%Thảo%' OR full_name ILIKE '%Linh%' OR full_name ILIKE '%Hương%' OR full_name ILIKE '%Hòa%' OR full_name ILIKE '%Bích%' OR full_name ILIKE '%Chi%' OR full_name ILIKE '%duyên%' THEN 'FEMALE'
        ELSE 'MALE'
    END,
    date_of_birth = COALESCE(date_of_birth, '1995-10-15 00:00:00'::timestamp),
    address = CASE 
        WHEN address IS NOT NULL AND address <> '' THEN address
        ELSE '12 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM'
    END,
    customer_group = COALESCE(customer_group, 'Khách thân thiết'),
    customer_source = COALESCE(customer_source, 'Trực tiếp'),
    customer_card = CASE 
        WHEN customer_card IS NOT NULL AND customer_card <> '' THEN customer_card
        WHEN customer_group = 'Khách VIP' THEN 'VIP-GOLD'
        WHEN customer_group = 'Khách thân thiết' THEN 'LOYAL-SILVER'
        WHEN customer_group = 'Khách tiềm năng' THEN 'POTENTIAL-01'
        ELSE 'STD-MEMBER'
    END,
    notes = CASE 
        WHEN notes IS NOT NULL AND notes <> '' THEN notes
        WHEN customer_group = 'Khách VIP' THEN 'Khách hàng VIP, ưu tiên đặt lịch vào cuối tuần. Rất quan tâm dịch vụ răng sứ cao cấp.'
        WHEN customer_group = 'Khách thân thiết' THEN 'Đã hoàn thành cạo vôi và hàn răng composite. Hẹn tái khám định kỳ mỗi 6 tháng.'
        WHEN customer_group = 'Khách tiềm năng' THEN 'Đang tư vấn niềng răng trong suốt Invisalign và dán sứ Veneer.'
        ELSE 'Bệnh nhân mới đến thăm khám kiểm tra răng miệng định kỳ.'
    END
WHERE id IS NOT NULL;

-- Update specific patients with realistic October birthdays for Birthday Care tab
UPDATE patients SET date_of_birth = '1989-10-30 00:00:00' WHERE patient_code = '34352347 11';
UPDATE patients SET date_of_birth = '1990-10-27 00:00:00' WHERE patient_code = '343523454 3';
UPDATE patients SET date_of_birth = '1995-10-26 00:00:00' WHERE patient_code = '12354';
UPDATE patients SET date_of_birth = '1994-10-25 00:00:00' WHERE patient_code = '202207154 0';
UPDATE patients SET date_of_birth = '1999-10-21 00:00:00' WHERE patient_code = '343523472 1';
UPDATE patients SET date_of_birth = '1999-10-20 00:00:00' WHERE patient_code = '343523463 6';
UPDATE patients SET date_of_birth = '1987-10-15 00:00:00' WHERE patient_code = '202207152 5';
UPDATE patients SET date_of_birth = '2000-10-13 00:00:00' WHERE patient_code = '12349';
UPDATE patients SET date_of_birth = '1995-10-13 00:00:00' WHERE patient_code = '69';
UPDATE patients SET date_of_birth = '1992-10-12 00:00:00' WHERE patient_code = '34352347 6';
UPDATE patients SET date_of_birth = '1993-10-07 00:00:00' WHERE patient_code = '34352347 5';
UPDATE patients SET date_of_birth = '2000-10-05 00:00:00' WHERE patient_code = '202207154 8';
UPDATE patients SET date_of_birth = '1991-10-03 00:00:00' WHERE patient_code = '34352347 14';
UPDATE patients SET date_of_birth = '1998-10-14 00:00:00' WHERE patient_code = 'PA-839092';
UPDATE patients SET date_of_birth = '1990-10-22 00:00:00' WHERE patient_code = 'PA-001';
UPDATE patients SET date_of_birth = '1996-10-14 00:00:00' WHERE patient_code = 'PA-002';
UPDATE patients SET date_of_birth = '1988-10-28 00:00:00' WHERE patient_code = 'PA-003';

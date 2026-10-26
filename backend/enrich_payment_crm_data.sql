-- 1. Ensure invoice_id exists in customer_care_records
ALTER TABLE customer_care_records ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;

-- 2. Update check constraint to include 'PAYMENT'
ALTER TABLE customer_care_records DROP CONSTRAINT IF EXISTS customer_care_records_care_type_check;
ALTER TABLE customer_care_records ADD CONSTRAINT customer_care_records_care_type_check 
    CHECK (care_type::text = ANY (ARRAY[
        'APPOINTMENT_REMINDER'::character varying, 
        'MEDICATION_REMINDER'::character varying, 
        'POST_TREATMENT'::character varying, 
        'BIRTHDAY'::character varying, 
        'GENERAL_CARE'::character varying, 
        'PAYMENT'::character varying
    ]::text[]));

-- 3. Update employees full_name
UPDATE employees SET full_name = 'Nguyệt Nguyễn' WHERE id = '30000000-0000-0000-0000-000000000001';
UPDATE employees SET full_name = 'Lê Thu Trang' WHERE id = '30000000-0000-0000-0000-000000000002';
UPDATE employees SET full_name = 'Phạm Minh Châu' WHERE id = '30000000-0000-0000-0000-000000000003';
UPDATE employees SET full_name = 'Nguyễn Thị Hương' WHERE id = '30000000-0000-0000-0000-000000000004';
UPDATE employees SET full_name = 'Trần Bảo Ngọc' WHERE id = '30000000-0000-0000-0000-000000000005';

-- 4. Enrich existing 5 invoices
UPDATE invoices SET 
    invoice_code = 'HD-2026-0001',
    paid_amount = 900000.00,
    remaining_amount = 0.00,
    payment_status = 'PAID',
    employee_id = '30000000-0000-0000-0000-000000000001'
WHERE id = '90000000-0000-0000-0000-000000000001';

UPDATE invoices SET 
    invoice_code = 'HD-2026-0002',
    paid_amount = 250000.00,
    remaining_amount = 250000.00,
    payment_status = 'PARTIALLY_PAID',
    employee_id = '30000000-0000-0000-0000-000000000001'
WHERE id = '90000000-0000-0000-0000-000000000002';

UPDATE invoices SET 
    invoice_code = 'HD-2026-0003',
    paid_amount = 201500.00,
    remaining_amount = 0.00,
    payment_status = 'PAID',
    employee_id = '30000000-0000-0000-0000-000000000001'
WHERE id = '90000000-0000-0000-0000-000000000003';

UPDATE invoices SET 
    invoice_code = 'HD-2026-0004',
    paid_amount = 0.00,
    remaining_amount = 2545000.00,
    payment_status = 'UNPAID',
    employee_id = '30000000-0000-0000-0000-000000000001'
WHERE id = '90000000-0000-0000-0000-000000000004';

UPDATE invoices SET 
    invoice_code = 'HD-2026-0005',
    paid_amount = 1000000.00,
    remaining_amount = 702500.00,
    payment_status = 'PARTIALLY_PAID',
    employee_id = '30000000-0000-0000-0000-000000000001'
WHERE id = '90000000-0000-0000-0000-000000000005';

-- 5. Insert additional realistic invoices for active patients
INSERT INTO invoices (id, patient_id, employee_id, invoice_code, invoice_date, total_amount, discount_amount, final_amount, paid_amount, remaining_amount, payment_status, is_save)
VALUES
    ('90000000-0000-0000-0000-000000000006'::uuid, 'a0000001-0000-0000-0000-000000000002'::uuid, '30000000-0000-0000-0000-000000000001'::uuid, 'HD-2026-0006', '2026-10-12 09:30:00'::timestamp, 4500000.00, 0.00, 4500000.00, 4500000.00, 0.00, 'PAID', true),
    ('90000000-0000-0000-0000-000000000007'::uuid, 'a0000001-0000-0000-0000-000000000003'::uuid, '30000000-0000-0000-0000-000000000001'::uuid, 'HD-2026-0007', '2026-10-14 14:15:00'::timestamp, 12000000.00, 500000.00, 11500000.00, 6000000.00, 5500000.00, 'PARTIALLY_PAID', true),
    ('90000000-0000-0000-0000-000000000008'::uuid, 'a0000001-0000-0000-0000-000000000004'::uuid, '30000000-0000-0000-0000-000000000001'::uuid, 'HD-2026-0008', '2026-10-15 11:00:00'::timestamp, 1800000.00, 0.00, 1800000.00, 0.00, 1800000.00, 'UNPAID', true),
    ('90000000-0000-0000-0000-000000000009'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, '30000000-0000-0000-0000-000000000001'::uuid, 'HD-2026-0009', '2026-10-16 16:45:00'::timestamp, 8500000.00, 500000.00, 8000000.00, 8000000.00, 0.00, 'PAID', true),
    ('90000000-0000-0000-0000-000000000010'::uuid, 'a0000001-0000-0000-0000-000000000018'::uuid, '30000000-0000-0000-0000-000000000001'::uuid, 'HD-2026-0010', '2026-10-17 10:20:00'::timestamp, 3200000.00, 200000.00, 3000000.00, 1500000.00, 1500000.00, 'PARTIALLY_PAID', true),
    ('90000000-0000-0000-0000-000000000011'::uuid, 'a0000001-0000-0000-0000-000000000008'::uuid, '30000000-0000-0000-0000-000000000001'::uuid, 'HD-2026-0011', '2026-10-18 15:30:00'::timestamp, 850000.00, 0.00, 850000.00, 850000.00, 0.00, 'PAID', true),
    ('90000000-0000-0000-0000-000000000012'::uuid, 'a0000001-0000-0000-0000-000000000005'::uuid, '30000000-0000-0000-0000-000000000001'::uuid, 'HD-2026-0012', '2026-10-19 08:45:00'::timestamp, 5000000.00, 0.00, 5000000.00, 0.00, 5000000.00, 'UNPAID', true)
ON CONFLICT (id) DO UPDATE SET
    invoice_code = EXCLUDED.invoice_code,
    invoice_date = EXCLUDED.invoice_date,
    total_amount = EXCLUDED.total_amount,
    discount_amount = EXCLUDED.discount_amount,
    final_amount = EXCLUDED.final_amount,
    paid_amount = EXCLUDED.paid_amount,
    remaining_amount = EXCLUDED.remaining_amount,
    payment_status = EXCLUDED.payment_status;

-- 6. Insert initial care records for payment CRM
INSERT INTO customer_care_records (id, patient_id, invoice_id, care_type, channel, status, care_time, notes, created_by_name, created_at, updated_at)
VALUES
    ('c0000001-0000-0000-0000-000000000001'::uuid, 'a0000001-0000-0000-0000-000000000002'::uuid, '90000000-0000-0000-0000-000000000006'::uuid, 'PAYMENT', 'GMAIL', 'COMPLETED', '2026-10-12 10:00:00'::timestamp, 'Đã gửi thư cảm ơn Quý khách Đỗ Minh Quang đã hoàn tất thanh toán hóa đơn HD-2026-0006 (4.500.000 VNĐ). Khách rất hài lòng với dịch vụ.', 'Nguyệt Nguyễn', NOW(), NOW()),
    ('c0000001-0000-0000-0000-000000000002'::uuid, 'a0000001-0000-0000-0000-000000000003'::uuid, '90000000-0000-0000-0000-000000000007'::uuid, 'PAYMENT', 'PHONE', 'RECARE', '2026-10-14 16:30:00'::timestamp, 'Đã gọi điện nhắc số tiền còn nợ 5.500.000 VNĐ cho hóa đơn HD-2026-0007. Chị Linh xác nhận sẽ chuyển khoản thanh toán đợt tiếp theo trước ngày 25/10.', 'Nguyệt Nguyễn', NOW(), NOW()),
    ('c0000001-0000-0000-0000-000000000003'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, '90000000-0000-0000-0000-000000000009'::uuid, 'PAYMENT', 'ZALO_SMS', 'COMPLETED', '2026-10-16 17:00:00'::timestamp, 'Đã gửi tin nhắn Zalo cảm ơn Quý khách Đào Phương Hòa đã thanh toán đầy đủ 8.000.000 VNĐ cho hóa đơn HD-2026-0009 dịch vụ bọc răng sứ.', 'Nguyệt Nguyễn', NOW(), NOW()),
    ('c0000001-0000-0000-0000-000000000004'::uuid, 'a0000001-0000-0000-0000-000000000018'::uuid, '90000000-0000-0000-0000-000000000010'::uuid, 'PAYMENT', 'PHONE', 'RECARE', '2026-10-17 11:30:00'::timestamp, 'Đã gọi điện thông báo hóa đơn HD-2026-0010 còn nợ 1.500.000 VNĐ. Khách báo sẽ thanh toán trực tiếp tại quầy vào buổi tái khám tuần tới.', 'Nguyệt Nguyễn', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

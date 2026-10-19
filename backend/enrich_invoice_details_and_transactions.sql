-- Enrich invoice_details and payment_transactions for invoices HD-2026-0001 to HD-2026-0012

DELETE FROM payment_transactions WHERE invoice_id IN (
    '90000000-0000-0000-0000-000000000001',
    '90000000-0000-0000-0000-000000000002',
    '90000000-0000-0000-0000-000000000003',
    '90000000-0000-0000-0000-000000000004',
    '90000000-0000-0000-0000-000000000005',
    '90000000-0000-0000-0000-000000000006',
    '90000000-0000-0000-0000-000000000007',
    '90000000-0000-0000-0000-000000000008',
    '90000000-0000-0000-0000-000000000009',
    '90000000-0000-0000-0000-000000000010',
    '90000000-0000-0000-0000-000000000011',
    '90000000-0000-0000-0000-000000000012'
);

DELETE FROM invoice_details WHERE invoice_id IN (
    '90000000-0000-0000-0000-000000000001',
    '90000000-0000-0000-0000-000000000002',
    '90000000-0000-0000-0000-000000000003',
    '90000000-0000-0000-0000-000000000004',
    '90000000-0000-0000-0000-000000000005',
    '90000000-0000-0000-0000-000000000006',
    '90000000-0000-0000-0000-000000000007',
    '90000000-0000-0000-0000-000000000008',
    '90000000-0000-0000-0000-000000000009',
    '90000000-0000-0000-0000-000000000010',
    '90000000-0000-0000-0000-000000000011',
    '90000000-0000-0000-0000-000000000012'
);

-- HD-2026-0007 (Nguyễn Phương Linh) - Tổng 12.000.000, giảm 500.000 -> 11.500.000. Đã trả 6.000.000, nợ 5.500.000
INSERT INTO invoice_details (id, invoice_id, item_name, quantity, unit_price, subtotal, status) VALUES
(gen_random_uuid(), '90000000-0000-0000-0000-000000000007', 'Chụp X-quang CBCT 3D khảo sát xương', 1, 500000.00, 500000.00, true),
(gen_random_uuid(), '90000000-0000-0000-0000-000000000007', 'Tẩy trắng răng công nghệ Laser Zoom', 1, 3500000.00, 3500000.00, true),
(gen_random_uuid(), '90000000-0000-0000-0000-000000000007', 'Bọc răng sứ thẩm mỹ Zirconia cao cấp', 2, 4000000.00, 8000000.00, true);

INSERT INTO payment_transactions (id, invoice_id, employee_id, transaction_code, payment_transactions_name, payment_method, status, total_amount, service_amount, amount_received, change_amount, payment_time, note) VALUES
(gen_random_uuid(), '90000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000001', 'TX-20261014-001', 'Thanh toán đợt 1 - HĐ HD-2026-0007', 'BANK_TRANSFER', 'SUCCESS', 6000000.00, 6000000.00, 6000000.00, 0.00, '2026-10-14 14:30:00', 'Chuyển khoản qua MB Bank');

-- HD-2026-0006 (Đỗ Minh Quang) - Tổng 4.500.000, đã trả 4.500.000, nợ 0
INSERT INTO invoice_details (id, invoice_id, item_name, quantity, unit_price, subtotal, status) VALUES
(gen_random_uuid(), '90000000-0000-0000-0000-000000000006', 'Cạo vôi răng & đánh bóng siêu âm', 1, 500000.00, 500000.00, true),
(gen_random_uuid(), '90000000-0000-0000-0000-000000000006', 'Trám răng thẩm mỹ Composite răng hàm', 4, 1000000.00, 4000000.00, true);

INSERT INTO payment_transactions (id, invoice_id, employee_id, transaction_code, payment_transactions_name, payment_method, status, total_amount, service_amount, amount_received, change_amount, payment_time, note) VALUES
(gen_random_uuid(), '90000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000001', 'TX-20261012-001', 'Thanh toán trọn gói - HĐ HD-2026-0006', 'CASH', 'SUCCESS', 4500000.00, 4500000.00, 4500000.00, 0.00, '2026-10-12 10:00:00', 'Thanh toán tiền mặt tại quầy');

-- HD-2026-0012 (Phan Hoài Nam) - Tổng 5.000.000, đã trả 0, nợ 5.000.000
INSERT INTO invoice_details (id, invoice_id, item_name, quantity, unit_price, subtotal, status) VALUES
(gen_random_uuid(), '90000000-0000-0000-0000-000000000012', 'Tiểu phẫu nhổ răng khôn mọc ngầm Piezotome', 2, 2500000.00, 5000000.00, true);

-- HD-2026-0011 (Sơn Tùng) - Tổng 850.000, đã trả 850.000, nợ 0
INSERT INTO invoice_details (id, invoice_id, item_name, quantity, unit_price, subtotal, status) VALUES
(gen_random_uuid(), '90000000-0000-0000-0000-000000000011', 'Lấy cao răng & điều trị viêm nướu', 1, 450000.00, 450000.00, true),
(gen_random_uuid(), '90000000-0000-0000-0000-000000000011', 'Trám răng kẽ sâu nhẹ', 1, 400000.00, 400000.00, true);

INSERT INTO payment_transactions (id, invoice_id, employee_id, transaction_code, payment_transactions_name, payment_method, status, total_amount, service_amount, amount_received, change_amount, payment_time, note) VALUES
(gen_random_uuid(), '90000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000001', 'TX-20261018-001', 'Thanh toán trọn gói - HĐ HD-2026-0011', 'BANK_TRANSFER', 'SUCCESS', 850000.00, 850000.00, 850000.00, 0.00, '2026-10-18 11:30:00', 'Quét mã QR thanh toán');

-- HD-2026-0008 (Trần Mỹ Duyên) - Tổng 1.800.000, đã trả 0, nợ 1.800.000
INSERT INTO invoice_details (id, invoice_id, item_name, quantity, unit_price, subtotal, status) VALUES
(gen_random_uuid(), '90000000-0000-0000-0000-000000000008', 'Gắn đá thẩm mỹ đính răng', 2, 900000.00, 1800000.00, true);

-- HD-2026-0005 (Hoang Ngoc Linh) - Tổng 1.802.500, giảm 100.000 -> 1.702.500, đã trả 1.000.000, nợ 702.500
INSERT INTO invoice_details (id, invoice_id, item_name, quantity, unit_price, subtotal, status) VALUES
(gen_random_uuid(), '90000000-0000-0000-0000-000000000005', 'Điều trị nội nha răng số 6', 1, 1500000.00, 1500000.00, true),
(gen_random_uuid(), '90000000-0000-0000-0000-000000000005', 'Chụp phim quanh chóp', 1, 302500.00, 302500.00, true);

INSERT INTO payment_transactions (id, invoice_id, employee_id, transaction_code, payment_transactions_name, payment_method, status, total_amount, service_amount, amount_received, change_amount, payment_time, note) VALUES
(gen_random_uuid(), '90000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000001', 'TX-20260713-001', 'Đặt cọc & thanh toán đợt 1', 'CASH', 'SUCCESS', 1000000.00, 1000000.00, 1000000.00, 0.00, '2026-07-13 17:15:00', 'Tiền mặt');

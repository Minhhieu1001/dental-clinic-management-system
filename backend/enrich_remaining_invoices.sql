-- Seed details and transactions for remaining invoices (0001, 0002, 0003, 0004, 0009, 0010)

-- HD-2026-0001 (Nguyen Van An)
INSERT INTO invoice_details (id, invoice_id, item_name, quantity, unit_price, subtotal, status) VALUES
(gen_random_uuid(), '90000000-0000-0000-0000-000000000001', 'Lấy cao răng & đánh bóng 2 hàm', 1, 400000.00, 400000.00, true),
(gen_random_uuid(), '90000000-0000-0000-0000-000000000001', 'Trám răng thẩm mỹ Fuji IX', 1, 500000.00, 500000.00, true);

INSERT INTO payment_transactions (id, invoice_id, employee_id, transaction_code, payment_transactions_name, payment_method, status, total_amount, service_amount, amount_received, change_amount, payment_time, note) VALUES
(gen_random_uuid(), '90000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'TX-20260710-001', 'Thanh toán trọn gói', 'CASH', 'SUCCESS', 900000.00, 900000.00, 900000.00, 0.00, '2026-07-10 10:30:00', 'Tiền mặt tại quầy');

-- HD-2026-0002 (Tran Thi Bich)
INSERT INTO invoice_details (id, invoice_id, item_name, quantity, unit_price, subtotal, status) VALUES
(gen_random_uuid(), '90000000-0000-0000-0000-000000000002', 'Nhổ răng sữa lung lay', 2, 100000.00, 200000.00, true),
(gen_random_uuid(), '90000000-0000-0000-0000-000000000002', 'Chữa tủy răng sữa', 1, 345000.00, 345000.00, true);

INSERT INTO payment_transactions (id, invoice_id, employee_id, transaction_code, payment_transactions_name, payment_method, status, total_amount, service_amount, amount_received, change_amount, payment_time, note) VALUES
(gen_random_uuid(), '90000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'TX-20260710-002', 'Thanh toán đợt 1', 'BANK_TRANSFER', 'SUCCESS', 250000.00, 250000.00, 250000.00, 0.00, '2026-07-10 11:30:00', 'Chuyển khoản MB Bank');

-- HD-2026-0003 (Le Minh Chau)
INSERT INTO invoice_details (id, invoice_id, item_name, quantity, unit_price, subtotal, status) VALUES
(gen_random_uuid(), '90000000-0000-0000-0000-000000000003', 'Khám tổng quát & Chụp X-quang quanh chóp', 1, 201500.00, 201500.00, true);

INSERT INTO payment_transactions (id, invoice_id, employee_id, transaction_code, payment_transactions_name, payment_method, status, total_amount, service_amount, amount_received, change_amount, payment_time, note) VALUES
(gen_random_uuid(), '90000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', 'TX-20260711-001', 'Thanh toán phí khám', 'CASH', 'SUCCESS', 201500.00, 201500.00, 201500.00, 0.00, '2026-07-11 15:30:00', 'Tiền mặt');

-- HD-2026-0004 (Pham Quoc Dung)
INSERT INTO invoice_details (id, invoice_id, item_name, quantity, unit_price, subtotal, status) VALUES
(gen_random_uuid(), '90000000-0000-0000-0000-000000000004', 'Điều trị viêm nha chu toàn hàm', 1, 1545000.00, 1545000.00, true),
(gen_random_uuid(), '90000000-0000-0000-0000-000000000004', 'Trám răng mòn cổ chân răng', 2, 500000.00, 1000000.00, true);

-- HD-2026-0009 (Đào Phương Hòa)
INSERT INTO invoice_details (id, invoice_id, item_name, quantity, unit_price, subtotal, status) VALUES
(gen_random_uuid(), '90000000-0000-0000-0000-000000000009', 'Tẩy trắng răng Laser Whitening', 1, 3000000.00, 3000000.00, true),
(gen_random_uuid(), '90000000-0000-0000-0000-000000000009', 'Răng sứ Cercon HT chính hãng', 1, 5000000.00, 5000000.00, true);

INSERT INTO payment_transactions (id, invoice_id, employee_id, transaction_code, payment_transactions_name, payment_method, status, total_amount, service_amount, amount_received, change_amount, payment_time, note) VALUES
(gen_random_uuid(), '90000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000001', 'TX-20261016-001', 'Thanh toán dịch vụ thẩm mỹ', 'BANK_TRANSFER', 'SUCCESS', 8000000.00, 8000000.00, 8000000.00, 0.00, '2026-10-16 16:00:00', 'Chuyển khoản MB Bank trọn gói');

-- HD-2026-0010 (Hoàng Tuấn Anh)
INSERT INTO invoice_details (id, invoice_id, item_name, quantity, unit_price, subtotal, status) VALUES
(gen_random_uuid(), '90000000-0000-0000-0000-000000000010', 'Cấy ghép Minivis hỗ trợ chỉnh nha', 2, 1500000.00, 3000000.00, true);

INSERT INTO payment_transactions (id, invoice_id, employee_id, transaction_code, payment_transactions_name, payment_method, status, total_amount, service_amount, amount_received, change_amount, payment_time, note) VALUES
(gen_random_uuid(), '90000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000001', 'TX-20261017-001', 'Đặt cọc đợt 1', 'CASH', 'SUCCESS', 1500000.00, 1500000.00, 1500000.00, 0.00, '2026-10-17 14:00:00', 'Tiền mặt');

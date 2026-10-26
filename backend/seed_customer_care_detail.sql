-- =========================================================================
-- SEED SCRIPT: DỮ LIỆU ĐẦY ĐỦ 4 PHẦN CHO CHI TIẾT CHĂM SÓC KHÁCH HÀNG
-- =========================================================================

-- 1. Cập nhật Bác sĩ chuẩn theo ảnh
INSERT INTO dentists (id, full_name, gender, education) VALUES
('b1c2d3e4-f5a6-7890-bcde-fa1234567810', 'Bs Bùi Mai Hương', 'Nữ', 'Bác sĩ CKI Răng Hàm Mặt'),
('b1c2d3e4-f5a6-7890-bcde-fa1234567811', 'BS Hoàng Văn Tiến', 'Nam', 'Thạc sĩ Bác sĩ Chỉnh Nha'),
('b1c2d3e4-f5a6-7890-bcde-fa1234567812', 'Nguyễn Đức Anh', 'Nam', 'Bác sĩ Phẫu thuật Implant'),
('b1c2d3e4-f5a6-7890-bcde-fa1234567813', 'Phan Thanh Nam', 'Nam', 'Bác sĩ Phục hình Răng sứ'),
('b1c2d3e4-f5a6-7890-bcde-fa1234567814', 'Nguyễn Ninh Dương', 'Nam', 'Bác sĩ Răng Hàm Mặt')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- 2. Đảm bảo Bệnh nhân Đỗ Minh Quang có đầy đủ thông tin chuẩn Phần 1
INSERT INTO patients (
    id, patient_code, full_name, phone_number, date_of_birth, 
    address, customer_group, customer_source, customer_card, created_at, notes
) VALUES (
    'a0000001-0000-0000-0000-000000000002', 
    '3435234711', 
    'Đỗ Minh Quang', 
    '0915103089', 
    '1989-10-30 00:00:00',
    '45 Lê Duẩn, Quận 1, TP.HCM', 
    'Khách thân thiết', 
    'Website', 
    'MEM-1022', 
    '2024-10-02 09:15:00', 
    'Khách đang niềng răng mắc cài kim loại và điều trị tủy'
)
ON CONFLICT (id) DO UPDATE SET
    patient_code = '3435234711',
    full_name = 'Đỗ Minh Quang',
    phone_number = '0915103089',
    date_of_birth = '1989-10-30 00:00:00',
    address = EXCLUDED.address,
    customer_group = 'Khách thân thiết';

-- Đồng bộ mã hồ sơ nếu có khoảng trắng trước đó
UPDATE patients SET patient_code = '3435234711' WHERE id = 'a0000001-0000-0000-0000-000000000002';

-- 3. Xóa các lịch hẹn trùng cũ của Đỗ Minh Quang để chuẩn hóa 5 lịch hẹn chính xác theo ảnh
DELETE FROM customer_care_records WHERE patient_id = 'a0000001-0000-0000-0000-000000000002';
DELETE FROM appointments WHERE patient_id = 'a0000001-0000-0000-0000-000000000002';

-- 4. Thêm 5 lịch hẹn đúng 100% theo Phần 4 trong ảnh:
--    - 21/10/2024, 18:30 | Đặt trước | BS Hoàng Văn Tiến | Điều trị tủy | Chưa đến
--    - 16/10/2024, 16:30 | Dự kiến   | Nguyễn Đức Anh   | Bọc răng     | Đang điều trị
--    - 12/10/2024, 15:30 | Đặt trước | Phan Thanh Nam    | Điều trị tủy | Đã hẹn lại
--    - 07/10/2024, 10:45 | Đặt trước | Bs Bùi Mai Hương  | Điều trị tủy | Đang điều trị
--    - 02/10/2024, 10:45 | Đặt trước | BS Hoàng Văn Tiến |              | Đang điều trị
INSERT INTO appointments (
    id, patient_id, patient_name, phone, appointment_date, appointment_time, 
    dentist_id, reason, attribute, status, notes, created_at
) VALUES
(
    'b0000002-0000-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000002',
    'Đỗ Minh Quang',
    '0915103089',
    '2024-10-21 00:00:00',
    '2024-10-21 18:30:00',
    'b1c2d3e4-f5a6-7890-bcde-fa1234567811',
    'Điều trị tủy',
    'Đặt trước',
    'PENDING',
    'Hẹn điều trị tủy buổi chiều tối',
    '2024-10-01 10:00:00'
),
(
    'b0000002-0000-0000-0000-000000000002',
    'a0000001-0000-0000-0000-000000000002',
    'Đỗ Minh Quang',
    '0915103089',
    '2024-10-16 00:00:00',
    '2024-10-16 16:30:00',
    'b1c2d3e4-f5a6-7890-bcde-fa1234567812',
    'Bọc răng',
    'Dự kiến',
    'IN_PROGRESS',
    '',
    '2024-10-01 10:00:00'
),
(
    'b0000002-0000-0000-0000-000000000003',
    'a0000001-0000-0000-0000-000000000002',
    'Đỗ Minh Quang',
    '0915103089',
    '2024-10-12 00:00:00',
    '2024-10-12 15:30:00',
    'b1c2d3e4-f5a6-7890-bcde-fa1234567813',
    'Điều trị tủy',
    'Đặt trước',
    'WAITING',
    '',
    '2024-10-01 10:00:00'
),
(
    'b0000002-0000-0000-0000-000000000004',
    'a0000001-0000-0000-0000-000000000002',
    'Đỗ Minh Quang',
    '0915103089',
    '2024-10-07 00:00:00',
    '2024-10-07 10:45:00',
    'b1c2d3e4-f5a6-7890-bcde-fa1234567810',
    'Điều trị tủy',
    'Đặt trước',
    'IN_PROGRESS',
    '',
    '2024-10-01 10:00:00'
),
(
    'b0000002-0000-0000-0000-000000000005',
    'a0000001-0000-0000-0000-000000000002',
    'Đỗ Minh Quang',
    '0915103089',
    '2024-10-02 00:00:00',
    '2024-10-02 10:45:00',
    'b1c2d3e4-f5a6-7890-bcde-fa1234567811',
    '',
    'Đặt trước',
    'IN_PROGRESS',
    '',
    '2024-10-01 10:00:00'
);

-- 5. Thêm bản ghi Lịch sử chăm sóc Phần 3 đúng 100% theo ảnh:
--    21/10/2024, 17:33 | Kênh: Gọi điện | Trạng thái: Hoàn thành | Người tạo: Nguyệt Nguyễn | Nội dung: khách đồng ý thời gian đó đến được
INSERT INTO customer_care_records (
    id, patient_id, appointment_id, care_type, channel, status, 
    care_time, notes, created_by_name, created_at, updated_at
) VALUES (
    'd0000002-0000-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000002',
    'b0000002-0000-0000-0000-000000000001',
    'APPOINTMENT_REMINDER',
    'PHONE',
    'COMPLETED',
    '2024-10-21 17:33:00',
    'khách đồng ý thời gian đó đến được',
    'Nguyệt Nguyễn',
    '2024-10-21 17:33:00',
    '2024-10-21 17:33:00'
);

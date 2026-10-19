-- Seed / Align data for Customer Care (Chăm Sóc Khách Hàng) matching realistic clinic screenshots

-- 1. Ensure Dentists exist with matching names
INSERT INTO dentists (id, full_name, gender, education) VALUES
('b1c2d3e4-f5a6-7890-bcde-fa1234567810', 'Bs Bùi Mai Hương', 'Nữ', 'Bác sĩ CKI Răng Hàm Mặt'),
('b1c2d3e4-f5a6-7890-bcde-fa1234567811', 'BS Hoàng Văn Tiến', 'Nam', 'Thạc sĩ Bác sĩ Chỉnh Nha'),
('b1c2d3e4-f5a6-7890-bcde-fa1234567812', 'Nguyễn Đức Anh', 'Nam', 'Bác sĩ Phẫu thuật Implant'),
('b1c2d3e4-f5a6-7890-bcde-fa1234567813', 'Phan Thanh Nam', 'Nam', 'Bác sĩ Phục hình Răng sứ'),
('b1c2d3e4-f5a6-7890-bcde-fa1234567814', 'Nguyễn Ninh Dương', 'Nam', 'Bác sĩ Răng Hàm Mặt')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- 2. Insert or update Patients
INSERT INTO patients (id, patient_code, full_name, phone_number, date_of_birth, address, customer_group, customer_source, customer_card, created_at, notes)
VALUES
('a0000001-0000-0000-0000-000000000001', '34352347 16', 'Đào Phương Hòa', '0945123675', '2020-10-12 00:00:00', '124 Nguyễn Đình Chiểu, Q3, TP.HCM', 'Khách VIP', 'Facebook', 'VIP-8899', '2024-10-01 08:30:00', 'Khách hay bận buổi sáng, ưu tiên liên hệ chiều'),
('a0000001-0000-0000-0000-000000000002', '34352347 11', 'Đỗ Minh Quang', '0915103089', '1989-10-30 00:00:00', '45 Lê Duẩn, Q1, TP.HCM', 'Khách thân thiết', 'Website', 'MEM-1022', '2024-10-02 09:15:00', 'Khách đang niềng răng mắc cài kim loại'),
('a0000001-0000-0000-0000-000000000003', '34352347 22', 'Nguyễn Phương Linh', '0913765876', '1995-10-18 00:00:00', '78 Hai Bà Trưng, Q1, TP.HCM', 'Khách VIP', 'Người quen giới thiệu', 'VIP-2034', '2024-10-03 10:00:00', 'Nhổ 2 răng khôn hàm dưới'),
('a0000001-0000-0000-0000-000000000004', '34352345 58', 'duyên', '0968415284', '1993-04-15 00:00:00', '32 Hoàng Hoa Thám, Bình Thạnh, TP.HCM', 'Khách mới', 'Trực tiếp', 'NEW-0091', '2024-10-04 11:20:00', 'Bệnh nhân tái khám đúng hẹn'),
('a0000001-0000-0000-0000-000000000005', '20220715 77', 'Nam', '0903112233', '1985-06-20 00:00:00', '56 Phan Đăng Lưu, Phú Nhuận, TP.HCM', 'Khách thân thiết', 'Hotline', 'MEM-5541', '2024-10-05 14:00:00', 'Điều trị tủy và bọc răng sứ'),
('a0000001-0000-0000-0000-000000000006', '34352347 19', 'Nguyễn Văn Dương', '0129746362', '1991-08-14 00:00:00', '88 Trường Chinh, Tân Bình, TP.HCM', 'Khách tiềm năng', 'Facebook', 'POT-1011', '2024-10-06 15:30:00', 'Số điện thoại cũ thỉnh thoảng không liên lạc được'),
('a0000001-0000-0000-0000-000000000007', '34352346 26', 'Lê Bá Hùng', '0937317217', '1987-03-22 00:00:00', '90 Võ Văn Tần, Q3, TP.HCM', 'Khách thân thiết', 'Website', 'MEM-3329', '2024-10-07 09:00:00', 'Đang thực hiện cấy Implant'),
('a0000001-0000-0000-0000-000000000008', '3435239', 'Sơn Tùng', '0904699887', '1994-07-05 00:00:00', '12 Điện Biên Phủ, Bình Thạnh, TP.HCM', 'Khách VIP', 'Trực tiếp', 'VIP-9999', '2024-10-08 10:45:00', 'Khách VIP yêu cầu phòng khám riêng'),
('a0000001-0000-0000-0000-000000000009', '34352347 14', 'Nguyễn Thị Việt', '0336789012', '1992-09-11 00:00:00', '65 Trần Hưng Đạo, Q5, TP.HCM', 'Khách mới', 'Hotline', 'NEW-0455', '2024-10-09 13:10:00', 'Khách đã đến làm sạch răng và hàn răng'),
('a0000001-0000-0000-0000-000000000010', '34352347 17', 'Phạm Thị Thanh Hiền', '0978123456', '1996-05-19 00:00:00', '210 Pasteur, Q3, TP.HCM', 'Khách thân thiết', 'Facebook', 'MEM-7781', '2024-10-10 16:00:00', 'Khách hẹn tái khám cắt chỉ'),
('a0000001-0000-0000-0000-000000000011', '343523454 3', 'Nguyễn Văn A 2', '0949473689', '1990-10-27 00:00:00', '15 CMT8, Q10, TP.HCM', 'Khách thân thiết', 'Website', 'MEM-8822', '2024-10-11 08:00:00', 'Khách hàng có sinh nhật trong tháng 10'),
('a0000001-0000-0000-0000-000000000012', '12354', 'Nguyen Tien Hiep', '0918887766', '2021-10-26 00:00:00', '33 Lý Thường Kiệt, Tân Bình, TP.HCM', 'Khách VIP', 'Người quen giới thiệu', 'VIP-1235', '2024-10-12 09:30:00', 'Bé khám răng trẻ em'),
('a0000001-0000-0000-0000-000000000013', '202207154 0', 'Đỗ Duy Thắng', '0964979228', '1994-10-25 00:00:00', '71 Nguyễn Thị Minh Khai, Q1, TP.HCM', 'Khách mới', 'Hotline', 'NEW-2211', '2024-10-12 11:00:00', 'Sinh nhật ngày 25/10'),
('a0000001-0000-0000-0000-000000000014', '343523472 1', 'Phạm Thị Thanh Thanh', '0908765432', '1999-10-21 00:00:00', '42 Đinh Tiên Hoàng, Bình Thạnh, TP.HCM', 'Khách tiềm năng', 'Facebook', 'POT-3344', '2024-10-13 14:15:00', 'Sinh nhật ngày 21/10'),
('a0000001-0000-0000-0000-000000000015', '343523463 6', 'Nguyễn Linh Chi', '0123456789', '1999-10-20 00:00:00', '19 Nguyễn Trãi, Q5, TP.HCM', 'Khách mới', 'Tiktok', 'NEW-5599', '2024-10-13 16:00:00', 'Sinh nhật ngày 20/10'),
('a0000001-0000-0000-0000-000000000016', '202207152 5', 'HUONG', '0901665050', '1987-10-15 00:00:00', '58 Lê Hồng Phong, Q10, TP.HCM', 'Khách thân thiết', 'Trực tiếp', 'MEM-9901', '2024-10-14 09:00:00', 'Sinh nhật ngày 15/10'),
('a0000001-0000-0000-0000-000000000017', '34352347 8', 'Nguyễn Trọng Trường', '0879156256', '1993-11-12 00:00:00', '101 Nam Kỳ Khởi Nghĩa, Q1, TP.HCM', 'Khách thân thiết', 'Website', 'MEM-6677', '2024-10-14 10:30:00', 'Điều trị tủy răng số 36'),
('a0000001-0000-0000-0000-000000000018', '34352347 0', 'Anh', '0987112233', '1986-04-18 00:00:00', '80 Phan Xích Long, Phú Nhuận, TP.HCM', 'Khách VIP', 'Người quen giới thiệu', 'VIP-5544', '2024-10-14 11:15:00', 'Cấy ghép Implant Straumann')
ON CONFLICT (id) DO UPDATE SET
  patient_code = EXCLUDED.patient_code,
  full_name = EXCLUDED.full_name,
  phone_number = EXCLUDED.phone_number,
  date_of_birth = EXCLUDED.date_of_birth,
  address = EXCLUDED.address,
  customer_group = EXCLUDED.customer_group,
  customer_source = EXCLUDED.customer_source,
  customer_card = EXCLUDED.customer_card,
  notes = EXCLUDED.notes;

-- 3. Insert Appointments matching Tab "Nhắc lịch hẹn"
INSERT INTO appointments (id, patient_id, patient_name, phone, appointment_date, appointment_time, dentist_id, status, created_at)
VALUES
('b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'Đào Phương Hòa', '0945123675', '2024-10-23 00:00:00', '2024-10-23 11:15:00', 'b1c2d3e4-f5a6-7890-bcde-fa1234567810', 'PENDING', '2024-10-15 10:00:00'),
('b0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', 'Đỗ Minh Quang', '0915103089', '2024-10-21 00:00:00', '2024-10-21 18:30:00', 'b1c2d3e4-f5a6-7890-bcde-fa1234567811', 'PENDING', '2024-10-16 09:00:00'),
('b0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000003', 'Nguyễn Phương Linh', '0913765876', '2024-10-21 00:00:00', '2024-10-21 18:00:00', 'b1c2d3e4-f5a6-7890-bcde-fa1234567812', 'PENDING', '2024-10-16 11:30:00'),
('b0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000004', 'duyên', '0968415284', '2024-10-21 00:00:00', '2024-10-21 15:45:00', 'b1c2d3e4-f5a6-7890-bcde-fa1234567812', 'COMPLETED', '2024-10-17 08:30:00'),
('b0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000005', 'Nam', '0903112233', '2024-10-18 00:00:00', '2024-10-18 15:00:00', 'b1c2d3e4-f5a6-7890-bcde-fa1234567813', 'COMPLETED', '2024-10-17 10:00:00'),
('b0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000006', 'Nguyễn Văn Dương', '0129746362', '2024-10-18 00:00:00', '2024-10-18 15:00:00', 'b1c2d3e4-f5a6-7890-bcde-fa1234567814', 'CANCELLED', '2024-10-17 14:00:00'),
('b0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000007', 'Lê Bá Hùng', '0937317217', '2024-10-18 00:00:00', '2024-10-18 14:00:00', 'b1c2d3e4-f5a6-7890-bcde-fa1234567812', 'CONFIRMED', '2024-10-17 15:00:00'),
('b0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000008', 'Sơn Tùng', '0904699887', '2024-10-18 00:00:00', '2024-10-18 14:00:00', 'b1c2d3e4-f5a6-7890-bcde-fa1234567814', 'CANCELLED', '2024-10-17 16:30:00'),
('b0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000009', 'Nguyễn Thị Việt', '0336789012', '2024-10-18 00:00:00', '2024-10-18 13:45:00', 'b1c2d3e4-f5a6-7890-bcde-fa1234567811', 'COMPLETED', '2024-10-18 08:00:00'),
('b0000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000010', 'Phạm Thị Thanh Hiền', '0978123456', '2024-10-18 00:00:00', '2024-10-18 13:30:00', 'b1c2d3e4-f5a6-7890-bcde-fa1234567810', 'CANCELLED', '2024-10-18 08:30:00')
ON CONFLICT (id) DO UPDATE SET
  patient_id = EXCLUDED.patient_id,
  patient_name = EXCLUDED.patient_name,
  phone = EXCLUDED.phone,
  appointment_date = EXCLUDED.appointment_date,
  appointment_time = EXCLUDED.appointment_time,
  dentist_id = EXCLUDED.dentist_id,
  status = EXCLUDED.status;

-- 4. Insert Treatment Plans matching Tab "Hỏi thăm sau điều trị"
INSERT INTO treatment_plans (id, patient_id, plan_name, start_date, status, dentist_id)
VALUES
('c0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 'Nhổ răng khôn, Lấy cao răng', '2024-10-21 09:00:00', 'COMPLETED', 'b1c2d3e4-f5a6-7890-bcde-fa1234567812'),
('c0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000006', 'Sàn lọc', '2024-10-19 14:00:00', 'COMPLETED', 'b1c2d3e4-f5a6-7890-bcde-fa1234567814'),
('c0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000006', 'HÀN RĂNG FUJI', '2024-10-18 10:00:00', 'COMPLETED', 'b1c2d3e4-f5a6-7890-bcde-fa1234567810'),
('c0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000018', 'Implant', '2024-10-18 11:30:00', 'COMPLETED', 'b1c2d3e4-f5a6-7890-bcde-fa1234567812'),
('c0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000006', 'CHỈNH NHA CỐ ĐỊNH MẮC CÀI KIM LOẠI KHE 18, TÁI KHÁM CHỈNH...', '2024-10-18 15:00:00', 'IN_PROGRESS', 'b1c2d3e4-f5a6-7890-bcde-fa1234567811'),
('c0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000002', 'TÁI KHÁM CHỈNH NHA', '2024-10-18 16:30:00', 'IN_PROGRESS', 'b1c2d3e4-f5a6-7890-bcde-fa1234567811'),
('c0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000017', 'Điều trị tủy', '2024-10-17 09:30:00', 'COMPLETED', 'b1c2d3e4-f5a6-7890-bcde-fa1234567810'),
('c0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000001', 'Lấy cao răng', '2024-10-16 10:00:00', 'COMPLETED', 'b1c2d3e4-f5a6-7890-bcde-fa1234567810'),
('c0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000010', 'Nha phẩm, Nhổ răng số 8', '2024-10-16 14:00:00', 'COMPLETED', 'b1c2d3e4-f5a6-7890-bcde-fa1234567812'),
('c0000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000002', 'Nhổ răng số 8', '2024-10-16 15:30:00', 'COMPLETED', 'b1c2d3e4-f5a6-7890-bcde-fa1234567812')
ON CONFLICT (id) DO UPDATE SET
  patient_id = EXCLUDED.patient_id,
  plan_name = EXCLUDED.plan_name,
  start_date = EXCLUDED.start_date,
  status = EXCLUDED.status,
  dentist_id = EXCLUDED.dentist_id;

-- 5. Insert Customer Care records matching sample screenshots
INSERT INTO customer_care_records (id, patient_id, appointment_id, care_type, channel, status, care_time, notes, created_by_name, created_at, updated_at)
VALUES
-- Appointment reminders
('d0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'APPOINTMENT_REMINDER', 'PHONE', 'RECARE', '2024-10-18 14:12:00', 'ok', 'Nguyệt Nguyễn', NOW(), NOW()),
('d0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000003', 'APPOINTMENT_REMINDER', 'PHONE', 'COMPLETED', '2024-10-21 17:31:00', 'khách đã nắm được lịch', 'Nguyệt Nguyễn', NOW(), NOW()),
('d0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000004', 'APPOINTMENT_REMINDER', 'PHONE', 'COMPLETED', '2024-10-21 17:17:00', 'OK', 'Nguyệt Nguyễn', NOW(), NOW()),
('d0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000006', 'b0000001-0000-0000-0000-000000000006', 'APPOINTMENT_REMINDER', 'ZALO_SMS', 'FAILED', '2024-10-18 15:00:00', E'Chăm sóc tự động \nTrạng thái: Số điện thoại không hợp lệ', 'Hệ thống tự động', NOW(), NOW()),

-- Birthday care
('d0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000002', NULL, 'BIRTHDAY', 'SMS', 'COMPLETED', '2024-10-15 16:27:00', 'đã CMSN khách xong', 'Nguyệt Nguyễn', NOW(), NOW()),
('d0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000011', NULL, 'BIRTHDAY', 'SMS', 'COMPLETED', '2024-10-18 14:14:00', 'ok', 'Nguyệt Nguyễn', NOW(), NOW()),
('d0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000012', NULL, 'BIRTHDAY', 'GIFT', 'COMPLETED', '2024-10-21 17:18:00', 'khách đã nhận quà sinh nhật và voucher giảm giá 20%', 'Nguyệt Nguyễn', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  channel = EXCLUDED.channel,
  status = EXCLUDED.status,
  care_time = EXCLUDED.care_time,
  notes = EXCLUDED.notes;

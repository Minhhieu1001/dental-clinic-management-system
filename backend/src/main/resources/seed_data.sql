-- =============================================================================
-- KỊCH BẢN NẠP DỮ LIỆU CHUẨN NHA KHOA CHO POSTGRESQL (CHUẨN ĐỊNH DẠNG UUID HEX)
-- Mật khẩu mặc định cho tất cả các tài khoản là: 123456 (Mã hóa BCrypt)
-- =============================================================================

-- 1. THÊM TÀI KHOẢN NGƯỜI DÙNG (USERS)
INSERT INTO users (id, username, email, password, phone, role, status, created_at, updated_at)
VALUES 
  -- Admin
  ('11111111-1111-1111-1111-111111111111', 'Admin', 'admin@dental.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQiy4a2', '0900000000', 'ADMIN', 'ACTIVE', NOW(), NOW()),
  
  -- Bác sĩ 1: BS. Nguyễn Thị Phương
  ('22222222-2222-2222-2222-222222222222', 'bs.nguyen.thi.phuong', 'phuong.nguyen@dental.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQiy4a2', '0901122334', 'DENTIST', 'ACTIVE', NOW(), NOW()),
  
  -- Bác sĩ 2: BS. Trần Quang
  ('33333333-3333-3333-3333-333333333333', 'bs.tran.quang', 'quang.tran@dental.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQiy4a2', '0905566778', 'DENTIST', 'ACTIVE', NOW(), NOW()),
  
  -- Lễ tân: employee02 (Nguyễn Thảo)
  ('44444444-4444-4444-4444-444444444444', 'employee02', 'thao.nguyen@dental.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQiy4a2', '0912345678', 'EMPLOYEE', 'ACTIVE', NOW(), NOW()),
  
  -- Bệnh nhân 1: Tâm Thành Nguyễn
  ('55555555-5555-5555-5555-555555555555', 'patient_0343632524', 'tamthanh@patient.clinic.vn', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQiy4a2', '0343632524', 'PATIENT', 'ACTIVE', NOW(), NOW()),
  
  -- Bệnh nhân 2: Lê Thị Hương
  ('66666666-6666-6666-6666-666666666666', 'patient_0901112233', 'huong.le@patient.clinic.vn', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQiy4a2', '0901112233', 'PATIENT', 'ACTIVE', NOW(), NOW()),

  -- Bệnh nhân 3: Nguyễn Minh Long
  ('77777777-7777-7777-7777-777777777777', 'patient_0903456789', 'long.nguyen@patient.clinic.vn', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQiy4a2', '0903456789', 'PATIENT', 'ACTIVE', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;


-- 2. THÊM THÔNG TIN BÁC SĨ (DENTISTS)
INSERT INTO dentists (id, user_id, full_name, gender, experience_years, education, description)
VALUES 
  ('a1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'BS. Nguyễn Thị Phương', 'Nữ', 8, 'Đại học Y Dược TP.HCM', 'Chuyên gia Niềng răng & Chỉnh hình răng mặt'),
  ('a2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'BS. Trần Quang', 'Nam', 10, 'Đại học Y Hà Nội', 'Chuyên gia Phục hình & Cấy ghép Implant')
ON CONFLICT (id) DO NOTHING;


-- 3. THÊM THÔNG TIN NHÂN VIÊN LỄ TÂN (EMPLOYEES)
INSERT INTO employees (id, user_id, full_name, gender)
VALUES 
  ('b1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'Nguyễn Thảo', 'Nữ')
ON CONFLICT (id) DO NOTHING;


-- 4. THÊM THÔNG TIN BỆNH NHÂN (PATIENTS)
INSERT INTO patients (id, user_id, full_name, patient_code, email, created_at)
VALUES 
  ('c1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'Tâm Thành Nguyễn', 'PA-839092', 'tamthanh@patient.clinic.vn', NOW()),
  ('c2222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'Lê Thị Hương', 'BN-001890', 'huong.le@patient.clinic.vn', NOW()),
  ('c3333333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777', 'Nguyễn Minh Long', 'BN-002185', 'long.nguyen@patient.clinic.vn', NOW())
ON CONFLICT (id) DO NOTHING;


-- 5. THÊM PHÒNG KHÁM (ROOMS)
INSERT INTO rooms (id, room_name, floor_name, create_at)
VALUES 
  ('f1111111-1111-1111-1111-111111111111', 'Phòng khám 01', 'Tầng 1', NOW()),
  ('f2222222-2222-2222-2222-222222222222', 'Phòng chỉnh nha 02', 'Tầng 2', NOW())
ON CONFLICT (id) DO NOTHING;


-- 6. THÊM LỊCH HẸN KHÁM BÁC SĨ TỪ T2 ĐẾN CN TRONG TUẦN (APPOINTMENTS)
INSERT INTO appointments (id, patient_id, dentist_id, employee_id, appointment_date, appointment_time, reason, notes, diagnosis, symptoms, treatment_notes, status, room_id, created_at)
VALUES 
  -- Lịch hẹn T2: Dành cho BS. Nguyễn Thị Phương (Trần Thị Mai - 08:00)
  ('d1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE - INTERVAL '6 days' + TIME '08:00:00', 'Cạo vôi răng & Đánh bóng', 'Đã đặt trước qua hotline', 'Vôi răng độ 1', 'Mảng bám bề mặt răng', 'Đã cạo vôi 2 hàm', 'COMPLETED', 'f1111111-1111-1111-1111-111111111111', NOW()),

  -- Lịch hẹn T3: Dành cho BS. Nguyễn Thị Phương (Lê Hoàng Nam - 10:00)
  ('d2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '5 days' + TIME '10:00:00', 'Trám răng composite R24', 'Đã check-in', 'Sâu răng độ 1 R24', 'Ê buốt nhẹ', 'Tiến hành trám composite', 'COMPLETED', 'f2222222-2222-2222-2222-222222222222', NOW()),

  -- Lịch hẹn T4: Dành cho BS. Nguyễn Thị Phương (Nguyễn Văn Nam - 09:00)
  ('d3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '4 days', CURRENT_DATE - INTERVAL '4 days' + TIME '09:00:00', 'Nhổ răng khôn R38', 'Đã chụp X-quang Pano', 'Răng khôn mọc lệch 90 độ', 'Đau sưng lợi vùng R38', 'Phẫu thuật nhổ răng khôn', 'COMPLETED', 'f1111111-1111-1111-1111-111111111111', NOW()),

  -- Lịch hẹn T5: Dành cho BS. Nguyễn Thị Phương (Bùi Thị Lan - 13:00)
  ('d4444444-4444-4444-4444-444444444444', 'c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE - INTERVAL '3 days' + TIME '13:00:00', 'Nhổ răng sâu độ 3', 'Nhổ răng hàm dưới', 'Răng sâu hư vỡ lớn R46', 'Đau nhức sưng tấy', 'Tiến hành nhổ răng an toàn', 'COMPLETED', 'f2222222-2222-2222-2222-222222222222', NOW()),

  -- Lịch hẹn T6: Dành cho BS. Nguyễn Thị Phương (Đỗ Minh Quân - 08:00)
  ('d5555555-5555-5555-5555-555555555555', 'c2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE - INTERVAL '2 days' + TIME '08:00:00', 'Tư vấn niềng răng mắc cài', 'Muốn tư vấn mắc cài kim loại', 'Khớp cắn ngược độ 1', 'Chen chúc hàm dưới', 'Lên phác đồ niềng răng', 'IN_PROGRESS', 'f1111111-1111-1111-1111-111111111111', NOW()),

  -- Lịch hẹn T7: Dành cho BS. Nguyễn Thị Phương (Nghiêm Đức Anh - 09:00)
  ('d6666666-6666-6666-6666-666666666666', 'c3333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE - INTERVAL '1 day' + TIME '09:00:00', 'Cạo vôi răng & Đánh bóng', 'Hẹn tái khám 6 tháng', 'Vôi răng độ 2', 'Chảy máu chân răng', 'Đã xử lý sạch vôi răng', 'COMPLETED', 'f2222222-2222-2222-2222-222222222222', NOW()),

  -- Lịch hẹn CN (Hôm nay 1): Dành cho BS. Nguyễn Thị Phương (Tâm Thành Nguyễn - 09:00)
  ('d7777777-7777-7777-7777-777777777777', 'c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', CURRENT_DATE, CURRENT_DATE + TIME '09:00:00', 'Tư vấn niềng răng Invisalign', 'Bệnh nhân có nhu cầu niềng răng', 'Khớp cắn lệch nhẹ', 'Răng thưa 2 hàm', 'Tư vấn phác đồ Invisalign 18 tháng', 'WAITING', 'f1111111-1111-1111-1111-111111111111', NOW()),

  -- Lịch hẹn CN (Hôm nay 2): Dành cho BS. Nguyễn Thị Phương (Lê Thị Hương - 10:00)
  ('d8888888-8888-8888-8888-888888888888', 'c2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', CURRENT_DATE, CURRENT_DATE + TIME '10:00:00', 'Nhổ răng khôn R48', 'Răng khôn mọc lệch', 'Răng khôn mọc kẹt R48', 'Đau sưng lợi', 'Đã tiến hành nhổ răng an toàn', 'COMPLETED', 'f2222222-2222-2222-2222-222222222222', NOW())
ON CONFLICT (id) DO UPDATE SET 
  appointment_date = EXCLUDED.appointment_date,
  appointment_time = EXCLUDED.appointment_time,
  status = EXCLUDED.status;


-- 7. THÊM YÊU CẦU ĐẶT LỊCH TƯ VẤN HÔM NAY (APPOINTMENT_REQUESTS)
INSERT INTO appointment_requests (id, full_name, phone, description, create_at, statust_appointment_request, employee_id)
VALUES 
  ('e1111111-1111-1111-1111-111111111111', 'Tâm Thành Nguyễn', '0343632524', 'Tư vấn niềng răng trong suốt', NOW(), 'COMPLETED', 'b1111111-1111-1111-1111-111111111111'),
  ('e2222222-2222-2222-2222-222222222222', 'Trịnh Hoàng Anh', '0922333444', 'Đặt lịch cạo vôi răng buổi chiều', NOW(), 'PENDING', NULL)
ON CONFLICT (id) DO NOTHING;

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
INSERT INTO patients (id, user_id, full_name, patient_code, created_at)
VALUES 
  ('c1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'Tâm Thành Nguyễn', 'PA-839092', NOW()),
  ('c2222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'Lê Thị Hương', 'BN-001890', NOW()),
  ('c3333333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777', 'Nguyễn Minh Long', 'BN-002185', NOW())
ON CONFLICT (id) DO NOTHING;


-- 5. THÊM PHÒNG KHÁM (ROOMS)
INSERT INTO rooms (id, room_name, floor_name, create_at)
VALUES 
  ('f1111111-1111-1111-1111-111111111111', 'Phòng khám 01', 'Tầng 1', NOW()),
  ('f2222222-2222-2222-2222-222222222222', 'Phòng chỉnh nha 02', 'Tầng 2', NOW())
ON CONFLICT (id) DO NOTHING;


-- 6. THÊM LỊCH HẸN KHÁM BÁC SĨ (APPOINTMENTS)
INSERT INTO appointments (id, patient_id, dentist_id, employee_id, appointment_date, appointment_time, reason, notes, diagnosis, symptoms, treatment_notes, status, room_id, created_at)
VALUES 
  -- Lịch hẹn 1: Dành cho BS. Nguyễn Thị Phương (Tâm Thành Nguyễn - Chờ khám)
  ('d1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', NOW(), NOW(), 'Tư vấn niềng răng trong suốt Invisalign', 'Bệnh nhân có nhu cầu tư vấn thẩm mỹ răng', NULL, 'Răng thưa & lệch khớp cắn nhẹ', NULL, 'WAITING', 'f1111111-1111-1111-1111-111111111111', NOW()),

  -- Lịch hẹn 2: Dành cho BS. Nguyễn Thị Phương (Lê Thị Hương - Đang khám)
  ('d2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', NOW(), NOW(), 'Trám răng composite R36', 'Đã check-in tại phòng chờ', 'Sâu răng độ 2 R36', 'Đau nhức nhẹ khi ăn đồ lạnh', 'Tiến hành nạo xoang sâu & trám composite thẩm mỹ', 'IN_PROGRESS', 'f2222222-2222-2222-2222-222222222222', NOW()),

  -- Lịch hẹn 3: Dành cho BS. Trần Quang (Nguyễn Minh Long - Hoàn tất)
  ('d3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'a2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', NOW(), NOW(), 'Cạo vôi răng & Tẩy trắng', 'Đã hoàn tất thanh toán', 'Vôi răng độ 1', 'Mảng bám bề mặt răng', 'Đã cạo vôi răng 2 hàm & đánh bóng', 'COMPLETED', 'f1111111-1111-1111-1111-111111111111', NOW())
ON CONFLICT (id) DO NOTHING;


-- 7. THÊM YÊU CẦU ĐẶT LỊCH TƯ VẤN HÔM NAY (APPOINTMENT_REQUESTS)
INSERT INTO appointment_requests (id, full_name, phone, description, create_at, statust_appointment_request, employee_id)
VALUES 
  ('e1111111-1111-1111-1111-111111111111', 'Tâm Thành Nguyễn', '0343632524', 'Tư vấn niềng răng trong suốt', NOW(), 'COMPLETED', 'b1111111-1111-1111-1111-111111111111'),
  ('e2222222-2222-2222-2222-222222222222', 'Trịnh Hoàng Anh', '0922333444', 'Đặt lịch cạo vôi răng buổi chiều', NOW(), 'PENDING', NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- data.sql — Dữ liệu mẫu tự động cho Nha khoa Crown Dental
-- Spring Boot chạy file này tự động mỗi lần khởi động
-- Dùng ON CONFLICT DO NOTHING để tránh lỗi trùng dữ liệu
-- ============================================================

-- Dọn dẹp ràng buộc khóa ngoại không tương thích kiểu dữ liệu nếu có
ALTER TABLE IF EXISTS invoice_details DROP CONSTRAINT IF EXISTS fk6olubg9il8wjve6h3dql5wpi;

-- Tự động bổ sung cột version cho Optimistic Locking
ALTER TABLE patients ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;
ALTER TABLE appointment_requests ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;
UPDATE patients SET version = 0 WHERE version IS NULL;
UPDATE appointments SET version = 0 WHERE version IS NULL;
UPDATE appointment_requests SET version = 0 WHERE version IS NULL;

-- Dọn dẹp các lịch trùng lặp cũ nếu có trong CSDL (chuyển bản ghi trùng thành CANCELLED để không bị lỗi index)
UPDATE appointments
SET status = 'CANCELLED'
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER(
            PARTITION BY dentist_id, appointment_date, appointment_time 
            ORDER BY id
        ) as rn
        FROM appointments
        WHERE dentist_id IS NOT NULL AND status != 'CANCELLED'
    ) t WHERE t.rn > 1
);

-- Chặn trùng lịch hẹn của cùng một bác sĩ trong cùng ngày và giờ (trừ các lịch đã bị hủy CANCELLED)
CREATE UNIQUE INDEX IF NOT EXISTS uk_dentist_active_timeslot 
ON appointments (dentist_id, appointment_date, appointment_time) 
WHERE status != 'CANCELLED';
-- ============================================================
-- KHỞI TẠO TRƯỚC: CLINICS & BRANCHES (Hệ thống phòng khám & Chi nhánh)
-- ============================================================
INSERT INTO clinics (
    clinic_id, clinic_code, brand_name, legal_name, tax_code,
    business_license_no, established_year, representative, phone_number,
    email, logo_url, registered_address, description, image, created_at, updated_at
) VALUES (
    'clinic-main-01',
    'CROWN-HQ',
    'Nha Khoa Crown Dental',
    'Công Ty TNHH Nha Khoa Quốc Tế Crown Dental',
    '0108923456',
    '0108923456-GP/SYT',
    2011,
    'BS. CKII Nguyễn Văn Hùng',
    '1900 8059',
    'contact@crowndental.vn',
    '/logo-brand.png',
    '328 Phố Huế, Phường Phố Huế, Quận Hai Bà Trưng, TP. Hà Nội',
    'Hệ thống Nha khoa Quốc tế Crown Dental - Tiêu chuẩn Châu Âu với trang thiết bị hiện đại hàng đầu Việt Nam.',
    '/clinic/crown-dental.jpg',
    NOW(),
    NOW()
) ON CONFLICT (clinic_id) DO NOTHING;

INSERT INTO branches (
    branch_id, clinic_id, branch_code, branch_name, phone_number,
    email, address, open_time, close_time, image_branch, status
) VALUES
(
    'branch-hn-01',
    'clinic-main-01',
    'CN-HN01',
    'Crown Dental Phố Huế - Hà Nội',
    '1900 8059',
    'hanoi@crowndental.vn',
    '328 Phố Huế, Quận Hai Bà Trưng, Hà Nội',
    '08:30:00',
    '19:30:00',
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80',
    'ACTIVE'
),
(
    'branch-hcm-01',
    'clinic-main-01',
    'CN-HCM01',
    'Crown Dental Nam Kỳ Khởi Nghĩa - TP.HCM',
    '1900 8059',
    'hcm@crowndental.vn',
    '215 Nam Kỳ Khởi Nghĩa, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh',
    '08:30:00',
    '19:30:00',
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
    'ACTIVE'
),
(
    'branch-bd-01',
    'clinic-main-01',
    'CN-BD01',
    'Crown Dental Thủ Dầu Một - Bình Dương',
    '1900 8059',
    'binhduong@crowndental.vn',
    '564 Đại Lộ Bình Dương, TP. Thủ Dầu Một, Bình Dương',
    '08:30:00',
    '19:30:00',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
    'ACTIVE'
) ON CONFLICT (branch_id) DO NOTHING;

-- ============================================================
-- BẢNG 0: USERS, DENTISTS, EMPLOYEES, PATIENTS, ROOMS
-- ============================================================
INSERT INTO users (id, username, code_name, email, password, phone, avatar_url, role, status, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Admin', 'ADMIN-001', 'admin@dental.com', '$2a$10$EGvcf2dZ1EA0Egj28geKruQphZIcvHEuAg/imSQc/ek1.DCOXRXge', '0900000000', '/avatars/admin.png', 'ADMIN', 'ACTIVE', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'bs.nguyen.thi.phuong', 'DENTIST-001', 'phuong.nguyen@dental.com', '$2a$10$EGvcf2dZ1EA0Egj28geKruQphZIcvHEuAg/imSQc/ek1.DCOXRXge', '0901122334', '/avatars/dentist-phuong.png', 'DENTIST', 'ACTIVE', NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'bs.tran.quang', 'DENTIST-002', 'quang.tran@dental.com', '$2a$10$EGvcf2dZ1EA0Egj28geKruQphZIcvHEuAg/imSQc/ek1.DCOXRXge', '0905566778', '/avatars/dentist-quang.png', 'DENTIST', 'ACTIVE', NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', 'employee02', 'EMPLOYEE-002', 'thao.nguyen@dental.com', '$2a$10$EGvcf2dZ1EA0Egj28geKruQphZIcvHEuAg/imSQc/ek1.DCOXRXge', '0912345678', '/avatars/employee-thao.png', 'EMPLOYEE', 'ACTIVE', NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555555', 'patient_0343632524', 'PATIENT-001', 'tamthanh@patient.clinic.vn', '$2a$10$EGvcf2dZ1EA0Egj28geKruQphZIcvHEuAg/imSQc/ek1.DCOXRXge', '0343632524', '/avatars/patient.png', 'PATIENT', 'ACTIVE', NOW(), NOW()),
  ('66666666-6666-6666-6666-666666666666', 'patient_0901112233', 'PATIENT-002', 'huong.le@patient.clinic.vn', '$2a$10$EGvcf2dZ1EA0Egj28geKruQphZIcvHEuAg/imSQc/ek1.DCOXRXge', '0901112233', '/avatars/patient.png', 'PATIENT', 'ACTIVE', NOW(), NOW()),
  ('77777777-7777-7777-7777-777777777777', 'patient_0903456789', 'PATIENT-003', 'long.nguyen@patient.clinic.vn', '$2a$10$EGvcf2dZ1EA0Egj28geKruQphZIcvHEuAg/imSQc/ek1.DCOXRXge', '0903456789', '/avatars/patient.png', 'PATIENT', 'ACTIVE', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO dentists (id, user_id, full_name, gender, date_of_birth, address, education, description, experience_years, license_number, branch_id)
VALUES
  ('a1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'BS. Nguyễn Thị Phương', 'Nữ', DATE '1988-05-12', 'Hà Nội', 'Đại học Y Dược TP.HCM', 'Chuyên gia Niềng răng & Chỉnh hình răng mặt', 8, 'DDS-HN-001', 'branch-hn-01'),
  ('a2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'BS. Trần Quang', 'Nam', DATE '1985-09-20', 'Thành phố Hồ Chí Minh', 'Đại học Y Hà Nội', 'Chuyên gia Phục hình & Cấy ghép Implant', 10, 'DDS-HCM-002', 'branch-hcm-01')
ON CONFLICT (id) DO NOTHING;

INSERT INTO employees (id, user_id, full_name, position, salary, hire_date, status, gender, date_of_birth, address, branch_id)
VALUES
  ('b1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'Nguyễn Thảo', 'RECEPTIONIST', 9000000.00, CURRENT_TIMESTAMP - INTERVAL '2 years', TRUE, 'Nữ', DATE '1992-03-15', 'Hà Nội', 'branch-hn-01')
ON CONFLICT (id) DO NOTHING;

-- Bổ sung chi nhánh cho dữ liệu mẫu cũ; giữ nguyên chi nhánh đã được phân công.
UPDATE dentists AS dentist
SET branch_id = seed.branch_id
FROM (VALUES
    ('a1111111-1111-1111-1111-111111111111'::uuid, 'branch-hn-01'),
    ('a2222222-2222-2222-2222-222222222222'::uuid, 'branch-hcm-01')
) AS seed(id, branch_id)
WHERE dentist.id = seed.id AND dentist.branch_id IS NULL;

UPDATE employees
SET branch_id = 'branch-hn-01'
WHERE id = 'b1111111-1111-1111-1111-111111111111'::uuid
  AND branch_id IS NULL;

INSERT INTO patients (id, user_id, full_name, patient_code, nationality, hometown, job, phone_number, cccd, email, gender, date_of_birth, address, systemic_disease, allergies, current_medications, surgical_history, created_at, version)
VALUES
  ('c1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'Tâm Thành Nguyễn', 'PA-839092', 'Việt Nam', 'Hà Nội', 'Kỹ sư', '0343632524', '001088000001', 'tamthanh@patient.clinic.vn', 'MALE', TIMESTAMP '1990-04-10 00:00:00', '328 Phố Huế, Hà Nội', 'Không', 'Không', 'Không', 'Không', NOW(), 0),
  ('c2222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'Lê Thị Hương', 'BN-001890', 'Việt Nam', 'Hải Phòng', 'Giáo viên', '0901112233', '001088000002', 'huong.le@patient.clinic.vn', 'FEMALE', TIMESTAMP '1994-08-22 00:00:00', '12 Lê Lợi, Hải Phòng', 'Không', 'Không', 'Không', 'Không', NOW(), 0),
  ('c3333333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777', 'Nguyễn Minh Long', 'BN-002185', 'Việt Nam', 'Đà Nẵng', 'Nhân viên văn phòng', '0903456789', '001088000003', 'long.nguyen@patient.clinic.vn', 'MALE', TIMESTAMP '1989-12-05 00:00:00', '25 Nguyễn Văn Linh, Đà Nẵng', 'Không', 'Không', 'Không', 'Không', NOW(), 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO rooms (id, room_name, floor_name, create_at)
VALUES
  ('f1111111-1111-1111-1111-111111111111', 'Phòng khám 01', 'Tầng 1', NOW()),
  ('f2222222-2222-2222-2222-222222222222', 'Phòng chỉnh nha 02', 'Tầng 2', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO appointments (id, patient_id, patient_name, phone, dentist_id, employee_id, appointment_date, appointment_time, reason, attribute, status, notes, diagnosis, symptoms, treatment_notes, reminded_1day, reminded_1hour, room_id, created_at, version)
VALUES
  ('d1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Tâm Thành Nguyễn', '0343632524', 'a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE - INTERVAL '6 days' + TIME '08:00:00', 'Cạo vôi răng & Đánh bóng', 'Khám trực tiếp tại phòng khám', 'COMPLETED', 'Đã đặt trước qua hotline', 'Vôi răng độ 1', 'Mảng bám bề mặt răng', 'Đã cạo vôi 2 hàm', FALSE, FALSE, 'f1111111-1111-1111-1111-111111111111', NOW(), 0),
  ('d2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'Lê Thị Hương', '0901112233', 'a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '5 days' + TIME '10:00:00', 'Trám răng composite R24', 'Khám trực tiếp tại phòng khám', 'COMPLETED', 'Đã check-in', 'Sâu răng độ 1 R24', 'Ê buốt nhẹ', 'Tiến hành trám composite', FALSE, FALSE, 'f2222222-2222-2222-2222-222222222222', NOW(), 0),
  ('d3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'Nguyễn Minh Long', '0903456789', 'a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '4 days', CURRENT_DATE - INTERVAL '4 days' + TIME '09:00:00', 'Nhổ răng khôn R38', 'Khám trực tiếp tại phòng khám', 'COMPLETED', 'Đã chụp X-quang Pano', 'Răng khôn mọc lệch 90 độ', 'Đau sưng lợi vùng R38', 'Phẫu thuật nhổ răng khôn', FALSE, FALSE, 'f1111111-1111-1111-1111-111111111111', NOW(), 0),
  ('d4444444-4444-4444-4444-444444444444', 'c1111111-1111-1111-1111-111111111111', 'Tâm Thành Nguyễn', '0343632524', 'a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE - INTERVAL '3 days' + TIME '13:00:00', 'Nhổ răng sâu độ 3', 'Khám trực tiếp tại phòng khám', 'COMPLETED', 'Nhổ răng hàm dưới', 'Răng sâu hư vỡ lớn R46', 'Đau nhức sưng tấy', 'Tiến hành nhổ răng an toàn', FALSE, FALSE, 'f2222222-2222-2222-2222-222222222222', NOW(), 0),
  ('d5555555-5555-5555-5555-555555555555', 'c2222222-2222-2222-2222-222222222222', 'Lê Thị Hương', '0901112233', 'a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE - INTERVAL '2 days' + TIME '08:00:00', 'Tư vấn niềng răng mắc cài', 'Khám trực tiếp tại phòng khám', 'IN_PROGRESS', 'Muốn tư vấn mắc cài kim loại', 'Khớp cắn ngược độ 1', 'Chen chúc hàm dưới', 'Lên phác đồ niềng răng', FALSE, FALSE, 'f1111111-1111-1111-1111-111111111111', NOW(), 0),
  ('d6666666-6666-6666-6666-666666666666', 'c3333333-3333-3333-3333-333333333333', 'Nguyễn Minh Long', '0903456789', 'a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE - INTERVAL '1 day' + TIME '09:00:00', 'Cạo vôi răng & Đánh bóng', 'Khám trực tiếp tại phòng khám', 'COMPLETED', 'Hẹn tái khám 6 tháng', 'Vôi răng độ 2', 'Chảy máu chân răng', 'Đã xử lý sạch vôi răng', FALSE, FALSE, 'f2222222-2222-2222-2222-222222222222', NOW(), 0),
  ('d7777777-7777-7777-7777-777777777777', 'c1111111-1111-1111-1111-111111111111', 'Tâm Thành Nguyễn', '0343632524', 'a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', CURRENT_DATE, CURRENT_DATE + TIME '09:00:00', 'Tư vấn niềng răng Invisalign', 'Khám trực tiếp tại phòng khám', 'WAITING', 'Bệnh nhân có nhu cầu niềng răng', 'Khớp cắn lệch nhẹ', 'Răng thưa 2 hàm', 'Tư vấn phác đồ Invisalign 18 tháng', FALSE, FALSE, 'f1111111-1111-1111-1111-111111111111', NOW(), 0),
  ('d8888888-8888-8888-8888-888888888888', 'c2222222-2222-2222-2222-222222222222', 'Lê Thị Hương', '0901112233', 'a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', CURRENT_DATE, CURRENT_DATE + TIME '10:00:00', 'Nhổ răng khôn R48', 'Khám trực tiếp tại phòng khám', 'COMPLETED', 'Răng khôn mọc lệch', 'Răng khôn mọc kẹt R48', 'Đau sưng lợi', 'Đã tiến hành nhổ răng an toàn', FALSE, FALSE, 'f2222222-2222-2222-2222-222222222222', NOW(), 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO appointment_requests (id, full_name, phone, description, create_at, statust_appointment_request, employee_id, version)
VALUES
  ('e1111111-1111-1111-1111-111111111111', 'Tâm Thành Nguyễn', '0343632524', 'Tư vấn niềng răng trong suốt', NOW(), 'COMPLETED', 'b1111111-1111-1111-1111-111111111111', 0),
  ('e2222222-2222-2222-2222-222222222222', 'Trịnh Hoàng Anh', '0922333444', 'Đặt lịch cạo vôi răng buổi chiều', NOW(), 'PENDING', 'b1111111-1111-1111-1111-111111111111', 0)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- BẢNG 1: SERVICES (Dịch vụ nha khoa)
-- ============================================================
INSERT INTO services (
    id, service_name, description, price, category, sub_category, unit, image_url, sort_order, is_featured,
    service_code, cost_price, estimated_duration, sessions_count, warranty_period, is_active
)
SELECT seed.id::uuid, seed.service_name, seed.description, seed.price, seed.category, seed.sub_category,
       seed.unit, seed.image_url, seed.sort_order, seed.is_featured,
       'SVC-' || UPPER(REPLACE(seed.id::text, '-', '')), seed.price, 60, '1 buổi', 'Không', TRUE
FROM (VALUES

  -- ── NIỀNG RĂNG MẮC CÀI KIM LOẠI ─────────────────────────
  (
    'c3b2f674-d4b9-4a06-a795-9bf8b5c907a1',
    'Mắc cài kim loại tiêu chuẩn',
    'Phương pháp niềng răng truyền thống sử dụng mắc cài kim loại cao cấp và dây cung. Hiệu quả cao, bền bỉ và phù hợp cho hầu hết các ca lệch lạc từ trung bình đến phức tạp.',
    25000000.00, 'NIENG_RANG', 'Niềng răng mắc cài kim loại', 'Cả 2 hàm',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80', 1, true
  ),
  (
    'e290f674-d4b9-4a06-a795-9bf8b5c907a2',
    'Mắc cài kim loại tự buộc (Damon)',
    'Hệ thống mắc cài tự đóng thông minh giúp giảm tối đa lực ma sát lên răng, giảm ê nhức đáng kể và rút ngắn tổng thời gian đeo niềng từ 4-6 tháng.',
    35000000.00, 'NIENG_RANG', 'Niềng răng mắc cài kim loại', 'Cả 2 hàm',
    'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=600&q=80', 2, true
  ),
  (
    'f1a3f674-d4b9-4a06-a795-9bf8b5c907a3',
    'Niềng răng mắc cài kim loại trẻ em',
    'Thiết kế mắc cài nhỏ gọn phù hợp với kích thước răng trẻ em từ 8-14 tuổi. Giúp định hướng răng vĩnh viễn mọc đều đẹp ngay từ giai đoạn sớm.',
    20000000.00, 'NIENG_RANG', 'Niềng răng mắc cài kim loại', 'Cả 2 hàm',
    'https://images.unsplash.com/photo-1513415277900-a62401e5084d?auto=format&fit=crop&w=600&q=80', 3, false
  ),
  (
    'a982f674-e3c9-4b17-b806-ab8c9c0d11f1',
    'Gói can thiệp sớm các lệch lạc tiền tăng trưởng - 2 năm (Trẻ em)',
    'Can thiệp sớm các lệch lạc răng mặt ở trẻ em giúp định hướng xương hàm phát triển hài hòa, tạo khoảng trống cho răng vĩnh viễn mọc đúng vị trí, giảm thiểu tối đa việc phải nhổ răng hay phẫu thuật xương hàm sau này.',
    17000000.00, 'NIENG_RANG', 'Niềng răng mắc cài kim loại', 'Gói 2 năm',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80', 4, true
  ),

  -- ── NIỀNG RĂNG MẮC CÀI SỨ ───────────────────────────────
  (
    'd4b4f674-d4b9-4a06-a795-9bf8b5c907a4',
    'Mắc cài sứ tiêu chuẩn',
    'Mắc cài làm bằng chất liệu sứ cao cấp trùng tông màu răng thật, mang lại tính thẩm mỹ cao giúp khách hàng tự tin giao tiếp trong suốt quá trình niềng.',
    32000000.00, 'NIENG_RANG', 'Niềng răng mắc cài sứ', 'Cả 2 hàm',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80', 5, false
  ),
  (
    'a101f674-f2a9-4c28-c917-bc9d9c0e21a1',
    'Mắc cài sứ tự buộc',
    'Sự kết hợp hoàn hảo giữa tính thẩm mỹ của chất liệu sứ cao cấp và sự tiện lợi của cơ chế nắp đóng tự buộc Damon.',
    42000000.00, 'NIENG_RANG', 'Niềng răng mắc cài sứ', 'Cả 2 hàm',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80', 6, true
  ),

  -- ── NIỀNG RĂNG TRONG SUỐT INVISALIGN ────────────────────
  (
    'b202f674-f2a9-4c28-c917-bc9d9c0e22b2',
    'Invisalign Lite (<= 14 khay)',
    'Phương pháp niềng răng trong suốt không mắc cài của Mỹ. Thích hợp cho các ca răng thưa, lệch lạc nhẹ hoặc khách hàng cần căn chỉnh lại sau khi niềng.',
    55000000.00, 'NIENG_RANG', 'Niềng răng trong suốt Invisalign', 'Cả 2 hàm',
    'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=600&q=80', 7, false
  ),
  (
    'e606f674-f2a9-4c28-c917-bc9d9c0e26f7',
    'Gói niềng trong suốt Essentials by Invisalign',
    'Gói niềng răng trong suốt Invisalign cơ bản bao gồm bộ khay niềng thiết kế riêng, hỗ trợ dịch chuyển các ca răng khấp khểnh nhẹ.',
    65000000.00, 'NIENG_RANG', 'Niềng răng trong suốt Invisalign', 'Trọn gói',
    'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=600&q=80', 8, true
  ),
  (
    'c303f674-f2a9-4c28-c917-bc9d9c0e23c3',
    'Invisalign Moderate',
    'Gói niềng răng Invisalign phổ thông phù hợp với các ca răng khấp khểnh ở mức độ trung bình. Cần từ 15 đến 26 khay điều trị.',
    70000000.00, 'NIENG_RANG', 'Niềng răng trong suốt Invisalign', 'Cả 2 hàm',
    'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=600&q=80', 9, true
  ),
  (
    'e606f674-f2a9-4c28-c917-bc9d9c0e26f8',
    'Gói niềng trong suốt Invisalign Comprehensive 5 năm',
    'Gói niềng răng trong suốt Invisalign toàn diện nhất, hỗ trợ điều trị và tinh chỉnh không giới hạn khay trong vòng 5 năm.',
    130000000.00, 'NIENG_RANG', 'Niềng răng trong suốt Invisalign', 'Trọn gói 5 năm',
    'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=600&q=80', 10, true
  ),
  (
    'e505f674-f2a9-4c28-c917-bc9d9c0e25e5',
    'Niềng răng trong suốt ClearCorrect',
    'Thương hiệu khay niềng trong suốt cao cấp từ tập đoàn Straumann (Thụy Sĩ). Vật liệu ComfortTrack siêu đàn hồi, ôm sát nướu răng và thẩm mỹ tối đa.',
    45000000.00, 'NIENG_RANG', 'Niềng răng trong suốt Invisalign', 'Cả 2 hàm',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80', 11, false
  ),
  (
    'f606f674-f2a9-4c28-c917-bc9d9c0e26f6',
    'Hàm duy trì sau niềng',
    'Hàm duy trì trong suốt tháo lắp giúp ổn định xương ổ răng và nướu sau khi kết thúc liệu trình niềng răng, ngăn ngừa răng chạy lại vị trí cũ.',
    5000000.00, 'NIENG_RANG', 'Niềng răng trong suốt Invisalign', 'Cả 2 hàm',
    'https://images.unsplash.com/photo-1513415277900-a62401e5084d?auto=format&fit=crop&w=600&q=80', 12, false
  ),

  -- ── TRỒNG RĂNG IMPLANT ────────────────────────────────────
  (
    '1a01f674-e3c9-4b17-b806-ab8c9c0d31a1',
    'Implant Osstem (Hàn Quốc)',
    'Dòng trụ Implant quốc dân có doanh số hàng đầu châu Á. Tỷ lệ tích hợp xương cao, thiết kế ren xoắn thông minh.',
    19000000.00, 'IMPLANT', 'Trụ Implant theo hãng', '/trụ',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80', 13, true
  ),
  (
    '2b02f674-e3c9-4b17-b806-ab8c9c0d32b2',
    'Implant Zimmer Biomet (Mỹ)',
    'Dòng trụ phân khúc cao cấp của Mỹ, công nghệ Trabecular Metal giúp tế bào xương phát triển nhanh vào sâu thân trụ.',
    32000000.00, 'IMPLANT', 'Trụ Implant theo hãng', '/trụ',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80', 14, false
  ),
  (
    '3c03f674-e3c9-4b17-b806-ab8c9c0d33c3',
    'Implant Straumann SLA (Thụy Sĩ)',
    'Thương hiệu Implant số 1 thế giới đến từ Thụy Sĩ. Bề mặt SLA rút ngắn thời gian tích hợp xương chỉ còn 6-8 tuần.',
    35000000.00, 'IMPLANT', 'Trụ Implant theo hãng', '/trụ',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80', 15, true
  ),
  (
    '4d04f674-e3c9-4b17-b806-ab8c9c0d34d4',
    'Implant Nobel Active (Thụy Điển)',
    'Trụ Implant cao cấp thiết kế cho xương hàm mỏng hoặc cấy ghép phục hình chịu lực tức thì ngay sau khi nhổ răng.',
    38000000.00, 'IMPLANT', 'Trụ Implant theo hãng', '/trụ',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80', 16, true
  ),
  (
    '5e05f674-e3c9-4b17-b806-ab8c9c0d35e5',
    'Răng sứ Zirconia trên Implant',
    'Mão răng toàn sứ Zirconia lắp trên trụ phục hình qua khớp nối Abutment. Không đen viền nướu, màu sắc tự nhiên hoàn hảo.',
    6000000.00, 'IMPLANT', 'Phục hình trên Implant', '/răng',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80', 17, false
  ),
  (
    '6f06f674-e3c9-4b17-b806-ab8c9c0d36f6',
    'Cầu răng sứ trên 2 Implant',
    'Giải pháp kinh tế phục hình mất 3-4 răng liền kề bằng cách cấy 2 trụ Implant nâng đỡ cầu răng sứ bên trên.',
    16000000.00, 'IMPLANT', 'Phục hình trên Implant', '/cầu',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80', 18, false
  ),
  (
    '7a07f674-e3c9-4b17-b806-ab8c9c0d37a7',
    'Phục hình toàn hàm All-on-4',
    'Cấy ghép 4 trụ Implant nâng đỡ toàn bộ cung răng giả 12 răng. Giải pháp tối ưu cho người mất răng toàn hàm hoặc tiêu xương nặng.',
    120000000.00, 'IMPLANT', 'Phục hình trên Implant', '/hàm',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80', 19, true
  ),
  (
    '8b08f674-e3c9-4b17-b806-ab8c9c0d38b8',
    'Phục hình toàn hàm All-on-6',
    'Cấy ghép 6 trụ Implant tăng cường lực ăn nhai cho cung hàm lớn hoặc xương hàm có mật độ xốp.',
    145000000.00, 'IMPLANT', 'Phục hình trên Implant', '/hàm',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80', 20, false
  ),

  -- ── RĂNG SỨ THẨM MỸ ──────────────────────────────────────
  (
    '1a01f674-4b9a-4c28-c917-bc9d9c0e31a1',
    'Sứ kim loại tiêu chuẩn',
    'Răng sứ có cấu tạo sườn kim loại bên trong và phủ lớp sứ ceramco bên ngoài. Độ bền ăn nhai tốt, chi phí tiết kiệm.',
    2000000.00, 'RANG_SU', 'Răng sứ kim loại', '/răng',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80', 21, false
  ),
  (
    '2b02f674-4b9a-4c28-c917-bc9d9c0e32b2',
    'Sứ kim loại Titan cao cấp',
    'Sườn bằng hợp kim Titan y tế sinh học lành tính, giảm kích ứng nướu và tăng tuổi thọ sử dụng.',
    3500000.00, 'RANG_SU', 'Răng sứ kim loại', '/răng',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80', 22, false
  ),
  (
    '3c03f674-4b9a-4c28-c917-bc9d9c0e33c3',
    'Sứ Cercon (Đức)',
    'Dòng răng toàn sứ cao cấp Đức bằng Zirconia nguyên khối. Độ thấu quang cao, không đen viền nướu.',
    6500000.00, 'RANG_SU', 'Răng sứ toàn sứ (Ceramic)', '/răng',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80', 23, true
  ),
  (
    '4d04f674-4b9a-4c28-c917-bc9d9c0e34d4',
    'Sứ e.max (Thụy Sĩ)',
    'Sứ thủy tinh e.max nguyên khối có độ trong mờ tự nhiên như răng thật. Khả năng chịu lực uốn xuất sắc lên tới 400 MPa.',
    8500000.00, 'RANG_SU', 'Răng sứ toàn sứ (Ceramic)', '/răng',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80', 24, true
  ),
  (
    '5e05f674-4b9a-4c28-c917-bc9d9c0e35e5',
    'Sứ Zirconia nguyên khối',
    'Chế tác bằng công nghệ CAD/CAM. Độ cứng siêu việt lên đến 1200 MPa, thích hợp phục hình răng hàm chịu lực lớn.',
    7000000.00, 'RANG_SU', 'Răng sứ toàn sứ (Ceramic)', '/răng',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80', 25, false
  ),
  (
    '6f06f674-4b9a-4c28-c917-bc9d9c0e36f6',
    'Mặt dán sứ Veneer Composite',
    'Cải thiện thẩm mỹ nụ cười nhanh chóng bằng cách phủ lớp nhựa composite thẩm mỹ lên bề mặt răng thật.',
    3000000.00, 'RANG_SU', 'Răng Veneer thẩm mỹ', '/răng',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80', 26, false
  ),
  (
    '7a07f674-4b9a-4c28-c917-bc9d9c0e37a7',
    'Mặt dán sứ Veneer e.max siêu mỏng',
    'Mặt dán sứ siêu mỏng chỉ từ 0.3mm - 0.5mm, bảo tồn 100% tủy răng và hạn chế tối đa mài răng thật.',
    9000000.00, 'RANG_SU', 'Răng Veneer thẩm mỹ', '/răng',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80', 27, true
  ),

  -- ── TẨY TRẮNG RĂNG ───────────────────────────────────────
  (
    '1a01f674-1234-4c28-c917-bc9d9c0e41a1',
    'Tẩy trắng răng đèn Plasma',
    'Ánh sáng xanh Plasma hoạt hóa gel tẩy trắng. Hiệu quả nhanh sau 60 phút tại phòng khám.',
    1500000.00, 'TAY_TRANG', 'Tẩy trắng tại phòng khám', '/lần',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80', 28, false
  ),
  (
    '2b02f674-1234-4c28-c917-bc9d9c0e42b2',
    'Gói tẩy trắng Laser Whitening trọn gói',
    'Bước sóng Laser phá hủy phân tử tạo màu tận sâu ngà răng, kết hợp máng và gel tẩy trắng duy trì tại nhà.',
    2500000.00, 'TAY_TRANG', 'Tẩy trắng tại phòng khám', 'Liệu trình',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80', 29, true
  ),
  (
    '3c03f674-1234-4c28-c917-bc9d9c0e43c3',
    'Tẩy trắng răng Zoom 2 (Mỹ)',
    'Hệ thống tẩy trắng hàng đầu Hoa Kỳ với đèn Zoom phát nhiệt thấp. Nâng tông tối đa từ 6-8 cấp độ sáng an toàn.',
    3500000.00, 'TAY_TRANG', 'Tẩy trắng tại phòng khám', '/lần',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80', 30, true
  ),
  (
    '4d04f674-1234-4c28-c917-bc9d9c0e44d4',
    'Bộ máng tẩy trắng tại nhà',
    'Máng nhựa dẻo ôm khít răng kèm thuốc tẩy trắng nồng độ nhẹ. Tiện lợi tự tẩy tại nhà.',
    800000.00, 'TAY_TRANG', 'Tẩy trắng tại nhà', '/bộ',
    'https://images.unsplash.com/photo-1513415277900-a62401e5084d?auto=format&fit=crop&w=600&q=80', 31, false
  ),
  (
    '5e05f674-1234-4c28-c917-bc9d9c0e45e5',
    'Gel tẩy trắng bổ sung Opalescence',
    'Tuýp gel tẩy trắng chính hãng Opalescence (Mỹ) nồng độ 10%-20% dùng tra thêm vào máng duy trì tẩy trắng định kỳ.',
    250000.00, 'TAY_TRANG', 'Tẩy trắng tại nhà', '/tuýp',
    'https://images.unsplash.com/photo-1513415277900-a62401e5084d?auto=format&fit=crop&w=600&q=80', 32, false
  ),

  -- ── KHÁM & ĐIỀU TRỊ TỔNG QUÁT ───────────────────────────
  (
    '1a01f674-5678-4c28-c917-bc9d9c0e51a1',
    'Khám răng tổng quát & tư vấn chuyên sâu',
    'Kiểm tra toàn diện sức khỏe răng miệng: khám lợi, kiểm tra sâu răng, phát hiện bệnh lý nha chu. Miễn phí.',
    0.00, 'KHAM_DIEU_TRI', 'Khám & Chẩn đoán', '/lần',
    'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=600&q=80', 33, true
  ),
  (
    '2b02f674-5678-4c28-c917-bc9d9c0e52b2',
    'Chụp X-quang toàn cảnh Panorama',
    'Máy chụp kỹ thuật số hiện đại khảo sát toàn bộ cấu trúc xương hàm, răng và dây thần kinh.',
    200000.00, 'KHAM_DIEU_TRI', 'Khám & Chẩn đoán', '/lần',
    'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=600&q=80', 34, false
  ),
  (
    '3c03f674-5678-4c28-c917-bc9d9c0e53c3',
    'Chụp X-quang CBCT 3D khảo sát xương',
    'Công nghệ cắt lớp vi tính 3D chi tiết xương hàm, phục vụ cấy ghép Implant và nhổ răng khôn lệch.',
    450000.00, 'KHAM_DIEU_TRI', 'Khám & Chẩn đoán', '/lần',
    'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=600&q=80', 35, false
  ),
  (
    '4d04f674-5678-4c28-c917-bc9d9c0e54d4',
    'Lấy cao răng siêu âm & đánh bóng',
    'Đầu rung siêu âm loại bỏ hoàn toàn mảng bám dưới nướu gây viêm lợi, kết hợp đánh bóng bột nha khoa cao cấp.',
    300000.00, 'KHAM_DIEU_TRI', 'Điều trị cơ bản', '/lần',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80', 36, true
  ),
  (
    '5e05f674-5678-4c28-c917-bc9d9c0e55e5',
    'Trám răng thẩm mỹ Composite',
    'Trám khôi phục hình dạng răng sâu nhẹ bằng chất liệu Composite đồng màu răng, hóa cứng bằng đèn Halogen.',
    400000.00, 'KHAM_DIEU_TRI', 'Điều trị cơ bản', '/răng',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80', 37, false
  ),
  (
    '6f06f674-5678-4c28-c917-bc9d9c0e56f6',
    'Điều trị tủy răng (Nội nha)',
    'Loại bỏ tủy răng viêm nhiễm, làm sạch ống tủy và trám bít kín. Bảo tồn tối đa cấu trúc răng thật.',
    1200000.00, 'KHAM_DIEU_TRI', 'Điều trị cơ bản', '/răng',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80', 38, false
  ),
  (
    '7a07f674-5678-4c28-c917-bc9d9c0e57a7',
    'Nhổ răng thường lung lay',
    'Nhổ răng nhẹ nhàng cho răng sữa đến tuổi thay hoặc răng vĩnh viễn lung lay nặng do viêm nha chu.',
    200000.00, 'KHAM_DIEU_TRI', 'Điều trị cơ bản', '/răng',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80', 39, false
  ),
  (
    '8b08f674-5678-4c28-c917-bc9d9c0e58b8',
    'Nhổ răng khôn mọc lệch bằng Piezotome',
    'Công nghệ sóng siêu âm Piezotome không gây tổn thương mô mềm, hạn chế đau đớn, sưng nề và lành thương siêu tốc.',
    1500000.00, 'KHAM_DIEU_TRI', 'Điều trị cơ bản', '/răng',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80', 40, true
  )
) AS seed(id, service_name, description, price, category, sub_category, unit, image_url, sort_order, is_featured)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- BẢNG 2: PROMOTIONS (Chương trình ưu đãi - 10 ưu đãi)
-- ============================================================
INSERT INTO promotions (
    id, title, category, description, image_url, discount_percent, start_date, end_date, created_at, updated_at,
    coupon_code, promotion_type, discount_amount, max_discount_amount, min_order_amount,
    usage_limit, used_count, apply_all_services, status
)
SELECT seed.id::uuid, seed.title, seed.category, seed.description, seed.image_url, seed.discount_percent,
       seed.start_date, seed.end_date, seed.created_at, seed.updated_at,
       CASE WHEN seed.promotion_type = 'VOUCHER'
            THEN 'PROMO-' || UPPER(REPLACE(seed.id::text, '-', ''))
            ELSE NULL
       END,
       seed.promotion_type, 0.00, 0.00, 0.00,
       100, 0, FALSE, 'ACTIVE'
FROM (VALUES
  -- 1. Giảm 10% — Niềng răng trẻ em
  ('ee11111a-aaaa-4b17-b806-ab8c9c0da001',
   'Gói can thiệp sớm các lệch lạc tiền tăng trưởng - 2 năm',
   'Niềng răng trẻ em',
   'Can thiệp sớm các lệch lạc răng mặt ở trẻ em giúp định hướng xương hàm phát triển hài hòa. Tạo khoảng trống cho răng vĩnh viễn mọc đúng vị trí, giảm thiểu tối đa việc phải nhổ răng hay phẫu thuật xương hàm sau này. Gói điều trị 2 năm toàn diện với đội ngũ bác sĩ chuyên khoa nhi nha.',
   'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
   10.00, NOW(), NOW() + INTERVAL '30 days', NOW(), NOW(), 'VOUCHER'),

  -- 2. Giảm 20% — ClearCorrect bổ sung
  ('ee22222b-bbbb-4b17-b806-ab8c9c0db002',
   'Khay ClearCorrect bổ sung - Tinh chỉnh hoàn hảo',
   'Niềng răng ClearCorrect',
   'Khay ClearCorrect bổ sung thiết kế riêng để tinh chỉnh và hoàn thiện các bước dịch chuyển răng cuối cùng. Đảm bảo kết quả nụ cười hoàn hảo nhất sau khi hoàn thành liệu trình chính. Ưu đãi áp dụng cho khách hàng đang điều trị tại Crown Dental.',
   'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=800&q=80',
   20.00, NOW(), NOW() + INTERVAL '30 days', NOW(), NOW(), 'VOUCHER'),

  -- 3. Giảm 20% — ClearCorrect duy trì
  ('ee33333c-cccc-4b17-b806-ab8c9c0dc003',
   'Hàm duy trì ClearCorrect - Ổn định kết quả niềng răng',
   'Niềng răng ClearCorrect',
   'Hàm duy trì ClearCorrect là khí cụ quan trọng sau khi kết thúc chỉnh nha, ổn định vị trí răng trong 6-12 tháng. Vật liệu cao cấp, trong suốt, thoải mái khi đeo và dễ vệ sinh. An toàn tiêu chuẩn y tế quốc tế.',
   'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=800&q=80',
   20.00, NOW(), NOW() + INTERVAL '30 days', NOW(), NOW(), 'VOUCHER'),

  -- 4. Giảm 20% — Invisalign bổ sung
  ('ee44444d-dddd-4b17-b806-ab8c9c0dd004',
   'Khay Invisalign bổ sung - Hoàn thiện nụ cười',
   'Niềng răng trong suốt Invisalign',
   'Khay Invisalign bổ sung tinh chỉnh các dịch chuyển răng nhỏ chưa đạt yêu cầu sau đợt khay chính thức. Công nghệ ClinCheck 3D theo dõi từng bước, đảm bảo hàm răng đạt độ đều khít hoàn hảo.',
   'https://images.unsplash.com/photo-1513415277900-a62401e5084d?auto=format&fit=crop&w=800&q=80',
   20.00, NOW(), NOW() + INTERVAL '30 days', NOW(), NOW(), 'VOUCHER'),

  -- 5. Giảm 15% — Invisalign Comprehensive
  ('ee55555e-eeee-4b17-b806-ab8c9c0de005',
   'Ưu đãi Niềng răng Invisalign - Hệ thống số 1 thế giới',
   'Niềng răng trong suốt Invisalign',
   'Niềng răng Invisalign với công nghệ khay trong suốt nhập khẩu từ Mỹ, điều trị cá nhân hóa 100% bằng phần mềm ClinCheck 3D. Ưu đãi 15% nhân dịp kỷ niệm thành lập Crown Dental. Crown là Red Diamond Invisalign Provider - cấp cao nhất toàn cầu với hơn 1.000 ca mỗi năm.',
   'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=800&q=80',
   15.00, NOW(), NOW() + INTERVAL '45 days', NOW(), NOW(), 'VOUCHER'),

  -- 6. Giảm 25% — Veneer e.max
  ('ee66666f-ffff-4b17-b806-ab8c9c0df006',
   'Răng sứ Veneer e.max thẩm mỹ - Nụ cười rạng rỡ tức thì',
   'Răng sứ thẩm mỹ',
   'Mặt dán sứ Veneer siêu mỏng chỉ 0.3-0.5mm, bảo tồn tối đa men răng thật. Đem lại nụ cười trắng sáng, tự nhiên và bền bỉ đến 15-20 năm. Ưu đãi 25% nhân dịp mùa cưới, áp dụng cho khách hàng đặt lịch trong tháng này.',
   'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=800&q=80',
   25.00, NOW(), NOW() + INTERVAL '45 days', NOW(), NOW(), 'EVENT'),

  -- 7. Giảm 10% — Implant Straumann
  ('ee77777a-aaab-4b17-b806-ab8c9c0d1007',
   'Trồng răng Implant Straumann - Phục hồi hoàn hảo như răng thật',
   'Cấy ghép Implant',
   'Cấy ghép Implant phục hồi toàn diện cả chân răng và thân răng, đảm bảo ăn nhai thoải mái và thẩm mỹ tự nhiên. Ưu đãi 10% cho khách hàng cấy ghép 2 trụ trở lên. Trụ Implant Straumann (Thụy Sĩ) nhập khẩu chính hãng, bảo hành 10 năm.',
   'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80',
   10.00, NOW(), NOW() + INTERVAL '60 days', NOW(), NOW(), 'EVENT'),

  -- 8. Giảm 30% — Tẩy trắng Zoom 2
  ('ee88888b-bbbc-4b17-b806-ab8c9c0d2008',
   'Tẩy trắng răng Zoom 2 - Sáng lên 8 tông chỉ trong 45 phút',
   'Tẩy trắng răng',
   'Công nghệ Zoom Laser thế hệ mới, nâng tông răng lên đến 8 tông chỉ sau 1 lần điều trị 45 phút. An toàn tuyệt đối cho men răng, không gây ê buốt. Ưu đãi 30% cho khách hàng mới đăng ký trong tháng. Tặng kèm bộ tẩy trắng tại nhà miễn phí trị giá 800.000đ.',
   'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
   30.00, NOW(), NOW() + INTERVAL '30 days', NOW(), NOW(), 'EVENT'),

  -- 9. Giảm 50% — Khám gia đình
  ('ee99999c-cccd-4b17-b806-ab8c9c0d3009',
   'Khám răng tổng quát - Ưu đãi đặc biệt cho gia đình',
   'Khám & Điều trị',
   'Khám răng tổng quát định kỳ bao gồm: chụp X-quang, lấy cao răng, kiểm tra sâu răng và tư vấn điều trị miễn phí. Ưu đãi 50% cho gói gia đình từ 3 người trở lên. Phát hiện sớm các vấn đề răng miệng, tiết kiệm tối đa chi phí điều trị.',
   'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=800&q=80',
   50.00, NOW(), NOW() + INTERVAL '45 days', NOW(), NOW(), 'EVENT'),

  -- 10. Giảm 15% — Nhổ răng khôn
  ('eeaaaaa1-ddde-4b17-b806-ab8c9c0d4010',
   'Nhổ răng khôn không đau - Hồi phục nhanh trong 24h',
   'Khám & Điều trị',
   'Nhổ răng khôn bằng máy siêu âm Piezotome thế hệ mới, không đau, không sưng, lành thương chỉ trong 24-48 giờ. Giảm 15% cho khách hàng nhổ đồng thời 2 răng khôn. Bác sĩ chuyên khoa phẫu thuật miệng giàu kinh nghiệm thực hiện.',
   'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
   15.00, NOW(), NOW() + INTERVAL '60 days', NOW(), NOW(), 'EVENT')
) AS seed(id, title, category, description, image_url, discount_percent, start_date, end_date, created_at, updated_at, promotion_type)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- BẢNG 3: PROMOTION_SERVICES (Liên kết ưu đãi ↔ dịch vụ)
-- ============================================================
-- Promotion assignments are managed explicitly through the admin API.
-- Do not restore removed assignments on every application startup.


-- ============================================================
-- BẢNG 4: MEDICINES (50 Thuốc nha khoa chuyên dụng)
-- ============================================================
INSERT INTO medicines (
    id, code, name, unit, manufacturer, stock_quantity, price, manufacture_date, expiry_date,
    description, usage_instruction, status, created_at, updated_at
)
SELECT seed.id::uuid, seed.code, seed.name, seed.unit, seed.manufacturer, seed.stock_quantity, seed.price,
       seed.manufacture_date::date, seed.expiry_date::date, seed.description,
       'Sử dụng theo chỉ định của bác sĩ', seed.status, seed.created_at, seed.updated_at
FROM (VALUES
  -- Nhóm 1: Kháng sinh điều trị nhiễm khuẩn răng miệng
  ('01a11111-1111-1111-1111-111111111101', 'MED-AMOX-500', 'Amoxicillin 500mg', 'Viên nang', 'Dược Hậu Giang (DHG)', 350, 2500.00, '2025-01-10', '2027-01-10', 'Kháng sinh phổ rộng nhóm Penicillin điều trị nhiễm trùng răng miệng, áp xe quanh cuống, viêm tủy cấp tính.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111102', 'MED-AUG-625', 'Augmentin 625mg', 'Viên nén bao phim', 'GlaxoSmithKline (GSK)', 180, 18500.00, '2025-02-15', '2027-02-15', 'Kháng sinh phối hợp Amoxicillin + Acid Clavulanic đặc trị nhiễm khuẩn răng hàm mặt nặng, viêm mô tế bào sau nhổ răng.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111103', 'MED-AUG-1000', 'Augmentin 1g', 'Viên nén bao phim', 'GlaxoSmithKline (GSK)', 120, 24000.00, '2025-03-01', '2027-03-01', 'Kháng sinh hàm lượng cao dùng cho các ca viêm quanh chóp răng lan rộng, nhiễm khuẩn sau phẫu thuật xương hàm.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111104', 'MED-CLAM-500', 'Clamoxyl 500mg', 'Viên nang', 'GlaxoSmithKline (GSK)', 150, 6000.00, '2024-11-20', '2026-11-20', 'Kháng sinh Amoxicillin tinh khiết, điều trị dự phòng viêm màng trong tim trước thủ thuật nhổ răng có chảy máu.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111105', 'MED-SPI-15M', 'Spiramycin 1.5 MUI (Rovamycine)', 'Viên nén bao phim', 'Sanofi Aventis', 200, 8500.00, '2025-01-05', '2027-01-05', 'Kháng sinh nhóm Macrolid thấm rất tốt vào mô nha chu và tuyến nước bọt, điều trị viêm nướu, viêm nha chu.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111106', 'MED-RODO-250', 'Rodogyl', 'Viên nén bao phim', 'Sanofi Aventis', 300, 7200.00, '2025-02-10', '2027-02-10', 'Phối hợp Spiramycin và Metronidazole, thuốc đầu tay điều trị nhiễm trùng răng miệng cấp và mạn tính, viêm nướu hoại tử lở loét.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111107', 'MED-METRO-250', 'Metronidazole 250mg (Klion)', 'Viên nén', 'Gedeon Richter', 250, 1800.00, '2024-10-15', '2026-10-15', 'Kháng sinh diệt vi khuẩn kỵ khí cực mạnh, đặc trị vi khuẩn gram âm trong viêm quanh cuống răng và túi mủ nha chu.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111108', 'MED-CLIN-300', 'Clindamycin 300mg (Dalacin C)', 'Viên nang', 'Pfizer', 90, 14000.00, '2025-01-18', '2027-01-18', 'Kháng sinh thâm nhập tốt vào mô xương, chỉ định thay thế hàng đầu khi bệnh nhân dị ứng Penicillin trong phẫu thuật cấy ghép Implant.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111109', 'MED-ZIN-500', 'Zinnat 500mg (Cefuroxime Axetil)', 'Viên nén bao phim', 'GlaxoSmithKline (GSK)', 110, 26500.00, '2025-04-01', '2027-04-01', 'Kháng sinh Cephalosporin thế hệ 2 điều trị nhiễm trùng xoang hàm trên có nguồn gốc do răng, viêm mô tế bào sau nhổ răng.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111110', 'MED-AZI-500', 'Azithromycin 500mg (Zithromax)', 'Viên nén bao phim', 'Pfizer', 80, 32000.00, '2025-03-10', '2027-03-10', 'Kháng sinh Macrolid bán thải dài, dùng phác đồ 3 ngày tiện lợi cho bệnh nhân viêm nha chu xâm lấn tiến triển nhanh.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111111', 'MED-CIPRO-500', 'Ciprofloxacin 500mg', 'Viên nén bao phim', 'Dược Hậu Giang (DHG)', 140, 3500.00, '2024-12-01', '2026-12-01', 'Kháng sinh nhóm Quinolon dùng trong các trường hợp nhiễm khuẩn răng miệng đề kháng, viêm xoang hàm phối hợp.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111112', 'MED-CEPH-500', 'Cephalexin 500mg', 'Viên nang', 'Mekophar', 180, 2000.00, '2024-09-10', '2026-09-10', 'Kháng sinh Cephalosporin thế hệ 1 dự phòng nhiễm khuẩn sau nhổ răng thông thường và tiểu phẫu nạo túi nha chu.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111113', 'MED-DOXY-100', 'Doxycycline 100mg', 'Viên nang', 'Dược Domesco', 160, 2800.00, '2025-02-01', '2027-02-01', 'Ức chế enzym collagenase mô nha chu, liều thấp hỗ trợ làm chậm tiêu xương ổ răng ở bệnh nhân viêm nha chu mạn.', 'ACTIVE', NOW(), NOW()),

  -- Nhóm 2: Giảm đau - Kháng viêm - Phù nề nha khoa
  ('01a11111-1111-1111-1111-111111111114', 'MED-PARA-500', 'Paracetamol 500mg', 'Viên nén', 'Dược Hậu Giang (DHG)', 500, 1000.00, '2025-01-01', '2028-01-01', 'Thuốc giảm đau hạ sốt mức độ nhẹ đến vừa sau nhổ răng thông thường, cạo vôi răng hoặc gắn khí cụ chỉnh nha.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111115', 'MED-PANADOL-EX', 'Panadol Extra', 'Viên nén đỏ', 'GlaxoSmithKline (GSK)', 400, 2200.00, '2025-02-05', '2027-08-05', 'Giảm đau răng cấp tốc, tăng cường hiệu quả giảm đau nhờ phối hợp Paracetamol 500mg và Caffeine 65mg.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111116', 'MED-EF-500', 'Efferalgan 500mg sủi', 'Viên sủi', 'UPSA SAS (Pháp)', 220, 4500.00, '2025-03-15', '2027-03-15', 'Thuốc sủi tan nhanh, hấp thu nhanh giảm đau nhức răng tức thì, phù hợp người đau răng khó nuốt viên nén.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111117', 'MED-EF-COD', 'Efferalgan Codeine', 'Viên sủi', 'UPSA SAS (Pháp)', 140, 8900.00, '2025-01-20', '2027-01-20', 'Phối hợp Paracetamol 500mg + Codein phosphate 30mg, giảm đau mức độ trung bình đến nặng sau phẫu thuật nhổ răng khôn mọc lệch.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111118', 'MED-IBU-400', 'Ibuprofen 400mg', 'Viên nén bao phim', 'Stella Pharm', 300, 2400.00, '2025-01-10', '2027-01-10', 'Thuốc kháng viêm không steroid (NSAID) giảm đau răng, sưng nướu cực kỳ hiệu quả sau khi chữa tủy và phẫu thuật nướu.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111119', 'MED-MELOX-75', 'Meloxicam 7.5mg', 'Viên nén', 'Boston Pharma', 150, 3200.00, '2025-02-25', '2027-02-25', 'Kháng viêm ức chế chọn lọc COX-2, giảm phù nề má và đau sau phẫu thuật cấy ghép Implant, ít tác dụng phụ dạ dày.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111120', 'MED-VOLT-50', 'Voltaren 50mg (Diclofenac)', 'Viên bao tan ruột', 'Novartis', 180, 7500.00, '2025-01-15', '2027-01-15', 'Kháng viêm giảm đau mạnh dùng trong các cơn đau tủy răng cấp dữ dội và sau phẫu thuật cắt chóp răng, nạo nang chân răng.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111121', 'MED-CELE-200', 'Celebrex 200mg (Celecoxib)', 'Viên nang', 'Pfizer', 120, 38000.00, '2025-03-01', '2027-03-01', 'Kháng viêm chọn lọc COX-2 cao cấp, kiểm soát đau và phù nề sau phẫu thuật chỉnh hình hàm mặt và nhổ nhiều răng khôn cùng lúc.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111122', 'MED-ALPHACHOAY', 'Alpha Choay (Alphachymotrypsin)', 'Viên ngậm', 'Sanofi Aventis', 450, 4200.00, '2025-02-01', '2027-02-01', 'Men kháng viêm chống phù nề dạng ngậm dưới lưỡi, chống bầm tím và sưng nề mô mềm sau phẫu thuật miệng.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111123', 'MED-KATADOL', 'Katrypsin (Chymotrypsin 4200 IU)', 'Viên nén', 'Dược Vacopharm', 250, 2500.00, '2024-11-15', '2026-11-15', 'Thuốc kháng viêm dạng men giảm tụ máu, giảm phù nề vùng niêm mạc miệng sau chấn thương hoặc nhổ răng tiểu phẫu.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111124', 'MED-PRED-5', 'Prednisolone 5mg', 'Viên nén', 'Dược Pharbaco', 200, 1200.00, '2025-01-12', '2027-01-12', 'Corticoid kháng viêm mạnh dùng ngắn ngày (2-3 ngày) trong các trường hợp sưng to sau mở xương nhổ răng khôn ngầm.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111125', 'MED-DEXA-05', 'Dexamethasone 0.5mg', 'Viên nén', 'Dược Hậu Giang (DHG)', 180, 800.00, '2024-10-20', '2026-10-20', 'Kháng viêm glucocorticoid chống phản ứng viêm dữ dội và co thắt mô hạt quanh cuống răng.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111126', 'MED-TRAMA-50', 'Tramadol 50mg', 'Viên nang', 'Stada Arzneimittel', 60, 9500.00, '2025-01-05', '2027-01-05', 'Thuốc giảm đau trung ương dùng trong các ca đau dữ dội sau phẫu thuật xương hàm phức tạp khi NSAIDs không đủ hiệu quả.', 'ACTIVE', NOW(), NOW()),

  -- Nhóm 3: Thuốc tê nha khoa tại chỗ & bôi tê
  ('01a11111-1111-1111-1111-111111111127', 'MED-LIDO-2', 'Lidocaine 2% with Epinephrine 1:100.000', 'Ống tiêm', 'Septodont (Pháp)', 250, 22000.00, '2025-02-20', '2027-02-20', 'Thuốc tê dạng ống nha khoa 1.8ml tiêu chuẩn, gây tê tiêm ngấm và gây tê vùng thần kinh hàm dưới, có co mạch giảm chảy máu.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111128', 'MED-SEPT-4', 'Septanest 4% with Adrenaline 1:100.000', 'Ống tiêm', 'Septodont (Pháp)', 200, 28000.00, '2025-03-05', '2027-03-05', 'Thuốc tê Articaine khuếch tán qua vỏ xương cực tốt, gây tê tủy răng êm ái, nhổ răng khó và cắm trụ Implant.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111129', 'MED-SCAN-3', 'Scandonest 3% Plain (Mepivacaine)', 'Ống tiêm', 'Septodont (Pháp)', 120, 26000.00, '2025-01-15', '2027-01-15', 'Thuốc tê không chứa chất co mạch (không Adrenaline), an toàn tuyệt đối cho bệnh nhân cao huyết áp, tim mạch, cường giáp.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111130', 'MED-XYLO-SPRAY', 'Xylocaine Spray 10%', 'Chai xịt', 'AstraZeneca', 15, 340000.00, '2024-12-10', '2026-12-10', 'Thuốc tê xịt bề mặt niêm mạc miệng chai 50ml, chống nôn khi lấy dấu răng và trước khi chích tê tại chỗ.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111131', 'MED-EMLA-5', 'EMLA Cream 5%', 'Tuýp', 'AstraZeneca', 25, 145000.00, '2025-02-10', '2027-02-10', 'Kem bôi tê bề mặt niêm mạc lợi (Lidocaine + Prilocaine) giảm đau khi chích kim gây tê cho trẻ em và người sợ đau.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111132', 'MED-BENZO-20', 'Benzocaine 20% Gel (Hurricaine)', 'Hũ', 'Beutlich Pharmaceuticals', 20, 285000.00, '2025-01-25', '2027-01-25', 'Gel bôi tê bề mặt tác dụng nhanh trong 30 giây vị anh đào dễ chịu, dùng trước khi tiêm tê và cạo vôi dưới nướu.', 'ACTIVE', NOW(), NOW()),

  -- Nhóm 4: Nước súc miệng & sát khuẩn khoang miệng
  ('01a11111-1111-1111-1111-111111111133', 'MED-KIN-GING', 'Nước súc miệng Kin Gingival 0.12%', 'Chai', 'Laboratorios KIN (Tây Ban Nha)', 80, 135000.00, '2025-03-12', '2028-03-12', 'Dung dịch súc miệng chứa Chlorhexidine Digluconate 0.12% và Alpantha, bảo vệ nướu răng, dự phòng viêm nha chu và phục hồi sau nhổ răng.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111134', 'MED-MEDORAL', 'Medoral Nước súc miệng 0.2%', 'Chai', 'Dược Merap', 90, 95000.00, '2025-02-18', '2028-02-18', 'Sát khuẩn họng miệng phổ rộng, ngừa mảng bám vi khuẩn sau phẫu thuật nha khoa, không gây cay rát niêm mạc.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111135', 'MED-BETA-GARG', 'Betadine Gargle & Mouthwash 1%', 'Chai', 'Mundipharma', 100, 75000.00, '2025-01-10', '2027-07-10', 'Dung dịch súc miệng diệt khuẩn, nấm và virus khoang miệng, dùng sát khuẩn miệng trước thủ thuật phẫu thuật.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111136', 'MED-POVI-10', 'Povidone Iodine 10%', 'Chai', 'Dược Pharmedic', 60, 25000.00, '2024-11-05', '2026-11-05', 'Dung dịch bôi sát trùng phẫu trường trong miệng và quanh môi trước khi cấy ghép Implant hoặc nhổ răng tiểu phẫu.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111137', 'MED-ELUDRIL', 'Eludril Classic Nước súc miệng', 'Chai', 'Pierre Fabre Medicament (Pháp)', 50, 140000.00, '2025-02-01', '2028-02-01', 'Phối hợp Chlorhexidine 0.10% và Chlorobutanol 0.5%, vừa kháng khuẩn vừa làm dịu cơn đau rát nướu răng.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111138', 'MED-NACL-09', 'Nước muối sinh lý NaCl 0.9%', 'Chai', 'Dược Vĩnh Phúc', 300, 8000.00, '2025-01-01', '2028-01-01', 'Dung dịch đẳng trương dùng rửa ổ răng sau nhổ, bơm rửa ống tủy răng và súc miệng vệ sinh răng miệng hằng ngày.', 'ACTIVE', NOW(), NOW()),

  -- Nhóm 5: Gel bôi nhiệt miệng, nha chu, vết loét
  ('01a11111-1111-1111-1111-111111111139', 'MED-KAMI-GEL', 'Kamistad Gel N 10g', 'Tuýp', 'STADA Arzneimittel (Đức)', 75, 52000.00, '2025-02-20', '2028-02-20', 'Chiết xuất hoa cúc kết hợp Lidocaine, giảm đau chống viêm loét niêm mạc miệng, nhiệt miệng, đau do đeo hàm giả hoặc niềng răng.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111140', 'MED-GENG-GEL', 'Gengigel Nha Chu 20ml', 'Tuýp', 'Ricerfarma (Ý)', 40, 290000.00, '2025-03-05', '2028-03-05', 'Gel sinh học Hyaluronic Acid 0.2% thúc đẩy lành thương nướu, tái tạo mô nha chu sau cạo vôi sâu và phẫu thuật lật vạt.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111141', 'MED-METRO-DENT', 'Metrogyl Denta Gel 10g', 'Tuýp', 'Unique Pharmaceutical Laboratories', 85, 48000.00, '2025-01-15', '2027-01-15', 'Phối hợp Metronidazole và Chlorhexidine dạng gel bôi nha chu, đặc trị viêm nướu chảy máu chân răng và viêm quanh thân răng khôn.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111142', 'MED-PERIO-GEL', 'Periokin Gel 30ml (Chlorhexidine 0.2%)', 'Tuýp', 'Laboratorios KIN (Tây Ban Nha)', 35, 165000.00, '2025-02-14', '2027-08-14', 'Gel bám dính sinh học kháng khuẩn tại chỗ quanh cổ Implant và túi lợi sâu, chống viêm quanh Implant.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111143', 'MED-ZYTEE-RB', 'Zytee RB Gel 10ml', 'Tuýp', 'Raptakos Brett', 60, 38000.00, '2024-10-10', '2026-10-10', 'Choline Salicylate giảm đau nhanh các vết trợt loét do cọ xát dây cung niềng răng trong vòng 3-4 phút.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111144', 'MED-ORACORTIA', 'Oracortia Mouthpaste (Triamcinolone 0.1%)', 'Gói', 'Mega Lifesciences', 150, 16000.00, '2025-01-10', '2027-01-10', 'Corticoid dạng mỡ dính niêm mạc điều trị loét aphthe tái phát nặng, viêm môi bong vảy do dị ứng.', 'ACTIVE', NOW(), NOW()),

  -- Nhóm 6: Thuốc cầm máu & hỗ trợ điều trị hậu phẫu
  ('01a11111-1111-1111-1111-111111111145', 'MED-SPONGO', 'Bọt xốp cầm máu Spongostan Dental', 'Hộp', 'Johnson & Johnson (Mỹ)', 30, 420000.00, '2024-12-05', '2027-12-05', 'Miếng xốp Gelatin cầm máu tự tiêu đặt vào huyệt ổ răng sau nhổ, giúp hình thành cục máu đông nhanh và chống chảy máu tái phát.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111146', 'MED-TRANS-500', 'Transamin 500mg (Acid Tranexamic)', 'Viên nén', 'Daiichi Sankyo', 100, 6800.00, '2025-01-20', '2027-01-20', 'Thuốc cầm máu chống tiêu Fibrin dùng đường uống trước và sau phẫu thuật nhổ răng phức tạp ở người có cơ địa dễ chảy máu.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111147', 'MED-BIOFLORA', 'Men vi sinh Bioflora 250mg', 'Gói', 'Biocodex (Pháp)', 120, 11500.00, '2025-03-01', '2027-03-01', 'Bổ sung nấm men Saccharomyces boulardii phòng ngừa tiêu chảy và rối loạn tiêu hóa khi uống kháng sinh nha khoa liều cao kéo dài.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111148', 'MED-OMEP-20', 'Omeprazole 20mg', 'Viên nang', 'Dược Hậu Giang (DHG)', 200, 2000.00, '2025-01-05', '2028-01-05', 'Ức chế bơm proton bảo vệ niêm mạc dạ dày khi kê đơn thuốc kháng viêm NSAIDs giảm đau sau phẫu thuật răng hàm mặt.', 'ACTIVE', NOW(), NOW()),
  ('01a11111-1111-1111-1111-111111111149', 'MED-VITC-500', 'Vitamin C 500mg', 'Viên nén', 'Dược Mekophar', 300, 1500.00, '2025-02-10', '2028-02-10', 'Tăng sức bền thành mạch, giảm chảy máu chân răng và tăng cường tổng hợp collagen làm nhanh lành thương nướu răng.', 'ACTIVE', NOW(), NOW()),
   ('01a11111-1111-1111-1111-111111111150', 'MED-ENAMELAST', 'Véc-ni Fluoride Enamelast 5% NaF', 'Tuýp', 'Ultradent Products (Mỹ)', 50, 85000.00, '2025-03-10', '2027-09-10', 'Vecni bôi phóng thích fluor kéo dài, đặc trị ê buốt cổ chân răng và ngừa sâu răng tái phát quanh mắc cài niềng răng.', 'ACTIVE', NOW(), NOW())
) AS seed(id, code, name, unit, manufacturer, stock_quantity, price, manufacture_date, expiry_date, description, status, created_at, updated_at)
ON CONFLICT (code) DO NOTHING;



-- ============================================================
-- RÀNG BUỘC QUAN TRỌNG: đặt sau toàn bộ dữ liệu seed
-- ============================================================

-- Không cho phép một bác sĩ có hai lịch đang hoạt động cùng thời điểm.
CREATE UNIQUE INDEX IF NOT EXISTS uk_dentist_active_timeslot
ON appointments (dentist_id, appointment_date, appointment_time)
WHERE status != 'CANCELLED';

-- Mỗi kết quả khám chỉ được gắn với một kế hoạch điều trị.
CREATE UNIQUE INDEX IF NOT EXISTS uk_treatment_plans_examination_result
ON treatment_plans (examination_result_id);

-- Không cho phép trùng mã thuốc.
CREATE UNIQUE INDEX IF NOT EXISTS uk_medicines_code
ON medicines (code);

-- Mỗi bệnh nhân chỉ có một quan hệ đang hoạt động với cùng đối tượng.
CREATE UNIQUE INDEX IF NOT EXISTS uq_patient_relationships_active_target
ON patient_relationships (related_patient_id)
WHERE status = true;

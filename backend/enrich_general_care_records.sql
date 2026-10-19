-- Bổ sung các bản ghi chăm sóc khách hàng phong phú, chuyên nghiệp cho toàn bộ bệnh nhân thật trong hệ thống
INSERT INTO customer_care_records (
    id, patient_id, care_type, channel, status, care_time, created_by_name, notes, created_at, updated_at
) VALUES 
(
    'c0000001-0000-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000003', -- Nguyễn Phương Linh (34352347 22)
    'GENERAL_CARE',
    'PHONE',
    'COMPLETED',
    '2026-10-15 14:30:00',
    'Nguyệt Nguyễn (CSKH)',
    'Gọi điện thăm hỏi sau tiểu phẫu nhổ 2 răng khôn hàm dưới. Bệnh nhân phản hồi vết mổ đã bớt sưng, ăn nhai nhẹ nhàng được, không sốt hay chảy máu.',
    NOW(), NOW()
),
(
    'c0000001-0000-0000-0000-000000000002',
    'a0000001-0000-0000-0000-000000000018', -- Hoàng Tuấn Anh (34352347 0)
    'GENERAL_CARE',
    'PHONE',
    'COMPLETED',
    '2026-10-15 15:10:00',
    'ThS. BS. Nguyễn Thị Phương',
    'Bác sĩ gọi điện kiểm tra tình trạng mô nướu sau phẫu thuật cấy ghép trụ Implant Straumann. Khách hàng tuân thủ hướng dẫn dùng kháng sinh và chườm lạnh.',
    NOW(), NOW()
),
(
    'c0000001-0000-0000-0000-000000000003',
    'a0000001-0000-0000-0000-000000000004', -- Trần Mỹ Duyên (34352345 58)
    'APPOINTMENT_REMINDER',
    'ZALO_SMS',
    'COMPLETED',
    '2026-10-15 16:00:00',
    'Hệ thống tự động',
    'Hệ thống tự động gửi tin nhắn Zalo ZNS nhắc lịch hẹn tái khám chỉnh nha định kỳ vào 08:30 ngày 16/10/2026 cùng BS. Hoàng Văn Tiến.',
    NOW(), NOW()
),
(
    'c0000001-0000-0000-0000-000000000004',
    'a0000001-0000-0000-0000-000000000007', -- Lê Bá Hùng (34352346 26)
    'APPOINTMENT_REMINDER',
    'PHONE',
    'COMPLETED',
    '2026-10-15 16:45:00',
    'Nguyễn Thảo (Lễ tân)',
    'Gọi điện nhắc lịch hẹn gắn mão sứ thẩm mỹ trên trụ Implant vào chiều Chủ nhật 18/10 lúc 14:00. Bệnh nhân xác nhận tham gia đúng giờ.',
    NOW(), NOW()
),
(
    'c0000001-0000-0000-0000-000000000005',
    'a0000001-0000-0000-0000-000000000010', -- Phạm Thị Thanh Hiền (34352347 17)
    'GENERAL_CARE',
    'PHONE',
    'COMPLETED',
    '2026-10-15 17:15:00',
    'Nguyệt Nguyễn (CSKH)',
    'Gọi điện hỏi thăm tình trạng sau khi cắt chỉ vết thương nhổ răng. Khách hàng khen bác sĩ thao tác nhẹ nhàng, không đau và rất hài lòng.',
    NOW(), NOW()
),
(
    'c0000001-0000-0000-0000-000000000006',
    'a0000001-0000-0000-0000-000000000008', -- Sơn Tùng (3435239)
    'GENERAL_CARE',
    'DIRECT',
    'COMPLETED',
    '2026-10-15 17:30:00',
    'Nguyễn Thảo (Lễ tân)',
    'Tư vấn trực tiếp tại quầy gói dán sứ Veneer Emax 16 răng và chính sách trả góp 0% liên kết các ngân hàng cho khách VIP.',
    NOW(), NOW()
),
(
    'c0000001-0000-0000-0000-000000000007',
    'a0000001-0000-0000-0000-000000000015', -- Nguyễn Linh Chi (343523463 6)
    'BIRTHDAY',
    'SMS',
    'COMPLETED',
    '2026-10-16 08:00:00',
    'Hệ thống tự động',
    'Gửi tin nhắn SMS Brandname chúc mừng sinh nhật khách hàng Nguyễn Linh Chi (20/10), tặng mã voucher ưu đãi 20% các dịch vụ thẩm mỹ răng miệng.',
    NOW(), NOW()
),
(
    'c0000001-0000-0000-0000-000000000008',
    'a0000001-0000-0000-0000-000000000013', -- Đỗ Duy Thắng (202207154 0)
    'BIRTHDAY',
    'PHONE',
    'COMPLETED',
    '2026-10-16 08:30:00',
    'Nguyễn Thảo (Lễ tân)',
    'Gọi điện chúc mừng sinh nhật khách hàng Đỗ Duy Thắng (sinh nhật 25/10), tặng gói cạo vôi răng miễn phí và giảm 15% cho người thân đi cùng.',
    NOW(), NOW()
),
(
    'c0000001-0000-0000-0000-000000000009',
    'ccd5e6de-85c3-4b2c-adb2-e74bc8909f5d', -- Lê Minh Tâm (PA-001)
    'APPOINTMENT_REMINDER',
    'PHONE',
    'RECARE',
    '2026-10-16 08:45:00',
    'Nguyễn Thảo (Lễ tân)',
    'Gọi nhắc lịch hẹn điều trị tủy răng số 46. Khách hàng đang bận lái xe chưa nghe máy, hẹn gọi lại vào đầu giờ chiều lúc 14:00.',
    NOW(), NOW()
),
(
    'c0000001-0000-0000-0000-000000000010',
    '10000000-0000-0000-0000-000000000002', -- Tran Thi Bich (PAT-0002)
    'GENERAL_CARE',
    'PHONE',
    'COMPLETED',
    '2026-10-16 09:00:00',
    'Nguyệt Nguyễn (CSKH)',
    'Gọi điện hỏi thăm cảm nhận sau 1 tuần gắn khí cụ duy trì chỉnh nha. Khách hàng thích ứng tốt, vệ sinh răng miệng đúng theo chỉ dẫn.',
    NOW(), NOW()
)
ON CONFLICT (id) DO NOTHING;

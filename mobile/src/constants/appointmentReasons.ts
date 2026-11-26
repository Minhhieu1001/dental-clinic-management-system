export interface AppointmentReasonItem {
  id: string;
  reasonName: string;
  category: 'KHAM_DIEU_TRI' | 'NIENG_RANG' | 'IMPLANT' | 'RANG_SU' | 'TAY_TRANG';
  description: string;
  estimatedDuration: number;
}

export const REASON_CATEGORIES = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'KHAM_DIEU_TRI', label: 'Khám & Điều trị' },
  { key: 'NIENG_RANG', label: 'Niềng răng' },
  { key: 'IMPLANT', label: 'Cấy Implant' },
  { key: 'RANG_SU', label: 'Răng sứ' },
  { key: 'TAY_TRANG', label: 'Tẩy trắng' },
] as const;

export const BOOKABLE_SLOT_TIMES = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
  '17:30', '18:00', '18:30', '19:00', '19:30', '20:00',
];

export const APPOINTMENT_REASONS: AppointmentReasonItem[] = [
  { id: '1a01f674-5678-4c28-c917-bc9d9c0e51a1', reasonName: 'Khám răng tổng quát & tư vấn chuyên sâu', category: 'KHAM_DIEU_TRI', description: 'Kiểm tra toàn diện sức khỏe răng miệng, khám lợi, kiểm tra sâu răng và nha chu.', estimatedDuration: 30 },
  { id: '4d04f674-5678-4c28-c917-bc9d9c0e54d4', reasonName: 'Lấy cao răng siêu âm & đánh bóng', category: 'KHAM_DIEU_TRI', description: 'Loại bỏ hoàn toàn mảng bám dưới nướu kết hợp đánh bóng nha khoa.', estimatedDuration: 30 },
  { id: '5e05f674-5678-4c28-c917-bc9d9c0e55e5', reasonName: 'Trám răng thẩm mỹ Composite', category: 'KHAM_DIEU_TRI', description: 'Trám khôi phục hình dạng răng sâu nhẹ bằng chất liệu Composite đồng màu răng.', estimatedDuration: 30 },
  { id: '6f06f674-5678-4c28-c917-bc9d9c0e56f6', reasonName: 'Điều trị tủy răng (Nội nha)', category: 'KHAM_DIEU_TRI', description: 'Loại bỏ tủy viêm nhiễm, làm sạch ống tủy và bảo tồn cấu trúc răng thật.', estimatedDuration: 30 },
  { id: '8b08f674-5678-4c28-c917-bc9d9c0e58b8', reasonName: 'Nhổ răng khôn mọc lệch bằng Piezotome', category: 'KHAM_DIEU_TRI', description: 'Công nghệ sóng siêu âm Piezotome hạn chế đau sưng, lành thương nhanh.', estimatedDuration: 30 },
  { id: '2b02f674-5678-4c28-c917-bc9d9c0e52b2', reasonName: 'Chụp X-quang toàn cảnh Panorama', category: 'KHAM_DIEU_TRI', description: 'Khảo sát toàn bộ cấu trúc xương hàm, răng và dây thần kinh.', estimatedDuration: 30 },
  { id: 'c3b2f674-d4b9-4a06-a795-9bf8b5c907a1', reasonName: 'Mắc cài kim loại tiêu chuẩn', category: 'NIENG_RANG', description: 'Niềng răng truyền thống bền bỉ, hiệu quả cho các ca lệch lạc từ trung bình đến phức tạp.', estimatedDuration: 30 },
  { id: 'e290f674-d4b9-4a06-a795-9bf8b5c907a2', reasonName: 'Mắc cài kim loại tự buộc (Damon)', category: 'NIENG_RANG', description: 'Mắc cài tự đóng giảm lực ma sát, rút ngắn thời gian đeo niềng.', estimatedDuration: 30 },
  { id: 'd4b4f674-d4b9-4a06-a795-9bf8b5c907a4', reasonName: 'Mắc cài sứ thẩm mỹ', category: 'NIENG_RANG', description: 'Chất liệu sứ cao cấp trùng màu răng thật, tự tin giao tiếp.', estimatedDuration: 30 },
  { id: 'c303f674-f2a9-4c28-c917-bc9d9c0e23c3', reasonName: 'Niềng răng trong suốt Invisalign', category: 'NIENG_RANG', description: 'Khay niềng trong suốt tháo lắp linh hoạt, thẩm mỹ tối đa.', estimatedDuration: 30 },
  { id: '1a01f674-e3c9-4b17-b806-ab8c9c0d31a1', reasonName: 'Trụ Implant Osstem (Hàn Quốc)', category: 'IMPLANT', description: 'Dòng trụ Implant phổ biến hàng đầu châu Á, tỷ lệ tích hợp xương cao.', estimatedDuration: 30 },
  { id: '3c03f674-e3c9-4b17-b806-ab8c9c0d33c3', reasonName: 'Trụ Implant Straumann SLA (Thụy Sĩ)', category: 'IMPLANT', description: 'Thương hiệu Implant cao cấp Thụy Sĩ, tích hợp xương nhanh 6-8 tuần.', estimatedDuration: 30 },
  { id: '7a07f674-e3c9-4b17-b806-ab8c9c0d37a7', reasonName: 'Phục hình toàn hàm All-on-4 / All-on-6', category: 'IMPLANT', description: 'Giải pháp phục hồi toàn hàm cho người mất nhiều răng.', estimatedDuration: 30 },
  { id: '3c03f674-4b9a-4c28-c917-bc9d9c0e33c3', reasonName: 'Răng toàn sứ Cercon (Đức)', category: 'RANG_SU', description: 'Sứ Zirconia nguyên khối độ thấu quang cao, không đen viền nướu.', estimatedDuration: 30 },
  { id: '4d04f674-4b9a-4c28-c917-bc9d9c0e34d4', reasonName: 'Răng sứ thủy tinh e.max (Thụy Sĩ)', category: 'RANG_SU', description: 'Độ trong mờ tự nhiên như răng thật, chịu lực cao.', estimatedDuration: 30 },
  { id: '7a07f674-4b9a-4c28-c917-bc9d9c0e37a7', reasonName: 'Mặt dán sứ Veneer e.max siêu mỏng', category: 'RANG_SU', description: 'Siêu mỏng 0.3-0.5mm, bảo tồn tối đa mô răng thật.', estimatedDuration: 30 },
  { id: '2b02f674-1234-4c28-c917-bc9d9c0e42b2', reasonName: 'Gói tẩy trắng Laser Whitening trọn gói', category: 'TAY_TRANG', description: 'Kết hợp tẩy trắng Laser tại phòng khám và máng duy trì tại nhà.', estimatedDuration: 30 },
  { id: '3c03f674-1234-4c28-c917-bc9d9c0e43c3', reasonName: 'Tẩy trắng răng Zoom 2 (Mỹ)', category: 'TAY_TRANG', description: 'Đèn Zoom phát nhiệt thấp, nâng tông 6-8 cấp độ sáng an toàn.', estimatedDuration: 30 },
];

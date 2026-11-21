/**
 * DANH MUC DU LIEU TINH LY DO KHAM BENH
 * Dung truc tiep cho ca Patient va Employee
 */

export const APPOINTMENT_REASONS = [
  {
    "id": "c3b2f674-d4b9-4a06-a795-9bf8b5c907a1",
    "reasonName": "Mắc cài kim loại tiêu chuẩn",
    "category": "NIENG_RANG",
    "description": "Phương pháp niềng răng truyền thống sử dụng mắc cài kim loại cao cấp và dây cung. Hiệu quả cao, bền bỉ và phù hợp cho hầu hết các ca lệch lạc từ trung bình đến phức tạp.",
    "estimatedDuration": 30
  },
  {
    "id": "e290f674-d4b9-4a06-a795-9bf8b5c907a2",
    "reasonName": "Mắc cài kim loại tự buộc (Damon)",
    "category": "NIENG_RANG",
    "description": "Hệ thống mắc cài tự đóng thông minh giúp giảm tối đa lực ma sát lên răng, giảm ê nhức đáng kể và rút ngắn tổng thời gian đeo niềng từ 4-6 tháng.",
    "estimatedDuration": 30
  },
  {
    "id": "f1a3f674-d4b9-4a06-a795-9bf8b5c907a3",
    "reasonName": "Niềng răng mắc cài kim loại trẻ em",
    "category": "NIENG_RANG",
    "description": "Thiết kế mắc cài nhỏ gọn phù hợp với kích thước răng trẻ em từ 8-14 tuổi. Giúp định hướng răng vĩnh viễn mọc đều đẹp ngay từ giai đoạn sớm.",
    "estimatedDuration": 30
  },
  {
    "id": "a982f674-e3c9-4b17-b806-ab8c9c0d11f1",
    "reasonName": "Gói can thiệp sớm các lệch lạc tiền tăng trưởng - 2 năm (Trẻ em)",
    "category": "NIENG_RANG",
    "description": "Can thiệp sớm các lệch lạc răng mặt ở trẻ em giúp định hướng xương hàm phát triển hài hòa, tạo khoảng trống cho răng vĩnh viễn mọc đúng vị trí, giảm thiểu tối đa việc phải nhổ răng hay phẫu thuật xương hàm sau này.",
    "estimatedDuration": 30
  },
  {
    "id": "d4b4f674-d4b9-4a06-a795-9bf8b5c907a4",
    "reasonName": "Mắc cài sứ tiêu chuẩn",
    "category": "NIENG_RANG",
    "description": "Mắc cài làm bằng chất liệu sứ cao cấp trùng tông màu răng thật, mang lại tính thẩm mỹ cao giúp khách hàng tự tin giao tiếp trong suốt quá trình niềng.",
    "estimatedDuration": 30
  },
  {
    "id": "a101f674-f2a9-4c28-c917-bc9d9c0e21a1",
    "reasonName": "Mắc cài sứ tự buộc",
    "category": "NIENG_RANG",
    "description": "Sự kết hợp hoàn hảo giữa tính thẩm mỹ của chất liệu sứ cao cấp và sự tiện lợi của cơ chế nắp đóng tự buộc Damon.",
    "estimatedDuration": 30
  },
  {
    "id": "b202f674-f2a9-4c28-c917-bc9d9c0e22b2",
    "reasonName": "Invisalign Lite (<= 14 khay)",
    "category": "NIENG_RANG",
    "description": "Phương pháp niềng răng trong suốt không mắc cài của Mỹ. Thích hợp cho các ca răng thưa, lệch lạc nhẹ hoặc khách hàng cần căn chỉnh lại sau khi niềng.",
    "estimatedDuration": 30
  },
  {
    "id": "e606f674-f2a9-4c28-c917-bc9d9c0e26f7",
    "reasonName": "Gói niềng trong suốt Essentials by Invisalign",
    "category": "NIENG_RANG",
    "description": "Gói niềng răng trong suốt Invisalign cơ bản bao gồm bộ khay niềng thiết kế riêng, hỗ trợ dịch chuyển các ca răng khấp khểnh nhẹ.",
    "estimatedDuration": 30
  },
  {
    "id": "c303f674-f2a9-4c28-c917-bc9d9c0e23c3",
    "reasonName": "Invisalign Moderate",
    "category": "NIENG_RANG",
    "description": "Gói niềng răng Invisalign phổ thông phù hợp với các ca răng khấp khểnh ở mức độ trung bình. Cần từ 15 đến 26 khay điều trị.",
    "estimatedDuration": 30
  },
  {
    "id": "e606f674-f2a9-4c28-c917-bc9d9c0e26f8",
    "reasonName": "Gói niềng trong suốt Invisalign Comprehensive 5 năm",
    "category": "NIENG_RANG",
    "description": "Gói niềng răng trong suốt Invisalign toàn diện nhất, hỗ trợ điều trị và tinh chỉnh không giới hạn khay trong vòng 5 năm.",
    "estimatedDuration": 30
  },
  {
    "id": "e505f674-f2a9-4c28-c917-bc9d9c0e25e5",
    "reasonName": "Niềng răng trong suốt ClearCorrect",
    "category": "NIENG_RANG",
    "description": "Thương hiệu khay niềng trong suốt cao cấp từ tập đoàn Straumann (Thụy Sĩ). Vật liệu ComfortTrack siêu đàn hồi, ôm sát nướu răng và thẩm mỹ tối đa.",
    "estimatedDuration": 30
  },
  {
    "id": "f606f674-f2a9-4c28-c917-bc9d9c0e26f6",
    "reasonName": "Hàm duy trì sau niềng",
    "category": "NIENG_RANG",
    "description": "Hàm duy trì trong suốt tháo lắp giúp ổn định xương ổ răng và nướu sau khi kết thúc liệu trình niềng răng, ngăn ngừa răng chạy lại vị trí cũ.",
    "estimatedDuration": 30
  },
  {
    "id": "1a01f674-e3c9-4b17-b806-ab8c9c0d31a1",
    "reasonName": "Implant Osstem (Hàn Quốc)",
    "category": "IMPLANT",
    "description": "Dòng trụ Implant quốc dân có doanh số hàng đầu châu Á. Tỷ lệ tích hợp xương cao, thiết kế ren xoắn thông minh.",
    "estimatedDuration": 30
  },
  {
    "id": "2b02f674-e3c9-4b17-b806-ab8c9c0d32b2",
    "reasonName": "Implant Zimmer Biomet (Mỹ)",
    "category": "IMPLANT",
    "description": "Dòng trụ phân khúc cao cấp của Mỹ, công nghệ Trabecular Metal giúp tế bào xương phát triển nhanh vào sâu thân trụ.",
    "estimatedDuration": 30
  },
  {
    "id": "3c03f674-e3c9-4b17-b806-ab8c9c0d33c3",
    "reasonName": "Implant Straumann SLA (Thụy Sĩ)",
    "category": "IMPLANT",
    "description": "Thương hiệu Implant số 1 thế giới đến từ Thụy Sĩ. Bề mặt SLA rút ngắn thời gian tích hợp xương chỉ còn 6-8 tuần.",
    "estimatedDuration": 30
  },
  {
    "id": "4d04f674-e3c9-4b17-b806-ab8c9c0d34d4",
    "reasonName": "Implant Nobel Active (Thụy Điển)",
    "category": "IMPLANT",
    "description": "Trụ Implant cao cấp thiết kế cho xương hàm mỏng hoặc cấy ghép phục hình chịu lực tức thì ngay sau khi nhổ răng.",
    "estimatedDuration": 30
  },
  {
    "id": "5e05f674-e3c9-4b17-b806-ab8c9c0d35e5",
    "reasonName": "Răng sứ Zirconia trên Implant",
    "category": "IMPLANT",
    "description": "Mão răng toàn sứ Zirconia lắp trên trụ phục hình qua khớp nối Abutment. Không đen viền nướu, màu sắc tự nhiên hoàn hảo.",
    "estimatedDuration": 30
  },
  {
    "id": "6f06f674-e3c9-4b17-b806-ab8c9c0d36f6",
    "reasonName": "Cầu răng sứ trên 2 Implant",
    "category": "IMPLANT",
    "description": "Giải pháp kinh tế phục hình mất 3-4 răng liền kề bằng cách cấy 2 trụ Implant nâng đỡ cầu răng sứ bên trên.",
    "estimatedDuration": 30
  },
  {
    "id": "7a07f674-e3c9-4b17-b806-ab8c9c0d37a7",
    "reasonName": "Phục hình toàn hàm All-on-4",
    "category": "IMPLANT",
    "description": "Cấy ghép 4 trụ Implant nâng đỡ toàn bộ cung răng giả 12 răng. Giải pháp tối ưu cho người mất răng toàn hàm hoặc tiêu xương nặng.",
    "estimatedDuration": 30
  },
  {
    "id": "8b08f674-e3c9-4b17-b806-ab8c9c0d38b8",
    "reasonName": "Phục hình toàn hàm All-on-6",
    "category": "IMPLANT",
    "description": "Cấy ghép 6 trụ Implant tăng cường lực ăn nhai cho cung hàm lớn hoặc xương hàm có mật độ xốp.",
    "estimatedDuration": 30
  },
  {
    "id": "1a01f674-4b9a-4c28-c917-bc9d9c0e31a1",
    "reasonName": "Sứ kim loại tiêu chuẩn",
    "category": "RANG_SU",
    "description": "Răng sứ có cấu tạo sườn kim loại bên trong và phủ lớp sứ ceramco bên ngoài. Độ bền ăn nhai tốt, chi phí tiết kiệm.",
    "estimatedDuration": 30
  },
  {
    "id": "2b02f674-4b9a-4c28-c917-bc9d9c0e32b2",
    "reasonName": "Sứ kim loại Titan cao cấp",
    "category": "RANG_SU",
    "description": "Sườn bằng hợp kim Titan y tế sinh học lành tính, giảm kích ứng nướu và tăng tuổi thọ sử dụng.",
    "estimatedDuration": 30
  },
  {
    "id": "3c03f674-4b9a-4c28-c917-bc9d9c0e33c3",
    "reasonName": "Sứ Cercon (Đức)",
    "category": "RANG_SU",
    "description": "Dòng răng toàn sứ cao cấp Đức bằng Zirconia nguyên khối. Độ thấu quang cao, không đen viền nướu.",
    "estimatedDuration": 30
  },
  {
    "id": "4d04f674-4b9a-4c28-c917-bc9d9c0e34d4",
    "reasonName": "Sứ e.max (Thụy Sĩ)",
    "category": "RANG_SU",
    "description": "Sứ thủy tinh e.max nguyên khối có độ trong mờ tự nhiên như răng thật. Khả năng chịu lực uốn xuất sắc lên tới 400 MPa.",
    "estimatedDuration": 30
  },
  {
    "id": "5e05f674-4b9a-4c28-c917-bc9d9c0e35e5",
    "reasonName": "Sứ Zirconia nguyên khối",
    "category": "RANG_SU",
    "description": "Chế tác bằng công nghệ CAD/CAM. Độ cứng siêu việt lên đến 1200 MPa, thích hợp phục hình răng hàm chịu lực lớn.",
    "estimatedDuration": 30
  },
  {
    "id": "6f06f674-4b9a-4c28-c917-bc9d9c0e36f6",
    "reasonName": "Mặt dán sứ Veneer Composite",
    "category": "RANG_SU",
    "description": "Cải thiện thẩm mỹ nụ cười nhanh chóng bằng cách phủ lớp nhựa composite thẩm mỹ lên bề mặt răng thật.",
    "estimatedDuration": 30
  },
  {
    "id": "7a07f674-4b9a-4c28-c917-bc9d9c0e37a7",
    "reasonName": "Mặt dán sứ Veneer e.max siêu mỏng",
    "category": "RANG_SU",
    "description": "Mặt dán sứ siêu mỏng chỉ từ 0.3mm - 0.5mm, bảo tồn 100% tủy răng và hạn chế tối đa mài răng thật.",
    "estimatedDuration": 30
  },
  {
    "id": "1a01f674-1234-4c28-c917-bc9d9c0e41a1",
    "reasonName": "Tẩy trắng răng đèn Plasma",
    "category": "TAY_TRANG",
    "description": "Ánh sáng xanh Plasma hoạt hóa gel tẩy trắng. Hiệu quả nhanh sau 60 phút tại phòng khám.",
    "estimatedDuration": 30
  },
  {
    "id": "2b02f674-1234-4c28-c917-bc9d9c0e42b2",
    "reasonName": "Gói tẩy trắng Laser Whitening trọn gói",
    "category": "TAY_TRANG",
    "description": "Bước sóng Laser phá hủy phân tử tạo màu tận sâu ngà răng, kết hợp máng và gel tẩy trắng duy trì tại nhà.",
    "estimatedDuration": 30
  },
  {
    "id": "3c03f674-1234-4c28-c917-bc9d9c0e43c3",
    "reasonName": "Tẩy trắng răng Zoom 2 (Mỹ)",
    "category": "TAY_TRANG",
    "description": "Hệ thống tẩy trắng hàng đầu Hoa Kỳ với đèn Zoom phát nhiệt thấp. Nâng tông tối đa từ 6-8 cấp độ sáng an toàn.",
    "estimatedDuration": 30
  },
  {
    "id": "4d04f674-1234-4c28-c917-bc9d9c0e44d4",
    "reasonName": "Bộ máng tẩy trắng tại nhà",
    "category": "TAY_TRANG",
    "description": "Máng nhựa dẻo ôm khít răng kèm thuốc tẩy trắng nồng độ nhẹ. Tiện lợi tự tẩy tại nhà.",
    "estimatedDuration": 30
  },
  {
    "id": "5e05f674-1234-4c28-c917-bc9d9c0e45e5",
    "reasonName": "Gel tẩy trắng bổ sung Opalescence",
    "category": "TAY_TRANG",
    "description": "Tuýp gel tẩy trắng chính hãng Opalescence (Mỹ) nồng độ 10%-20% dùng tra thêm vào máng duy trì tẩy trắng định kỳ.",
    "estimatedDuration": 30
  },
  {
    "id": "1a01f674-5678-4c28-c917-bc9d9c0e51a1",
    "reasonName": "Khám răng tổng quát & tư vấn chuyên sâu",
    "category": "KHAM_DIEU_TRI",
    "description": "Kiểm tra toàn diện sức khỏe răng miệng: khám lợi, kiểm tra sâu răng, phát hiện bệnh lý nha chu. Miễn phí.",
    "estimatedDuration": 30
  },
  {
    "id": "2b02f674-5678-4c28-c917-bc9d9c0e52b2",
    "reasonName": "Chụp X-quang toàn cảnh Panorama",
    "category": "KHAM_DIEU_TRI",
    "description": "Máy chụp kỹ thuật số hiện đại khảo sát toàn bộ cấu trúc xương hàm, răng và dây thần kinh.",
    "estimatedDuration": 30
  },
  {
    "id": "3c03f674-5678-4c28-c917-bc9d9c0e53c3",
    "reasonName": "Chụp X-quang CBCT 3D khảo sát xương",
    "category": "KHAM_DIEU_TRI",
    "description": "Công nghệ cắt lớp vi tính 3D chi tiết xương hàm, phục vụ cấy ghép Implant và nhổ răng khôn lệch.",
    "estimatedDuration": 30
  },
  {
    "id": "4d04f674-5678-4c28-c917-bc9d9c0e54d4",
    "reasonName": "Lấy cao răng siêu âm & đánh bóng",
    "category": "KHAM_DIEU_TRI",
    "description": "Đầu rung siêu âm loại bỏ hoàn toàn mảng bám dưới nướu gây viêm lợi, kết hợp đánh bóng bột nha khoa cao cấp.",
    "estimatedDuration": 30
  },
  {
    "id": "5e05f674-5678-4c28-c917-bc9d9c0e55e5",
    "reasonName": "Trám răng thẩm mỹ Composite",
    "category": "KHAM_DIEU_TRI",
    "description": "Trám khôi phục hình dạng răng sâu nhẹ bằng chất liệu Composite đồng màu răng, hóa cứng bằng đèn Halogen.",
    "estimatedDuration": 30
  },
  {
    "id": "6f06f674-5678-4c28-c917-bc9d9c0e56f6",
    "reasonName": "Điều trị tủy răng (Nội nha)",
    "category": "KHAM_DIEU_TRI",
    "description": "Loại bỏ tủy răng viêm nhiễm, làm sạch ống tủy và trám bít kín. Bảo tồn tối đa cấu trúc răng thật.",
    "estimatedDuration": 30
  },
  {
    "id": "7a07f674-5678-4c28-c917-bc9d9c0e57a7",
    "reasonName": "Nhổ răng thường lung lay",
    "category": "KHAM_DIEU_TRI",
    "description": "Nhổ răng nhẹ nhàng cho răng sữa đến tuổi thay hoặc răng vĩnh viễn lung lay nặng do viêm nha chu.",
    "estimatedDuration": 30
  },
  {
    "id": "8b08f674-5678-4c28-c917-bc9d9c0e58b8",
    "reasonName": "Nhổ răng khôn mọc lệch bằng Piezotome",
    "category": "KHAM_DIEU_TRI",
    "description": "Công nghệ sóng siêu âm Piezotome không gây tổn thương mô mềm, hạn chế đau đớn, sưng nề và lành thương siêu tốc.",
    "estimatedDuration": 30
  }
];

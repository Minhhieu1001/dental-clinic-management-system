# Chạy thử bằng Docker trên máy cá nhân

Docker Compose này dành cho local HTTP, chưa phải cấu hình VPS production.
FE được build và phục vụ bằng Nginx để kiểm tra giống cách triển khai thật;
không có hot reload trong container.

## Chuẩn bị

- Docker Desktop đang chạy Linux containers.
- Giữ file `backend/.env` đang dùng cho dev. Compose truyền file này vào BE
  lúc chạy, không copy vào image. Không commit file này.
- File đó cần có `JWT_SECRET` (Base64, ít nhất 32 byte sau giải mã),
  `AI_API_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
  `CLOUDINARY_API_SECRET`, `MAIL_USERNAME`, `MAIL_PASSWORD`,
  `APP_CLINIC_BANK_ID`, `APP_CLINIC_ACCOUNT_NO`,
  `APP_CLINIC_ACCOUNT_NAME`, `APP_CLINIC_QR_TEMPLATE`.
- Các tích hợp bên ngoài cần thông tin hợp lệ nếu muốn kiểm thử chức năng tương ứng.

## Khởi động

Từ thư mục gốc chứa `compose.yaml`:

```powershell
docker compose up -d --build
docker compose ps
docker compose logs -f backend
```

Nếu terminal đang ở thư mục `backend`, thay `docker compose` bằng
`docker compose -f ../compose.yaml` trong các lệnh.

- Web: http://localhost:3000
- Tài khoản admin mẫu: `admin@dental.com`, mật khẩu `123456` (chỉ dùng local).
- API trực tiếp: http://localhost:8081/api/v1/promotions
- PostgreSQL Docker: localhost:5433, database `dental_clinic`,
  user `dental`, password `dental_local_only` (chỉ dùng local).
- API, WebSocket và upload từ giao diện được Nginx chuyển tiếp trên cùng origin.
- FE chỉ khởi động sau khi BE trả lời API thành công; BE chờ DB sẵn sàng.
- Docker tạo DB riêng và nạp `backend/src/main/resources/data.sql` theo cấu hình
  dev hiện tại. Không tự sao chép dữ liệu PostgreSQL trên máy bạn.
- Cổng chỉ bind vào 127.0.0.1 để chạy trên máy cá nhân.

Lần build đầu phải tải Java, Node, PostgreSQL, thư viện Maven/npm và OCR.
Nếu BE lỗi, xem log trước: thiếu biến môi trường, lỗi schema/dữ liệu mẫu,
hoặc không tải được dependency đều có thể làm FE chờ ở bước health check.

## Sau khi sửa code

```powershell
docker compose up -d --build
```

FE dùng `VITE_API_V1_URL=/api/v1` và `VITE_WS_URL=/ws` lúc build image.
File `.env` local của FE không được đưa vào Docker build nên không ghi đè
các URL Docker. `.env` và lệnh `npm run dev` hiện tại vẫn giữ nguyên.

## Dừng Docker và quay lại dev

```powershell
docker compose down
```

Sau đó chạy BE bằng IntelliJ như trước, chạy `npm run dev` trong `frontend`.
Không bật profile `docker` trong IntelliJ. `application.properties` gốc
không bị sửa; các thuộc tính Java mới đều có giá trị mặc định cho dev cũ.

Commit lưu cấu hình dev trước khi thêm Docker: `735cf42`.
Không cần checkout commit này chỉ để quay lại chạy dev.
Commit đó lưu các cấu hình đã thay đổi, không gom những thay đổi nghiệp vụ
khác đang có trong working tree.

## Dữ liệu bền vững

Compose dùng ba named volumes cho PostgreSQL, uploads và vector store AI.
`docker compose down` giữ các volume. Không thêm `-v` nếu muốn giữ dữ liệu:
`down -v` sẽ xóa các volume và dữ liệu Docker tương ứng.
Database local ngoài Docker không bị tác động.

## Khi chuyển lên VPS

Giữ Dockerfile, nhưng tạo cấu hình production riêng: secret và DB credentials
riêng, HTTPS/domain, cookie Secure, origin chính xác, migration/schema trước
khi dùng `ddl-auto=validate`, tắt nạp dữ liệu mẫu, backup volumes và tự khởi động
lại dịch vụ. Không đưa trực tiếp mật khẩu local trong Compose này lên production.
Nếu tách FE lên Vercel, cấu hình URL API/WebSocket khi build FE và rà soát cookie
giữa các domain. Profile `docker` trong repository này chỉ dành cho kiểm thử local.

Tài liệu: [Compose startup order](https://docs.docker.com/compose/how-tos/startup-order/),
[Vite environment variables](https://vite.dev/guide/env-and-mode.html).

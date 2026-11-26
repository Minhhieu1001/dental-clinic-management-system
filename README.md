# Crown Dental — hướng dẫn chạy dự án

Dự án gồm API Spring Boot (`backend`), website React/Vite (`frontend`) và ứng dụng Expo/React Native (`mobile`). Có hai cách chạy: dùng Docker Compose để mở nhanh website + API, hoặc chạy từng phần để phát triển và có hot reload. Các lệnh dưới đây chạy từ **thư mục gốc**, nơi có `compose.yaml`.

## 1. Yêu cầu môi trường

| Thành phần | Khi chạy bằng Docker | Khi chạy từng phần |
| --- | --- | --- |
| Docker Desktop và Docker Compose | Cần, bật Linux containers | Cần nếu dùng PostgreSQL/RabbitMQ trong Compose; có thể thay bằng dịch vụ cài sẵn |
| Java 21 | Đã có trong Docker image | Cần cho backend; Maven Wrapper đã nằm trong `backend` |
| Node.js 22 và npm | Đã có trong Docker image của website | Cần cho frontend và mobile |
| PostgreSQL 17, RabbitMQ 4 | Compose tự tạo | Cần chạy trước backend; có thể dùng Compose chỉ cho hai dịch vụ này |
| Thiết bị/emulator có thể chạy Expo | Không áp dụng | Cần nếu thử ứng dụng mobile |

Máy cần truy cập Internet trong lần cài/build đầu để tải các thư viện. Các tích hợp như email, Cloudinary, Gemini AI và thanh toán QR cần thông tin riêng nếu muốn thử đầy đủ tính năng tương ứng.

## 2. Chuẩn bị cấu hình

Không đưa các file `.env` lên Git. Các file `*.env.example` chỉ là mẫu; thay các giá trị `your_...` trước khi dùng tính năng liên quan.

Từ thư mục gốc, tạo file cấu hình backend:

```powershell
if (-not (Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
```

Sửa `backend/.env`. **Bắt buộc thay `JWT_SECRET`** bằng một chuỗi Base64 của ít nhất 32 byte. Có thể tạo bằng PowerShell, rồi chép kết quả vào dòng `JWT_SECRET=`:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Các nhóm biến trong `backend/.env`:

| Biến | Mục đích |
| --- | --- |
| `JWT_SECRET` | Ký access/refresh token; cần giá trị Base64 hợp lệ |
| `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` | Kết nối PostgreSQL khi chạy backend ngoài Docker |
| `RABBITMQ_HOST`, `RABBITMQ_USERNAME`, `RABBITMQ_PASSWORD` | Kết nối RabbitMQ; mẫu đã khớp với `compose.yaml` khi chạy local |
| `MAIL_USERNAME`, `MAIL_PASSWORD` | SMTP Gmail; `MAIL_PASSWORD` là App Password khi dùng Gmail |
| `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_TEST_REDIRECT` | Cấu hình dịch vụ gửi mail Resend nếu sử dụng |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Upload ảnh lên Cloudinary |
| `AI_API_KEY` | Các chức năng Gemini AI |
| `APP_CLINIC_BANK_ID`, `APP_CLINIC_ACCOUNT_NO`, `APP_CLINIC_ACCOUNT_NAME`, `APP_CLINIC_QR_TEMPLATE` | Tạo QR thanh toán của phòng khám |

Các khóa dịch vụ ngoài có thể để giá trị mẫu trong lúc chỉ kiểm tra giao diện/API cơ bản, nhưng tính năng tương ứng sẽ không hoạt động đúng. Tham khảo [backend/.env.example](backend/.env.example) để xem toàn bộ biến mẫu. Backend mặc định chạy cổng `8080`; database mặc định trỏ tới `localhost:5432/dental_clinic` nếu không đặt biến kết nối riêng.

## 3. Cách A — chạy website và API bằng Docker

Sau khi có `backend/.env` với JWT hợp lệ:

```powershell
docker compose up -d --build
docker compose ps
docker compose logs -f backend
```

Đợi các container khỏe mạnh, sau đó mở:

| Dịch vụ | Địa chỉ từ máy đang chạy Docker |
| --- | --- |
| Website | http://localhost:3000 |
| API | http://localhost:8081/api/v1/promotions |
| RabbitMQ Management | http://localhost:15672 |
| PostgreSQL | `localhost:5433`, database `dental_clinic`, user `dental`, password `dental_local_only` |

Website Docker dùng Nginx chuyển tiếp `/api`, `/ws` và `/uploads` tới backend, vì vậy không cần cấu hình URL API trong `frontend/.env`. Các cổng Compose chỉ mở trên `127.0.0.1`. Tài khoản admin trong dữ liệu mẫu local: `admin@dental.com` / `123456`; đổi hoặc vô hiệu hóa trước khi dùng môi trường công khai.

Khi sửa code, build lại container bằng `docker compose up -d --build`. Dừng bằng `docker compose down`; lệnh này giữ dữ liệu trong các Docker volume. Xem thêm lưu ý về Docker trong [DOCKER.md](DOCKER.md).

## 4. Cách B — chạy từng phần để phát triển

### 4.1. Khởi động PostgreSQL và RabbitMQ

Cách nhanh nhất là dùng riêng hai dịch vụ trong Compose:

```powershell
docker compose up -d db rabbitmq
docker compose ps
```

Trong trường hợp này PostgreSQL xuất ra **cổng 5433** trên máy, nên thêm hoặc sửa các dòng sau trong `backend/.env`:

```dotenv
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/dental_clinic
SPRING_DATASOURCE_USERNAME=dental
SPRING_DATASOURCE_PASSWORD=dental_local_only
```

RabbitMQ trong `backend/.env.example` đã dùng `localhost`, user `dental` và mật khẩu `dental_local_only`, khớp với Compose. Nếu dùng PostgreSQL/RabbitMQ cài trực tiếp trên máy, tự tạo database `dental_clinic` rồi sửa các biến kết nối cho đúng. Không chạy container `backend`/`frontend` của Compose đồng thời với bản chạy local nếu chúng dùng chung cổng.

### 4.2. Chạy backend

Mở terminal tại `backend`:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Trên macOS/Linux dùng `./mvnw spring-boot:run`. Trong IntelliJ có thể chạy `iuh.fit.backend.BackendApplication` với Java 21. **Không bật profile `docker`** khi chạy backend trực tiếp trên máy. API ở `http://localhost:8080`; thử `http://localhost:8080/api/v1/promotions`. Cấu hình hiện tại dùng `ddl-auto=update` và nạp [data.sql](backend/src/main/resources/data.sql) khi khởi động, nên một database trống sẽ được tạo bảng và thêm dữ liệu mẫu. Chỉ dùng cách này cho môi trường phát triển.

### 4.3. Chạy website

Mở một terminal khác từ thư mục gốc:

```powershell
cd frontend
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm ci
npm run dev
```

Mở `http://localhost:5173`. File `.env.example` đặt API ở `http://localhost:8080/api/v1` và WebSocket ở `http://localhost:8080/ws`; sửa hai biến `VITE_API_V1_URL`, `VITE_WS_URL` nếu backend chạy ở địa chỉ khác. Sau khi đổi `.env`, khởi động lại Vite. Lệnh kiểm tra frontend: `npm run build` và `npm run lint`.

### 4.4. Chạy ứng dụng mobile

Mobile chạy riêng với Docker và website. Mở một terminal khác từ thư mục gốc:

```powershell
cd mobile
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm ci
npm start
```

`npm start` mở Expo và hiển thị mã QR/các lựa chọn chạy trên thiết bị hoặc emulator. Mobile đọc `EXPO_PUBLIC_API_V1_URL` từ `mobile/.env`.

- **Điện thoại thật:** thay `localhost` bằng IP LAN của máy đang chạy backend, ví dụ `EXPO_PUBLIC_API_V1_URL=http://192.168.1.10:8080/api/v1`. Máy và điện thoại phải cùng mạng, backend phải cho phép kết nối qua mạng và firewall không chặn cổng `8080`.
- **Android emulator:** nếu backend chạy trên máy host, có thể dùng `http://10.0.2.2:8080/api/v1`.
- **Backend trong Compose:** đổi cổng ví dụ trên thành `8081`, vì Compose công bố API ở `localhost:8081`; cổng này hiện chỉ bind `127.0.0.1`, nên điện thoại thật không truy cập trực tiếp qua IP LAN nếu chưa thay cấu hình cổng hoặc dùng URL backend công khai.

Mobile tự suy ra WebSocket từ URL API. Nếu cần địa chỉ WebSocket riêng, đặt thêm `EXPO_PUBLIC_WS_URL` trong `mobile/.env`. Sau khi đổi `.env`, khởi động lại Expo. Các lệnh khác có trong `mobile/package.json`: `npm run android`, `npm run ios`, `npm run web`, `npm run lint`.

## 5. Kiểm tra và xử lý lỗi thường gặp

```powershell
# Kiểm tra container và log khi dùng Docker
docker compose ps
docker compose logs -f backend

# Build backend (Windows, chạy trong thư mục backend)
.\mvnw.cmd test

# Kiểm tra website (chạy trong thư mục frontend)
npm run build
```

| Hiện tượng | Kiểm tra |
| --- | --- |
| Backend không kết nối PostgreSQL | Kiểm tra `SPRING_DATASOURCE_URL`: Docker DB dùng `localhost:5433` khi backend chạy ngoài Docker; `db:5432` chỉ dùng bên trong mạng Compose. |
| Backend không khởi động do JWT | `JWT_SECRET` phải là Base64 hợp lệ, giải mã được ít nhất 32 byte. |
| Website gọi API sai cổng | Kiểm tra `frontend/.env`; Vite local thường gọi `localhost:8080`, website Docker gọi qua Nginx ở `localhost:3000`. |
| Mobile gọi `localhost` nhưng không thấy API | Trên điện thoại, `localhost` là chính điện thoại; dùng IP LAN của máy chạy backend hoặc URL backend công khai. |
| Ảnh/mail/AI không hoạt động | Điền đúng biến Cloudinary, mail hoặc Gemini trong `backend/.env`; xem log backend để biết tích hợp nào lỗi. |
| Không thấy dữ liệu mẫu | Kiểm tra log khởi động backend và việc chạy `data.sql`; dữ liệu trong Docker volume cũ vẫn được giữ sau `docker compose down`. |

Các file cấu hình liên quan: [application.properties](backend/src/main/resources/application.properties), [application-docker.properties](backend/src/main/resources/application-docker.properties), [frontend/.env.example](frontend/.env.example) và [mobile/.env.example](mobile/.env.example).

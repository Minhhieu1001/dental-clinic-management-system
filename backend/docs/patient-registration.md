# Đăng ký bệnh nhân

Các API công khai dùng envelope `ApiResponse` của hệ thống.

1. `POST /api/v1/auth/patient/register`

```json
{
  "fullName": "Nguyễn Văn A",
  "dateOfBirth": "2000-05-20",
  "gender": "MALE",
  "address": "12 Nguyễn Trãi, TP.HCM",
  "branchId": "BR-01",
  "email": "patient@gmail.com",
  "phone": "0901234567",
  "password": "password123",
  "confirmPassword": "password123"
}
```

Trả về `data.expiresAt` và `data.resendAfterSeconds = 60`. Chưa tạo user/patient/medical record ở bước này. Email phải chưa được sử dụng; số điện thoại được chuẩn hóa (`+84`, `84` thành `0`), đếm tất cả tài khoản và trạng thái, từ chối nếu đã có ít nhất 2 tài khoản. Mật khẩu tối thiểu 6 ký tự theo form, tối đa 72 byte UTF-8.

`dateOfBirth`, `gender`, `address` bắt buộc. Ngày sinh dùng `yyyy-MM-dd`, không được ở tương lai; giới tính nhận `MALE`, `FEMALE`, `OTHER`. Các trường này được lưu trong đăng ký chờ và chuyển sang Patient sau xác thực OTP. Entity Patient hiện dùng LocalDateTime nên ngày sinh được chuyển thành 00:00:00 của ngày đã nhập.

2. `POST /api/v1/auth/patient/register/resend`

```json
{"email": "patient@gmail.com"}
```

Chỉ gửi lại sau khi OTP trước hết 60 giây. Đăng ký lại cũng tuân theo thời gian chờ này. Mã mới thay mã cũ, đặt lại số lần sai. Dữ liệu đăng ký chờ được lưu database, mật khẩu và OTP chỉ lưu dạng băm.

3. `POST /api/v1/auth/patient/register/verify`

```json
{"email": "patient@gmail.com", "code": "123456"}
```

OTP hiệu lực 60 giây, tối đa 5 lần nhập sai. Xác thực thành công tạo user role PATIENT trạng thái ACTIVE, patient và medical record trong một transaction, xóa đăng ký chờ. Trả về `data.userId`, `data.patientId`, `data.patientCode`. OTP không dùng lại được.

Email mã bệnh nhân gửi sau khi transaction commit. Nếu SMTP lỗi ở bước này, tài khoản vẫn tồn tại, mã bệnh nhân vẫn có trong response và lỗi gửi được ghi log; hiện chưa có cơ chế tự gửi lại email mã bệnh nhân.

Đăng nhập qua API hiện có `POST /api/v1/auth/patient/login` với `patientCode`, `phone`, `password`.

Mã bệnh nhân mới có dạng `PA-` + 8 ký tự chữ/số, ví dụ `PA-A1B2C3D4`. Khi sinh mã, hệ thống kiểm tra trùng trong cả users và patients rồi sinh lại nếu cần.

## Vận hành

`branchId` bắt buộc, lấy từ `GET /api/v1/branches` (trường `branchId`, không phải `branchCode`). Frontend chỉ hiển thị cơ sở có `status = ACTIVE`. Backend kiểm tra cơ sở tồn tại và đang hoạt động khi đăng ký, gửi lại OTP và xác thực. ID được lưu cùng đăng ký chờ; khi xác thực thành công, MedicalRecord được gán cơ sở này qua `branch_id`. Phiên đăng ký cũ chưa có branchId cần gửi lại form kèm cơ sở.

- Cấu hình `MAIL_USERNAME`, `MAIL_PASSWORD` (Gmail App Password) theo cấu hình SMTP hiện có.
- `spring.jpa.hibernate.ddl-auto=update` hiện có sẽ tạo bảng `patient_registrations` khi khởi động.
- Dùng PostgreSQL advisory transaction lock theo email để tránh gửi/xác thực trùng, và khóa bảng users khi kiểm tra cuối cùng + tạo tài khoản. Khóa bảng tồn tại ngắn trong transaction xác thực, có thể làm các thao tác ghi user khác chờ.
- Giới hạn được áp dụng trong luồng đăng ký này. Các luồng quản trị tạo/sửa user khác cần cùng quy tắc nếu muốn bắt buộc giới hạn trên toàn hệ thống.

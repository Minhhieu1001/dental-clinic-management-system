package iuh.fit.backend.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    ACTIVATION_PATIENT_MISMATCH(HttpStatus.BAD_REQUEST, "Không tìm thấy bệnh nhân khớp cả mã bệnh nhân và số điện thoại"),
    ACTIVATION_EMAIL_MISMATCH(HttpStatus.BAD_REQUEST, "Email phải trùng email trong hồ sơ bệnh nhân. Vui lòng liên hệ phòng khám nếu cần cập nhật email"),
    PATIENT_ALREADY_ACTIVATED(HttpStatus.CONFLICT, "Hồ sơ bệnh nhân đã có tài khoản. Vui lòng đăng nhập hoặc quên mật khẩu"),
    ACTIVATION_RESEND_TOO_SOON(HttpStatus.TOO_MANY_REQUESTS, "Vui lòng đợi hết 120 giây trước khi gửi lại OTP"),
    ACTIVATION_CODE_INVALID(HttpStatus.BAD_REQUEST, "OTP kích hoạt không đúng hoặc đã được sử dụng"),
    ACTIVATION_CODE_EXPIRED(HttpStatus.BAD_REQUEST, "OTP kích hoạt đã hết hạn. Vui lòng gửi lại mã"),
    ACTIVATION_TOO_MANY_ATTEMPTS(HttpStatus.TOO_MANY_REQUESTS, "Đã nhập sai OTP 5 lần. Vui lòng xin mã mới khi hết 120 giây"),
    ACTIVATION_TOKEN_INVALID(HttpStatus.BAD_REQUEST, "Phiên đặt mật khẩu không hợp lệ hoặc hết hạn. Vui lòng xác thực OTP lại"),
    ACTIVATION_PROFILE_CHANGED(HttpStatus.CONFLICT, "Thông tin hồ sơ đã thay đổi. Vui lòng tra cứu và xác thực lại"),
    STAFF_LOGIN_ROLE_REQUIRED(HttpStatus.FORBIDDEN, "Cổng nội bộ chỉ dành cho nhân sự nha khoa"),
    PATIENT_LOGIN_ROLE_REQUIRED(HttpStatus.FORBIDDEN, "Cổng bệnh nhân chỉ dành cho tài khoản bệnh nhân"),
    PHONE_ACCOUNT_LIMIT(HttpStatus.CONFLICT, "Số điện thoại đã có 2 tài khoản, không thể đăng ký thêm"),
    REGISTRATION_CODE_INVALID(HttpStatus.BAD_REQUEST, "OTP đăng ký không đúng hoặc đã được sử dụng"),
    REGISTRATION_CODE_EXPIRED(HttpStatus.BAD_REQUEST, "OTP đăng ký đã hết hạn. Vui lòng gửi lại"),
    REGISTRATION_TOO_MANY_ATTEMPTS(HttpStatus.TOO_MANY_REQUESTS, "Đã nhập sai OTP 5 lần. Vui lòng xin mã mới khi hết 60 giây"),
    REGISTRATION_RESEND_TOO_SOON(HttpStatus.TOO_MANY_REQUESTS, "Vui lòng đợi 60 giây trước khi gửi lại OTP"),
    REGISTRATION_MAIL_FAILED(HttpStatus.SERVICE_UNAVAILABLE, "Không gửi được email đăng ký. Vui lòng thử lại"),

    // Authentication & Authorization
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không chính xác"),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "Chưa xác thực. Vui lòng đăng nhập"),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "Bạn không có quyền truy cập tài nguyên này"),
    ACCOUNT_LOCKED(HttpStatus.FORBIDDEN, "Tài khoản đã bị khóa"),
    ACCOUNT_INACTIVE(HttpStatus.FORBIDDEN, "Tài khoản chưa được kích hoạt"),
    PATIENT_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ bệnh nhân"),
    PATIENT_ACCOUNT_NOT_ACTIVATED(HttpStatus.BAD_REQUEST, "Hồ sơ bệnh nhân chưa được kích hoạt tài khoản trực tuyến"),
    PATIENT_INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "Mã bệnh nhân, số điện thoại hoặc mật khẩu không chính xác"),

    // Token
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "Token không hợp lệ"),
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "Token đã hết hạn"),
    REFRESH_TOKEN_NOT_FOUND(HttpStatus.UNAUTHORIZED, "Không tìm thấy Refresh Token"),

    // User
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"),
    EMAIL_NOT_FOUND(HttpStatus.NOT_FOUND, "Email không tồn tại trong hệ thống"),
    RESET_CODE_INVALID(HttpStatus.BAD_REQUEST, "Mã xác nhận không đúng hoặc đã được sử dụng"),
    RESET_CODE_EXPIRED(HttpStatus.BAD_REQUEST, "Mã xác nhận đã hết hạn. Vui lòng xin mã mới"),
    RESET_TOO_MANY_ATTEMPTS(HttpStatus.TOO_MANY_REQUESTS, "Đã nhập sai 5 lần. Vui lòng xin mã mới"),
    RESET_RESEND_TOO_SOON(HttpStatus.TOO_MANY_REQUESTS, "Vui lòng đợi 60 giây trước khi xin mã mới"),
    RESET_TOKEN_INVALID(HttpStatus.BAD_REQUEST, "Phiên đổi mật khẩu không hợp lệ hoặc đã hết hạn"),
    RESET_MAIL_FAILED(HttpStatus.SERVICE_UNAVAILABLE, "Không gửi được email xác nhận. Vui lòng thử lại sau"),
    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "Email đã được sử dụng"),

    // AppointmentRequest
    APPOINTMENT_REQUEST_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu lịch hẹn"),
    APPOINTMENT_REQUEST_ALREADY_PROCESSED(HttpStatus.CONFLICT, "Yêu cầu lịch hẹn đã được nhân viên khác xử lý"),
    APPOINTMENT_REQUEST_DATA_REQUIRED(HttpStatus.BAD_REQUEST, "Dữ liệu yêu cầu lịch hẹn không được để trống"),
    APPOINTMENT_REQUEST_FULL_NAME_REQUIRED(HttpStatus.BAD_REQUEST, "Họ tên không được để trống"),
    APPOINTMENT_REQUEST_PHONE_REQUIRED(HttpStatus.BAD_REQUEST, "Số điện thoại không được để trống"),
    CURRENT_USER_NOT_EMPLOYEE(HttpStatus.FORBIDDEN, "Tài khoản hiện tại không phải nhân viên"),

    // Generic
    RESOURCE_IN_USE(HttpStatus.CONFLICT, "Tài nguyên đã tồn tại hoặc đang được sử dụng"),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi hệ thống. Vui lòng thử lại sau"),
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "Dữ liệu không hợp lệ"),
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy tài nguyên"),
    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "Đợt khám này đã được xác nhận và khóa hồ sơ. Không thể thêm/sửa ghi nhận răng!");

    private final HttpStatus httpStatus;
    private final String message;

    ErrorCode(HttpStatus httpStatus, String message) {
        this.httpStatus = httpStatus;
        this.message = message;
    }
}

package iuh.fit.backend.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // Authentication & Authorization
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không chính xác"),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "Chưa xác thực. Vui lòng đăng nhập"),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "Bạn không có quyền truy cập tài nguyên này"),
    ACCOUNT_LOCKED(HttpStatus.FORBIDDEN, "Tài khoản đã bị khóa"),
    ACCOUNT_INACTIVE(HttpStatus.FORBIDDEN, "Tài khoản chưa được kích hoạt"),

    // Token
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "Token không hợp lệ"),
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "Token đã hết hạn"),
    REFRESH_TOKEN_NOT_FOUND(HttpStatus.UNAUTHORIZED, "Không tìm thấy Refresh Token"),

    // User
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"),
    EMAIL_NOT_FOUND(HttpStatus.NOT_FOUND, "Email không tồn tại trong hệ thống"),
    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "Email đã được sử dụng"),

    // AppointmentRequest
    APPOINTMENT_REQUEST_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu lịch hẹn"),
    APPOINTMENT_REQUEST_ALREADY_PROCESSED(HttpStatus.CONFLICT, "Yêu cầu lịch hẹn đã được nhân viên khác xử lý"),
    APPOINTMENT_REQUEST_DATA_REQUIRED(HttpStatus.BAD_REQUEST, "Dữ liệu yêu cầu lịch hẹn không được để trống"),
    APPOINTMENT_REQUEST_FULL_NAME_REQUIRED(HttpStatus.BAD_REQUEST, "Họ tên không được để trống"),
    APPOINTMENT_REQUEST_PHONE_REQUIRED(HttpStatus.BAD_REQUEST, "Số điện thoại không được để trống"),
    CURRENT_USER_NOT_EMPLOYEE(HttpStatus.FORBIDDEN, "Tài khoản hiện tại không phải nhân viên"),

    // Generic
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

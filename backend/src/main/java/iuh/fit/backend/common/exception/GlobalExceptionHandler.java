package iuh.fit.backend.common.exception;

import io.github.resilience4j.ratelimiter.RequestNotPermitted;
import iuh.fit.backend.common.response.ApiResponse;
import jakarta.persistence.OptimisticLockException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
        @ExceptionHandler(ResponseStatusException.class)
        public ResponseEntity<ApiResponse<Void>> handleResponseStatusException(ResponseStatusException ex) {
                return ResponseEntity.status(ex.getStatusCode()).body(
                                ApiResponse.error(ex.getStatusCode().value(), ex.getReason()));
        }

        @ExceptionHandler(RequestNotPermitted.class)
        public ResponseEntity<ApiResponse<Void>> handleRateLimitException(RequestNotPermitted ex) {
                log.warn("RateLimiter kích hoạt chặn spam: {}", ex.getMessage());
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(
                                ApiResponse.error(
                                                HttpStatus.TOO_MANY_REQUESTS.value(),
                                                "Thao tác quá nhiều lần! Vui lòng thử lại sau 1 phút."));
        }

        @ExceptionHandler({ OptimisticLockingFailureException.class, OptimisticLockException.class })
        public ResponseEntity<ApiResponse<Void>> handleOptimisticLockingException(Exception ex) {
                log.warn("Xung đột dữ liệu đồng thời (Optimistic Locking): {}", ex.getMessage());
                return ResponseEntity.status(HttpStatus.CONFLICT).body(
                                ApiResponse.error(
                                                HttpStatus.CONFLICT.value(),
                                                "Dữ liệu này vừa được một người khác cập nhật trước đó! Vui lòng tải lại trang để thấy thông tin mới nhất."));
        }

        @ExceptionHandler(AppException.class)
        public ResponseEntity<ApiResponse<Void>> handleAppException(AppException ex) {
                log.warn("AppException: {}", ex.getMessage());
                ErrorCode errorCode = ex.getErrorCode();
                ApiResponse<Void> response = ApiResponse.error(
                                errorCode.getHttpStatus().value(),
                                ex.getMessage());
                return ResponseEntity.status(errorCode.getHttpStatus()).body(response);
        }

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationException(
                        MethodArgumentNotValidException ex) {
                Map<String, String> errors = new HashMap<>();
                ex.getBindingResult().getAllErrors().forEach(error -> {
                        String fieldName = ((FieldError) error).getField();
                        String errorMessage = error.getDefaultMessage();
                        errors.put(fieldName, errorMessage);
                });

                ApiResponse<Map<String, String>> response = ApiResponse.<Map<String, String>>builder()
                                .status(HttpStatus.BAD_REQUEST.value())
                                .message("Dữ liệu không hợp lệ")
                                .data(errors)
                                .build();

                return ResponseEntity.badRequest().body(response);
        }

        @ExceptionHandler(BadCredentialsException.class)
        public ResponseEntity<ApiResponse<Void>> handleBadCredentialsException(BadCredentialsException ex) {
                log.warn("BadCredentialsException: {}", ex.getMessage());
                ApiResponse<Void> response = ApiResponse.error(
                                HttpStatus.UNAUTHORIZED.value(),
                                ErrorCode.INVALID_CREDENTIALS.getMessage());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        @ExceptionHandler(AccessDeniedException.class)
        public ResponseEntity<ApiResponse<Void>> handleAccessDeniedException(AccessDeniedException ex) {
                log.warn("AccessDeniedException: {}", ex.getMessage());
                ApiResponse<Void> response = ApiResponse.error(
                                HttpStatus.FORBIDDEN.value(),
                                ErrorCode.ACCESS_DENIED.getMessage());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }

        @ExceptionHandler(AuthenticationException.class)
        public ResponseEntity<ApiResponse<Void>> handleAuthenticationException(AuthenticationException ex) {
                log.warn("AuthenticationException: {}", ex.getMessage());
                ApiResponse<Void> response = ApiResponse.error(
                                HttpStatus.UNAUTHORIZED.value(),
                                ErrorCode.UNAUTHORIZED.getMessage());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
        public ResponseEntity<ApiResponse<Void>> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
                log.warn("HttpRequestMethodNotSupportedException: {}", ex.getMessage());
                ApiResponse<Void> response = ApiResponse.error(
                                HttpStatus.METHOD_NOT_ALLOWED.value(),
                                ex.getMessage());
                return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(response);
        }

        @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
        public ResponseEntity<ApiResponse<Void>> handleNoResourceFound(
                        org.springframework.web.servlet.resource.NoResourceFoundException ex) {
                log.debug("Static resource not found: {}", ex.getResourcePath());
                ApiResponse<Void> response = ApiResponse.error(
                                HttpStatus.NOT_FOUND.value(),
                                "Tài nguyên không tồn tại: " + ex.getResourcePath());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<ApiResponse<Void>> handleIllegalArgumentException(IllegalArgumentException ex) {
                log.warn("IllegalArgumentException: {}", ex.getMessage());
                return ResponseEntity.badRequest()
                                .body(ApiResponse.error(HttpStatus.BAD_REQUEST.value(), ex.getMessage()));
        }

        @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
        public ResponseEntity<ApiResponse<Void>> handleDataIntegrityViolationException(
                        org.springframework.dao.DataIntegrityViolationException ex) {
                log.warn("DataIntegrityViolationException: {}", ex.getMessage());
                String msg = ex.getMessage() != null ? ex.getMessage() : "";
                if (msg.contains("value too long")) {
                        return ResponseEntity.badRequest().body(
                                        ApiResponse.error(HttpStatus.BAD_REQUEST.value(),
                                                        "Dữ liệu quá dài. Vui lòng kiểm tra các trường hình ảnh, địa chỉ hoặc nội dung mô tả."));
                }
                if (msg.contains("uk_dentist_active_timeslot") || msg.contains("unique_doctor_timeslot")) {
                        return ResponseEntity.status(HttpStatus.CONFLICT).body(
                                        ApiResponse.error(HttpStatus.CONFLICT.value(),
                                                        "Khung giờ này của bác sĩ đã có lịch hẹn được đặt trước đó! Vui lòng chọn khung giờ hoặc bác sĩ khác."));
                }
                return ResponseEntity.status(HttpStatus.CONFLICT).body(
                                ApiResponse.error(HttpStatus.CONFLICT.value(),
                                                "Dữ liệu đang được sử dụng trong các hồ sơ, hóa đơn hoặc lịch hẹn khác nên không thể xóa!"));
        }

        @ExceptionHandler(Exception.class)
        public ResponseEntity<ApiResponse<Void>> handleGenericException(Exception ex) {
                log.error("Unexpected error: ", ex);
                String msg = ex.getMessage() != null ? ex.getMessage() : ErrorCode.INTERNAL_SERVER_ERROR.getMessage();
                ApiResponse<Void> response = ApiResponse.error(
                                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                                msg);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
}

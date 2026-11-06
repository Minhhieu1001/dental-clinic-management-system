package iuh.fit.backend.auth.service;

import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.exception.ErrorCode;
import iuh.fit.backend.notification.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionalEventListener;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetMailService {
    private final EmailService emailService;

    public void sendCode(String email, String code) {
        try {
            emailService.send(email, "Mã xác nhận đặt lại mật khẩu",
                    "Mã xác nhận của bạn là: " + code + "\nMã có hiệu lực trong 1 phút. Không chia sẻ mã với người khác.");
        } catch (RuntimeException ex) {
            throw new AppException(ErrorCode.RESET_MAIL_FAILED);
        }
    }

    public record PasswordChanged(String email) {}

    @TransactionalEventListener
    public void onPasswordChanged(PasswordChanged event) {
        try {
            emailService.send(event.email(), "Đổi mật khẩu thành công",
                    "Mật khẩu tài khoản của bạn đã được thay đổi thành công. Nếu bạn không thực hiện, hãy liên hệ phòng khám.");
        } catch (RuntimeException ex) {
            // The password is already committed; an email failure must not report a failed reset.
            log.error("Không gửi được email thông báo đổi mật khẩu ({})", ex.getClass().getSimpleName());
        }
    }
}

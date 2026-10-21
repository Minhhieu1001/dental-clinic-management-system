package iuh.fit.backend.auth.service;

import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionalEventListener;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetMailService {
    private final JavaMailSender mailSender;
    @Value("${spring.mail.username}")
    private String from;

    public void sendCode(String email, String code) {
        try {
            send(email, "Mã xác nhận đặt lại mật khẩu",
                    "Mã xác nhận của bạn là: " + code + "\nMã có hiệu lực trong 1 phút. Không chia sẻ mã với người khác.");
        } catch (MailException ex) {
            throw new AppException(ErrorCode.RESET_MAIL_FAILED);
        }
    }

    public record PasswordChanged(String email) {}

    @TransactionalEventListener
    public void onPasswordChanged(PasswordChanged event) {
        try {
            send(event.email(), "Đổi mật khẩu thành công",
                    "Mật khẩu tài khoản của bạn đã được thay đổi thành công. Nếu bạn không thực hiện, hãy liên hệ phòng khám.");
        } catch (MailException ex) {
            // The password is already committed; an email failure must not report a failed reset.
            log.error("Không gửi được email thông báo đổi mật khẩu ({})", ex.getClass().getSimpleName());
        }
    }

    private void send(String email, String subject, String content) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(email);
        message.setSubject(subject);
        message.setText(content);
        mailSender.send(message);
    }
}

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
public class PatientRegistrationMailService {
    private final JavaMailSender sender;
    @Value("${spring.mail.username}")
    private String from;

    public void sendOtp(String email, String code) {
        try {
            send(email, "Xác nhận đăng ký bệnh nhân", "Mã OTP của bạn: " + code
                    + "\nMã có hiệu lực 60 giây. Không chia sẻ mã này với người khác.");
        } catch (MailException ex) {
            throw new AppException(ErrorCode.REGISTRATION_MAIL_FAILED);
        }
    }

    public void sendActivationOtp(String email, String code) {
        try {
            send(email, "Xác nhận kích hoạt tài khoản bệnh nhân", "Mã OTP của bạn: " + code
                    + "\nMã có hiệu lực 120 giây. Không chia sẻ mã này với người khác.");
        } catch (MailException ex) {
            throw new AppException(ErrorCode.REGISTRATION_MAIL_FAILED);
        }
    }

    public void sendRelationshipOtp(String email, String code) {
        try {
            send(email, "Xác nhận liên kết hồ sơ bệnh nhân", "Mã OTP liên kết hồ sơ của bạn: " + code
                    + "\nMã có hiệu lực 120 giây. Không chia sẻ mã này với người khác.");
        } catch (MailException ex) {
            throw new AppException(ErrorCode.RELATIONSHIP_MAIL_FAILED);
        }
    }

    public record Registered(String email, String patientCode) {}

    @TransactionalEventListener
    public void onRegistered(Registered event) {
        try {
            send(event.email(), "Đăng ký bệnh nhân thành công", "Mã bệnh nhân của bạn: " + event.patientCode()
                    + "\nĐăng nhập bằng mã bệnh nhân, số điện thoại và mật khẩu đã đăng ký.");
        } catch (MailException ex) {
            log.error("Không gửi được email mã bệnh nhân sau đăng ký ({})", ex.getClass().getSimpleName());
        }
    }

    private void send(String email, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(email);
        message.setSubject(subject);
        message.setText(text);
        sender.send(message);
    }
}

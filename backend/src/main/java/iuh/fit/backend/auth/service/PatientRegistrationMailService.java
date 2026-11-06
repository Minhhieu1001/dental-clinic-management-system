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
public class PatientRegistrationMailService {
    private final EmailService emailService;

    public void sendOtp(String email, String code) {
        try {
            emailService.send(email, "Xác nhận đăng ký bệnh nhân",
                    "Mã OTP của bạn: " + code + "\nMã có hiệu lực 60 giây. Không chia sẻ mã này với người khác.");
        } catch (RuntimeException ex) {
            throw new AppException(ErrorCode.REGISTRATION_MAIL_FAILED);
        }
    }

    public void sendActivationOtp(String email, String code) {
        try {
            emailService.send(email, "Xác nhận kích hoạt tài khoản bệnh nhân",
                    "Mã OTP của bạn: " + code + "\nMã có hiệu lực 120 giây. Không chia sẻ mã này với người khác.");
        } catch (RuntimeException ex) {
            throw new AppException(ErrorCode.REGISTRATION_MAIL_FAILED);
        }
    }

    public void sendRelationshipOtp(String email, String code) {
        try {
            emailService.send(email, "Xác nhận liên kết hồ sơ bệnh nhân",
                    "Mã OTP liên kết hồ sơ của bạn: " + code + "\nMã có hiệu lực 120 giây. Không chia sẻ mã này với người khác.");
        } catch (RuntimeException ex) {
            throw new AppException(ErrorCode.RELATIONSHIP_MAIL_FAILED);
        }
    }

    public record Registered(String email, String patientCode) {}

    @TransactionalEventListener
    public void onRegistered(Registered event) {
        try {
            emailService.send(event.email(), "Đăng ký bệnh nhân thành công",
                    "Mã bệnh nhân của bạn: " + event.patientCode()
                            + "\nĐăng nhập bằng mã bệnh nhân, số điện thoại và mật khẩu đã đăng ký.");
        } catch (RuntimeException ex) {
            log.error("Không gửi được email mã bệnh nhân sau đăng ký ({})", ex.getClass().getSimpleName());
        }
    }
}

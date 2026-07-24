package iuh.fit.backend.notification.service.Impl;


import iuh.fit.backend.notification.service.EmailService;
import iuh.fit.backend.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl
        implements NotificationService {

    private final EmailService emailService;

    @Override
    public void sendAccountCreatedEmail(String email, String username, String password) {
        String content = """
                Xin chào %s,
                
                Tài khoản của bạn đã được tạo.
                
                Username: %s
                Password: %s
                
                Vui lòng đổi mật khẩu khi đăng nhập vào tài khoản của bạn để đảm bảo tính bảo mật.
                """
                .formatted(username, email, password);

        emailService.send(email, "Thông tin tài khoản", content);
    }
}
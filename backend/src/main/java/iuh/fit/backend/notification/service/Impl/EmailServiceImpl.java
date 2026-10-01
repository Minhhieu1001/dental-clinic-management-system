package iuh.fit.backend.notification.service.Impl;

import iuh.fit.backend.notification.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Override
    public void send(String to, String subject, String content) {
        if (to == null || to.isBlank()) {
            log.warn("Cannot send email: recipient address is empty.");
            return;
        }
        try {
            if (content != null && (content.contains("<html") || content.contains("<div") || content.contains("<p>"))) {
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
                helper.setTo(to);
                helper.setSubject(subject);
                helper.setText(content, true);
                mailSender.send(mimeMessage);
            } else {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(to);
                message.setSubject(subject);
                message.setText(content != null ? content : "");
                mailSender.send(message);
            }
            log.info("Email successfully sent to: {} with subject: {}", to, subject);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}

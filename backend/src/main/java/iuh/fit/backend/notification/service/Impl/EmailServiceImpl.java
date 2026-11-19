package iuh.fit.backend.notification.service.Impl;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import iuh.fit.backend.notification.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final RestClient restClient;

    @Value("${app.mail.resend.api-key:}")
    private String resendApiKey;

    @Value("${app.mail.resend.from:Crown Dental <onboarding@resend.dev>}")
    private String resendFrom;

    public EmailServiceImpl(JavaMailSender mailSender, RestClient.Builder restClientBuilder) {
        this.mailSender = mailSender;
        this.restClient = restClientBuilder.baseUrl("https://api.resend.com").build();
    }

    @Override
    @CircuitBreaker(name = "emailService", fallbackMethod = "fallbackSendEmail")
    @Retry(name = "emailService")
    public void send(String to, String subject, String content) {
        if (to == null || to.isBlank()) {
            log.warn("Cannot send email: recipient address is empty.");
            return;
        }

        try {
            // Khi có cấu hình RESEND_API_KEY (trên Render Cloud) -> Gửi qua cổng 443 HTTPS REST API
            if (StringUtils.hasText(resendApiKey)) {
                sendViaResendApi(to, subject, content);
            } else {
                // Khi không có RESEND_API_KEY (chạy Local máy bạn) -> Fallback 100% về Gmail SMTP như cũ
                sendViaSmtp(to, subject, content);
            }
            log.info("Email successfully sent to: {} with subject: {}", to, subject);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            throw new RuntimeException("Lỗi gửi email: " + e.getMessage(), e);
        }
    }

    private void sendViaResendApi(String to, String subject, String content) {
        Map<String, Object> body = new HashMap<>();
        body.put("from", resendFrom);
        body.put("to", List.of(to.trim()));
        body.put("subject", subject);
        if (content != null && (content.contains("<html") || content.contains("<div") || content.contains("<p>"))) {
            body.put("html", content);
        } else {
            body.put("text", content != null ? content : "");
        }

        restClient.post()
                .uri("/emails")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + resendApiKey.trim())
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .toBodilessEntity();
    }

    private void sendViaSmtp(String to, String subject, String content) throws Exception {
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
    }

    /**
     * Fallback method khi gửi email liên tục thất bại hoặc máy chủ email gặp sự cố
     */
    public void fallbackSendEmail(String to, String subject, String content, Throwable ex) {
        log.error("Resilience4j Fallback: Máy chủ Email gặp sự cố ({}), tạm thời không thể gửi thư tới: {}",
                ex.getMessage(), to);
        throw new IllegalStateException("Email service unavailable", ex);
    }
}

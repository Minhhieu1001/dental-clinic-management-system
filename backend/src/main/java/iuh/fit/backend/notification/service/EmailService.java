package iuh.fit.backend.notification.service;

public interface EmailService {
    void send(String to, String subject, String content);
}

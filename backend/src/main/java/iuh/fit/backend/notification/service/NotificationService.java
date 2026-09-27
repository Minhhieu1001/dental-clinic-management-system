package iuh.fit.backend.notification.service;


public interface NotificationService {
    void sendAccountCreatedEmail(String email, String username, String password);
}

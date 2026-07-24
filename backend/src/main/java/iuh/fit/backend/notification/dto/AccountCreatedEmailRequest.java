package iuh.fit.backend.notification.dto;

public record AccountCreatedEmailRequest(
        String email,
        String username,
        String password
) {
}

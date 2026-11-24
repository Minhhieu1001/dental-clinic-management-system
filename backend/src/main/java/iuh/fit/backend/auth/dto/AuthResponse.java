package iuh.fit.backend.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.UUID;

public record AuthResponse(
        UUID id,
        String email,
        String username,
        String role,
        String avatarUrl,
        UUID employeeId,
        UUID dentistId,
        UUID patientId,
        String phone,
        @JsonInclude(JsonInclude.Include.NON_NULL) String accessToken,
        @JsonInclude(JsonInclude.Include.NON_NULL) String refreshToken) {

    public AuthResponse(
            UUID id,
            String email,
            String username,
            String role,
            String avatarUrl,
            UUID employeeId,
            UUID dentistId,
            UUID patientId,
            String phone) {
        this(id, email, username, role, avatarUrl, employeeId, dentistId, patientId, phone, null, null);
    }

    public AuthResponse(
            UUID id,
            String email,
            String username,
            String role,
            String avatarUrl,
            UUID employeeId,
            UUID dentistId,
            UUID patientId) {
        this(id, email, username, role, avatarUrl, employeeId, dentistId, patientId, null, null, null);
    }

    public AuthResponse(
            UUID id,
            String email,
            String username,
            String role,
            String avatarUrl,
            UUID employeeId,
            UUID dentistId) {
        this(id, email, username, role, avatarUrl, employeeId, dentistId, null, null, null, null);
    }

    public AuthResponse withTokens(String accessToken, String refreshToken) {
        return new AuthResponse(
                id,
                email,
                username,
                role,
                avatarUrl,
                employeeId,
                dentistId,
                patientId,
                phone,
                accessToken,
                refreshToken);
    }
}

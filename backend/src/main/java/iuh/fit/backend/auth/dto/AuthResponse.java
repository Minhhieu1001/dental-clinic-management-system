package iuh.fit.backend.auth.dto;

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
        String phone) {

    public AuthResponse(
            UUID id,
            String email,
            String username,
            String role,
            String avatarUrl,
            UUID employeeId,
            UUID dentistId,
            UUID patientId) {
        this(id, email, username, role, avatarUrl, employeeId, dentistId, patientId, null);
    }

    public AuthResponse(
            UUID id,
            String email,
            String username,
            String role,
            String avatarUrl,
            UUID employeeId,
            UUID dentistId) {
        this(id, email, username, role, avatarUrl, employeeId, dentistId, null, null);
    }
}


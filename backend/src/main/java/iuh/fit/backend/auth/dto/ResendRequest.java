package iuh.fit.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResendRequest(
        @NotBlank
        @Email
        @Size(max = 255)
        String email
) {}

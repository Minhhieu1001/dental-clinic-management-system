package iuh.fit.backend.user.dto;

import iuh.fit.backend.user.enums.StatusUser;
import jakarta.validation.constraints.NotNull;

public record UpdateUserStatusRequest(
        @NotNull(message = "Status cannot be null")
        StatusUser status
) {
}

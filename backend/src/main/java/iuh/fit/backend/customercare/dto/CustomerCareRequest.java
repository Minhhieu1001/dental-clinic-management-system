package iuh.fit.backend.customercare.dto;

import iuh.fit.backend.customercare.enums.ContactChannel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CustomerCareRequest(
        @NotNull(message = "Bệnh nhân không được để trống") UUID patientId,
        @NotNull(message = "Nhân viên không được để trống") UUID employeeId,
        @NotBlank(message = "Loại chăm sóc không được để trống")
        @Size(max = 255, message = "Loại chăm sóc không được vượt quá 255 ký tự") String careCategory,
        @NotBlank(message = "Nội dung chăm sóc không được để trống") String careContent,
        @NotNull(message = "Kênh liên hệ không được để trống") ContactChannel contactChannel,
        // Kept for older clients; delivery status is controlled by the backend.
        @Size(max = 255, message = "Trạng thái không được vượt quá 255 ký tự") String status
) {
}

package iuh.fit.backend.customercare.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePatientAppointmentRequestDTO {
    private LocalDateTime appointmentTime;
    private String appointmentType; // "Đặt trước" / "Dự kiến"
    private UUID dentistId;
    private String content;         // Dịch vụ / Lý do khám
    private String notes;           // Ghi chú
    private String status;          // "PENDING", "IN_PROGRESS", "WAITING", "COMPLETED", "CANCELLED"
}

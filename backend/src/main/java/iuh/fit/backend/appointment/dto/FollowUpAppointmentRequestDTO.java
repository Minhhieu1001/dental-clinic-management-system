package iuh.fit.backend.appointment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FollowUpAppointmentRequestDTO {
    private UUID examinationResultId;
    private UUID patientId;
    private String patientCode;
    private UUID dentistId;

    @NotNull(message = "Thời gian tái khám không được để trống")
    private LocalDateTime followUpDate;

    private String reason;
    private String note;
    private Boolean status;

    @Builder.Default
    private Boolean sendEmail = true;

    @Builder.Default
    private Boolean sendSms = true;
}

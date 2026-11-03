package iuh.fit.backend.appointment.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FollowUpAppointmentDTO {
    private UUID id;
    private LocalDateTime followUpDate;
    private String reason;
    private String note;
    private Boolean status;
    private LocalDateTime createAt;
    private LocalDateTime updatedAt;

    // Examination Result (Đợt khám) context
    private UUID examinationResultId;
    private LocalDateTime examinationDate;
    private String chiefComplaint;

    // Patient Context
    private UUID medicalRecordId;
    private UUID patientId;
    private String patientCode;
    private String patientName;
    private String patientPhone;
    private String patientEmail;

    // Dentist Context
    private UUID dentistId;
    private String dentistName;

    // Branch Context
    private String branchId;
    private String branchName;
    private String branchAddress;
}

package iuh.fit.backend.medicalrecord.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalRecordRequest {
    private UUID patientId;
    private String patientCode;
    private UUID dentistId;
    private UUID appointmentId;

    private String treatmentNotes;
    private LocalDateTime recordDate;
    private String fileName;
    private String address;
    private String dentalClinicName;
}

package iuh.fit.backend.medicalrecord.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalRecordDTO {
    private UUID id;

    // Patient info
    private UUID patientId;
    private String patientName;
    private String patientCode;
    private String patientPhone;

    // Dentist info
    private UUID dentistId;
    private String dentistName;

    // Appointment info
    private UUID appointmentId;

    private String diagnosis;
    private String treatmentNotes;
    private String symptoms;
    private LocalDateTime recordDate;
    private String fileName;
    private String address;
    private String dentalClinicName;

    @Builder.Default
    private List<ExaminationResultDTO> examinationResults = new ArrayList<>();
}

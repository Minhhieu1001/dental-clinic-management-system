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
    private String medicalRecordCode;

    // Patient info
    private UUID patientId;
    private String patientName;
    private String patientCode;
    private String patientPhone;
    private String patientEmail;
    private String patientGender;
    private LocalDateTime patientDob;
    private String patientCccd;
    private String patientAddress;
    private String systemicDisease;
    private String allergies;
    private String currentMedications;
    private String surgicalHistory;

    // Dentist info
    private UUID dentistId;
    private String dentistName;

    // Appointment info
    private UUID appointmentId;

    private String treatmentNotes;
    private LocalDateTime recordDate;
    private String fileName;
    private String address;
    private String dentalClinicName;

    @Builder.Default
    private List<ExaminationResultDTO> examinationResults = new ArrayList<>();
}

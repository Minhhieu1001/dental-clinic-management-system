package iuh.fit.backend.patient.dto;

import iuh.fit.backend.patient.enums.Gender;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientDTO {
    private UUID id;
    private String patientCode;
    private String fullName;
    private String phone;
    private String email;
    private String nationality;
    private Gender gender;
    private LocalDateTime dateOfBirth;
    private String address;
    private String systemicDisease;
    private String allergies;
    private String currentMedications;
    private String surgicalHistory;
    private LocalDateTime createdAt;
}

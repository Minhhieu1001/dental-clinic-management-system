package iuh.fit.backend.patient.dto;

import iuh.fit.backend.patient.enums.Gender;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientCreateDTO {
    private String fullName;
    private String phone;
    private String nationality;
    private Gender gender;
    private LocalDateTime dateOfBirth;
    private String address;
    private String systemicDisease;
    private String allergies;
    private String currentMedications;
    private String surgicalHistory;
    private String notes;
}

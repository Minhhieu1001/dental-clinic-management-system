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
public class PatientCreateDTO {
    private String fullName;
    private String phone;
    private String cccd;
    private String email;
    private String nationality;
    private String hometown;
    private String job;
    private Gender gender;
    private LocalDateTime dateOfBirth;
    private String address;
    private String systemicDisease;
    private String allergies;
    private String currentMedications;
    private String surgicalHistory;
    private String notes;

    // Required when creating: origin branch of the patient and initial medical record.
    // Ignored on profile update; the origin branch is immutable.
    private String branchId;

    // Doctor/Dentist ID (để trống nếu là lễ tân, có ID nếu là bác sĩ)
    private UUID doctorId;

}

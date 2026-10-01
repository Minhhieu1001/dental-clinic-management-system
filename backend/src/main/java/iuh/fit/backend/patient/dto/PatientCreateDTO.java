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
    private String email;
    private String nationality;
    private Gender gender;
    private LocalDateTime dateOfBirth;
    private String address;
    private String systemicDisease;
    private String allergies;
    private String currentMedications;
    private String surgicalHistory;
    private String notes;

    // 3 biến từ FE
    private String dentalClinicName;
    private String clinicAddress;
    private String fileName;

    // Doctor/Dentist ID (để trống nếu là lễ tân, có ID nếu là bác sĩ)
    private UUID doctorId;
}

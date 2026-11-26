package iuh.fit.backend.patient.dto;

import iuh.fit.backend.patient.enums.Gender;
import iuh.fit.backend.user.enums.StatusUser;
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
    private UUID userId;
    private StatusUser accountStatus;
    private String patientCode;
    private String createdBranchId;
    private String createdBranchName;
    private String fullName;
    private String phone;
    private String cccd;
    private String email;
    private String nationality;
    private String hometown;
    private String job;
    private String contactName;
    private String contactPhone;
    private String contactRelationship;
    private Gender gender;
    private LocalDateTime dateOfBirth;
    private String address;
    private String systemicDisease;
    private String allergies;
    private String currentMedications;
    private String surgicalHistory;
    private LocalDateTime createdAt;
}

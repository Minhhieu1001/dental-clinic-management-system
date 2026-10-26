package iuh.fit.backend.customercare.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FilterPatientItemDTO {
    private UUID patientId;
    private String patientCode;
    private String fullName;
    private String gender;
    private Integer birthYear;
    private String dateOfBirth;
    private String phoneNumber;
    private String email;
    private String cccd;
    private String customerGroup;
    private String customerSource;
    private String customerCard;
    private LocalDateTime createdAt;
    private String address;
    private String city;
    private String district;
    private String notes;
    private String lastDentist;
    private LocalDateTime lastAppointmentDate;
    private String treatmentStatus;
    private String procedureName;
    private String procedureGroup;
    private Long totalAppointments;
    private Long totalCareRecords;
}

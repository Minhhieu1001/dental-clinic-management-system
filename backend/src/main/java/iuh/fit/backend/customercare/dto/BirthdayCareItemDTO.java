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
public class BirthdayCareItemDTO {
    private UUID patientId;
    private String patientCode;
    private String patientName;
    private String phone;
    private String email;
    private LocalDateTime dateOfBirth;
    private String birthdayFormatted;
    private String fullDobFormatted;
    private Integer birthYear;
    private String careStatus;
    private String careChannel;
    private LocalDateTime careTime;
    private String careNotes;
    private String outcome;
    private LocalDateTime nextCareDate;
    private String assignedEmployeeName;
    private UUID lastCareId;
    private Boolean isToday;
    private Boolean isThisMonth;
    private Integer daysUntil;
    private Integer age;
    private String customerGroup;
}

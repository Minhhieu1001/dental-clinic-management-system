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
public class CustomerCareRecordRequestDTO {
    private UUID patientId;
    private UUID appointmentId;
    private UUID treatmentPlanId;
    private UUID prescriptionId;
    private UUID invoiceId;
    private UUID employeeId;
    private UUID dentistId;
    private String careType;
    private String channel;
    private String status;
    private LocalDateTime careTime;
    private String notes;
    private String createdByName;
}

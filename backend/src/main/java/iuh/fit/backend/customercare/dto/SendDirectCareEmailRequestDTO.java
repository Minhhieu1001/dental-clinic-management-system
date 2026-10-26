package iuh.fit.backend.customercare.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendDirectCareEmailRequestDTO {
    private UUID patientId;
    private String email;
    private String subject;
    private String message;
    private String careType;
    private UUID invoiceId;
    private UUID promotionId;
    private String couponCode;
    private String createdByName;
}

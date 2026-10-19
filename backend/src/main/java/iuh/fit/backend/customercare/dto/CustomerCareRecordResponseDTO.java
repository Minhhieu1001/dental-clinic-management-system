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
public class CustomerCareRecordResponseDTO {
    private UUID id;
    private UUID patientId;
    private String patientCode;
    private String patientName;
    private String phone;
    private String email;
    private String careType;
    private String careTypeLabel;
    private String channel;
    private String channelLabel;
    private String status;
    private String statusLabel;
    private LocalDateTime careTime;
    private String notes;
    private UUID invoiceId;
    private String invoiceCode;
    private UUID promotionId;
    private String promotionTitle;
    private String couponCode;
    private String createdByName;
    private LocalDateTime createdAt;
}

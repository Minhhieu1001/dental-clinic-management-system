package iuh.fit.backend.prescription.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionDTO {
    private UUID id;
    private UUID examinationResultId;
    private UUID medicalRecordId;
    private UUID patientId;
    private String patientCode;
    private String patientName;
    private String prescriptionCode;
    private String prescriptionName;
    private LocalDateTime prescriptionDate;
    private String prescriber;
    private UUID dentistId;
    private String dentistName;
    private String branchId;
    private String branchName;
    private String branchAddress;
    private String branchImage;
    private String clinicLogoUrl;
    private String clinicAddress;
    private String dentalClinicName;
    private String doctorAdvice;
    private BigDecimal totalAmount;
    @Builder.Default
    private List<PrescriptionDetailDTO> prescriptionDetails = new ArrayList<>();
}

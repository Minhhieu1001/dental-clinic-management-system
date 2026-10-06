package iuh.fit.backend.billing.dto;

import iuh.fit.backend.patient.enums.Gender;
import iuh.fit.backend.treatment.enums.StatusPhase;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientInvoiceDataResponse {

    private PatientSummaryDTO patientInfo;
    private List<UnbilledTreatmentPlanDTO> unbilledTreatmentPlans;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PatientSummaryDTO {
        private UUID id;
        private String patientCode;
        private String fullName;
        private String phone;
        private Gender gender;
        private LocalDateTime dateOfBirth;
        private String address;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UnbilledTreatmentPlanDTO {
        private UUID treatmentPlanId;
        private String planName;
        private String description;
        private StatusPhase status;
        private BigDecimal estimatedCost;
        private LocalDateTime startDate;
        private String doctorName;
        private String creatorName;

        // Thông tin Đợt khám & Chẩn đoán
        private UUID examinationResultId;
        private LocalDateTime examinationDate;
        private String chiefComplaint;
        private List<DiagnosisDTO> diagnoses;

        // Các giai đoạn điều trị
        private List<PhaseDTO> phases;

        // Danh sách dịch vụ gom tất cả giai đoạn chuẩn bị cho Hóa đơn
        private List<InvoiceServiceItemDTO> invoiceServices;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DiagnosisDTO {
        private UUID id;
        private String toothPosition;
        private String primaryDiagnosis;
        private String level;
        private String diagnosticNotes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PhaseDTO {
        private UUID id;
        private String phaseName;
        private String phaseOrder;
        private String treatmentType;
        private String description;
        private StatusPhase status;
        private List<InvoiceServiceItemDTO> services;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InvoiceServiceItemDTO {
        private UUID treatmentServiceId;
        private UUID serviceId;
        private String serviceName;
        private String toothNumber;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalAmount;
    }
}

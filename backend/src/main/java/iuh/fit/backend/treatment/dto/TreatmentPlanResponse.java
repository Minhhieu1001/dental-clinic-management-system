package iuh.fit.backend.treatment.dto;

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
public class TreatmentPlanResponse {
    private UUID id;
    private UUID patientId;
    private UUID examinationResultId;
    private String patientName;
    private String patientCode;
    private UUID dentistId;
    private String dentistName;
    private String planName;
    private String description;
    private BigDecimal estimatedCost;
    private Boolean status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private List<PhaseResponse> phases;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PhaseResponse {
        private UUID id;
        private String phaseName;
        private String phaseOrder;
        private String treatmentType;
        private String description;
        private StatusPhase status;
        private String estimatedDuration;
        private List<ServiceItemResponse> treatmentServices;
        private List<VisitItemResponse> treatmentVisits;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceItemResponse {
        private UUID id;
        private UUID serviceId;
        private String serviceName;
        private String toothNumber;
        private Integer quantity;
        private BigDecimal price;
        private BigDecimal totalAmount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VisitItemResponse {
        private UUID visitId;
        private String visitName;
        private Integer visitOrder;
        private String startDate;
        private StatusPhase status;
        private String clinicalNotes;
    }
}

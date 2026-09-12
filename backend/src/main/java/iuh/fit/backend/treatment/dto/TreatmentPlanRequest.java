package iuh.fit.backend.treatment.dto;

import iuh.fit.backend.treatment.enums.StatusPhase;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TreatmentPlanRequest {
    private UUID patientId;
    private UUID examinationResultId;
    private UUID dentistId;
    private String dentistName;
    private String planName;
    private String description;
    private BigDecimal estimatedCost;
    private Boolean status;
    private String startDate;
    private String endDate;
    private List<PhaseRequest> phases;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PhaseRequest {
        private String phaseName;
        private String phaseOrder;
        private String treatmentType;
        private String description;
        private StatusPhase status;
        private String estimatedDuration;
        private List<ServiceItemRequest> treatmentServices;
        private List<VisitItemRequest> treatmentVisits;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceItemRequest {
        private UUID serviceId;
        private String toothNumber;
        private Integer quantity;
        private BigDecimal price;
        private BigDecimal totalAmount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VisitItemRequest {
        private String visitName;
        private Integer visitOrder;
        private String startDate;
        private StatusPhase status;
        private String clinicalNotes;
    }
}

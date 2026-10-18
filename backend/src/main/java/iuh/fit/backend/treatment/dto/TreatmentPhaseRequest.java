package iuh.fit.backend.treatment.dto;

import iuh.fit.backend.treatment.enums.StatusPhase;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TreatmentPhaseRequest {
    private String phaseName;
    private String phaseOrder;
    private String treatmentType;
    private String description;
    private StatusPhase status;
    private String estimatedDuration;
    private LocalDateTime expectedStartDate;
    private LocalDateTime expectedEndDate;
}

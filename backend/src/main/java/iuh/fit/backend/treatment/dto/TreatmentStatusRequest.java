package iuh.fit.backend.treatment.dto;

import iuh.fit.backend.treatment.enums.StatusPhase;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TreatmentStatusRequest {
    @NotNull(message = "Trạng thái điều trị không được để trống")
    private StatusPhase status;
}

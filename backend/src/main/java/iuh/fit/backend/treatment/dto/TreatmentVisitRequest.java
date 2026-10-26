package iuh.fit.backend.treatment.dto;

import iuh.fit.backend.treatment.enums.StatusPhase;
import lombok.Data;
import jakarta.validation.constraints.Size;

@Data
public class TreatmentVisitRequest {
    private String visitName;
    private Integer visitOrder;
    private String startDate;
    private StatusPhase status;
    private String clinicalNotes;
    private String assignedDentist;

    @Size(max = 255, message = "Tên cơ sở không được vượt quá 255 ký tự")
    private String facilityName;

    @Size(max = 500, message = "Địa chỉ cơ sở không được vượt quá 500 ký tự")
    private String facilityAddress;
}

package iuh.fit.backend.medicalrecord.dto;

import iuh.fit.backend.medicalrecord.enums.CariesLocation;
import iuh.fit.backend.medicalrecord.enums.Level;
import iuh.fit.backend.medicalrecord.enums.ToothStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ToothRecordRequest {
    private UUID examinationResultId;

    @NotBlank(message = "Số răng không được để trống")
    private String toothNumber;

    private ToothStatus toothStatus;
    private Level severity;
    private Boolean hasCaries;
    private CariesLocation cariesLocation;
    private String painType;
    private String cariesDepth;
    private String gingivalCondition;
}

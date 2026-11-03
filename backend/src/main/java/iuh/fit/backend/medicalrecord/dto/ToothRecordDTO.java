package iuh.fit.backend.medicalrecord.dto;

import iuh.fit.backend.medicalrecord.enums.CariesLocation;
import iuh.fit.backend.medicalrecord.enums.Level;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ToothRecordDTO {
    private UUID id;
    private UUID examinationResultId;
    private String toothNumber;
    private String toothStatus;
    private Level severity;
    private Boolean hasCaries;
    private CariesLocation cariesLocation;
    private String painType;
    private String cariesDepth;
    private String gingivalCondition;
    private String shake;
}

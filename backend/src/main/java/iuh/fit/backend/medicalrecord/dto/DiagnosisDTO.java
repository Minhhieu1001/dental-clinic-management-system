package iuh.fit.backend.medicalrecord.dto;

import iuh.fit.backend.medicalrecord.enums.Level;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiagnosisDTO {
    private UUID id;
    private UUID examinationResultId;
    private String toothPosition;
    private String primaryDiagnosis;
    private Level level;
    private String sourceOfInformation;
    private String diagnosticNotes;
}

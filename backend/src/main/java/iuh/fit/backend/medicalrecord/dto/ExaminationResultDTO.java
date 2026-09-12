package iuh.fit.backend.medicalrecord.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExaminationResultDTO {
    private UUID id;
    private UUID medicalRecordId;
    private String chiefComplaint;
    private LocalDateTime examinationDate;
    private DiagnosisDTO diagnosis;
    @Builder.Default
    private List<DiagnosisDTO> diagnoses = new ArrayList<>();
    @Builder.Default
    private List<ToothRecordDTO> toothRecords = new ArrayList<>();
    private UUID treatmentPlanId;
}

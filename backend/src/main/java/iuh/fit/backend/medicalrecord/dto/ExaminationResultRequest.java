package iuh.fit.backend.medicalrecord.dto;

import jakarta.validation.constraints.NotNull;
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
public class ExaminationResultRequest {
    @NotNull(message = "medicalRecordId không được để trống")
    private UUID medicalRecordId;

    private UUID dentistId;
    private String chiefComplaint;
    private LocalDateTime examinationDate;
    private DiagnosisRequest diagnosis;
    private String branchId;
    @Builder.Default
    private List<DiagnosisRequest> diagnoses = new ArrayList<>();

    @Builder.Default
    private List<ToothRecordRequest> toothRecords = new ArrayList<>();

    private Boolean disabled;
}

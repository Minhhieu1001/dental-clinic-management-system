package iuh.fit.backend.medicalrecord.service;

import iuh.fit.backend.medicalrecord.dto.ExaminationResultDTO;
import iuh.fit.backend.medicalrecord.dto.ExaminationResultRequest;

import java.util.List;
import java.util.UUID;

public interface ExaminationResultService {

    List<ExaminationResultDTO> getAllExaminationResults();

    ExaminationResultDTO getExaminationResultById(UUID id);

    List<ExaminationResultDTO> getExaminationResultsByMedicalRecordId(UUID medicalRecordId);

    List<ExaminationResultDTO> getExaminationResultsByPatientId(UUID patientId);

    ExaminationResultDTO createExaminationResult(ExaminationResultRequest request);

    ExaminationResultDTO updateExaminationResult(UUID id, ExaminationResultRequest request);

    void deleteExaminationResult(UUID id);
}

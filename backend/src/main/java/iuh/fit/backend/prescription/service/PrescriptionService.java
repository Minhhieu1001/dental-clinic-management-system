package iuh.fit.backend.prescription.service;

import iuh.fit.backend.prescription.dto.PrescriptionDTO;
import iuh.fit.backend.prescription.dto.PrescriptionRequestDTO;

import java.util.List;
import java.util.UUID;

public interface PrescriptionService {
    List<PrescriptionDTO> getAllPrescriptions(UUID patientId, UUID examinationResultId, String patientCode);

    PrescriptionDTO getPrescriptionById(UUID id);

    List<PrescriptionDTO> getPrescriptionsByExaminationResultId(UUID examinationResultId);

    List<PrescriptionDTO> getPrescriptionsByPatientId(UUID patientId);

    List<PrescriptionDTO> getPrescriptionsByPatientCode(String patientCode);

    PrescriptionDTO createPrescription(PrescriptionRequestDTO request);

    PrescriptionDTO updatePrescription(UUID id, PrescriptionRequestDTO request);

    void deletePrescription(UUID id);
}

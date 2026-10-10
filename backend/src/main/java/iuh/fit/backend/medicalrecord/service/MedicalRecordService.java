package iuh.fit.backend.medicalrecord.service;

import iuh.fit.backend.medicalrecord.dto.MedicalRecordDTO;
import iuh.fit.backend.medicalrecord.dto.MedicalRecordRequest;

import java.util.List;
import java.util.UUID;

public interface MedicalRecordService {

    List<MedicalRecordDTO> getAllMedicalRecords();

    List<MedicalRecordDTO> getMedicalRecords(String search, String gender, UUID dentistId, String dentistName, Integer year, Integer month);

    MedicalRecordDTO getMedicalRecordById(UUID id);

    MedicalRecordDTO getMedicalRecordByCode(String medicalRecordCode);

    List<MedicalRecordDTO> getMedicalRecordsByPatientId(UUID patientId);

    List<MedicalRecordDTO> getMedicalRecordsByPatientCode(String patientCode);

    MedicalRecordDTO createMedicalRecord(MedicalRecordRequest request);

    MedicalRecordDTO updateMedicalRecord(UUID id, MedicalRecordRequest request);

    void deleteMedicalRecord(UUID id);
}

package iuh.fit.backend.patient.service;

import iuh.fit.backend.patient.dto.PatientCreateDTO;
import iuh.fit.backend.patient.dto.PatientDTO;
import iuh.fit.backend.billing.dto.PatientInvoiceDataResponse;

import java.util.List;
import java.util.UUID;

public interface PatientService {
    List<PatientDTO> getAllPatients();
    PatientDTO getPatientById(UUID id);
    List<PatientDTO> getPatientsByPhoneNumber(String phoneNumber);
    PatientDTO searchPatient(String keyword);
    PatientDTO createPatient(PatientCreateDTO dto);
    PatientDTO updatePatient(UUID id, PatientCreateDTO dto);
    void deletePatient(UUID id);
    PatientDTO getPatientByPatientCode(String code);
    PatientInvoiceDataResponse getRawInvoiceDataByPatientCode(String patientCode);
}

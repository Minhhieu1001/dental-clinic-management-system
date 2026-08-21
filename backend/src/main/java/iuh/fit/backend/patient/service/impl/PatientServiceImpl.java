package iuh.fit.backend.patient.service.impl;

import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.exception.ErrorCode;
import iuh.fit.backend.patient.dto.PatientCreateDTO;
import iuh.fit.backend.patient.dto.PatientDTO;
import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.patient.repository.PatientRepository;
import iuh.fit.backend.patient.service.PatientService;
import iuh.fit.backend.user.entity.User;
import iuh.fit.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PatientServiceImpl implements PatientService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<PatientDTO> getAllPatients() {
        return patientRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PatientDTO getPatientById(UUID id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy hồ sơ bệnh nhân ID: " + id));
        return mapToDTO(patient);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PatientDTO> getPatientsByPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return getAllPatients();
        }
        return patientRepository.findByPhoneNumberOrderByCreatedAtDesc(phoneNumber.trim())
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PatientDTO createPatient(PatientCreateDTO dto) {
        String patientCode = "PA-" + (System.currentTimeMillis() % 1000000);
        Patient patient = Patient.builder()
                .patientCode(patientCode)
                .phoneNumber(dto.getPhone())
                .nationality(dto.getNationality())
                .fullName(dto.getFullName() != null ? dto.getFullName().trim() : "Bệnh nhân mới")
                .gender(dto.getGender())
                .dateOfBirth(dto.getDateOfBirth())
                .address(dto.getAddress())
                .systemicDisease(dto.getSystemicDisease())
                .allergies(dto.getAllergies())
                .currentMedications(dto.getCurrentMedications())
                .surgicalHistory(dto.getSurgicalHistory())
                .createdAt(LocalDateTime.now())
                .build();

        patient = patientRepository.save(patient);
        log.info("Successfully created patient: {} ({})", patient.getFullName(), patient.getPatientCode());
        return mapToDTO(patient);
    }

    @Override
    @Transactional
    public PatientDTO updatePatient(UUID id, PatientCreateDTO dto) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy hồ sơ bệnh nhân ID: " + id));

        if (dto.getFullName() != null && !dto.getFullName().trim().isEmpty()) {
            patient.setFullName(dto.getFullName().trim());
        }
        if (dto.getGender() != null) {
            patient.setGender(dto.getGender());
        }
        if (dto.getNationality() != null) {
            patient.setNationality(dto.getNationality().trim());
        }
        if (dto.getDateOfBirth() != null) {
            patient.setDateOfBirth(dto.getDateOfBirth());
        }
        if (dto.getAddress() != null) {
            patient.setAddress(dto.getAddress().trim());
        }
        patient.setSystemicDisease(dto.getSystemicDisease() != null ? dto.getSystemicDisease().trim() : null);
        patient.setAllergies(dto.getAllergies() != null ? dto.getAllergies().trim() : null);
        patient.setCurrentMedications(dto.getCurrentMedications() != null ? dto.getCurrentMedications().trim() : null);
        patient.setSurgicalHistory(dto.getSurgicalHistory() != null ? dto.getSurgicalHistory().trim() : null);

        // Link User if phone changed and user exists
        if (dto.getPhone() != null && !dto.getPhone().trim().isEmpty()) {
            patient.setPhoneNumber(dto.getPhone().trim());
        }

        patient = patientRepository.save(patient);
        log.info("Successfully updated patient ID: {}", id);
        return mapToDTO(patient);
    }

    @Override
    @Transactional
    public void deletePatient(UUID id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy hồ sơ bệnh nhân ID: " + id));
        patientRepository.delete(patient);
        log.info("Successfully deleted patient ID: {}", id);
    }

    @Override
    public PatientDTO getPatientByPatientCode(String code) {
        Patient patient = patientRepository.findByPatientCode(code)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy hồ sơ bệnh nhân : " + code));
        return mapToDTO(patient);
    }

    private PatientDTO mapToDTO(Patient patient) {
        String phoneStr = patient.getPhoneNumber() != null ? patient.getPhoneNumber().trim() : "";

        return PatientDTO.builder()
                .id(patient.getId())
                .patientCode(patient.getPatientCode())
                .fullName(patient.getFullName())
                .phone(phoneStr)
                .nationality(patient.getNationality())
                .gender(patient.getGender())
                .dateOfBirth(patient.getDateOfBirth())
                .address(patient.getAddress())
                .systemicDisease(patient.getSystemicDisease())
                .allergies(patient.getAllergies())
                .currentMedications(patient.getCurrentMedications())
                .surgicalHistory(patient.getSurgicalHistory())
                .createdAt(patient.getCreatedAt())
                .build();
    }
}

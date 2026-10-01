package iuh.fit.backend.patient.service.impl;

import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.exception.ErrorCode;
import iuh.fit.backend.medicalrecord.entity.MedicalRecord;
import iuh.fit.backend.medicalrecord.repository.MedicalRecordRepository;
import iuh.fit.backend.patient.dto.PatientCreateDTO;
import iuh.fit.backend.patient.dto.PatientDTO;
import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.patient.repository.PatientRepository;
import iuh.fit.backend.patient.service.PatientService;
import iuh.fit.backend.user.entity.Dentist;
import iuh.fit.backend.user.entity.User;
import iuh.fit.backend.user.enums.Role;
import iuh.fit.backend.user.repository.DentistRepository;
import iuh.fit.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    private final DentistRepository dentistRepository;
    private final MedicalRecordRepository medicalRecordRepository;

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
                .email(dto.getEmail() != null ? dto.getEmail().trim() : null)
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

        // Tự động tạo hồ sơ bệnh án (MedicalRecord) mặc định cho bệnh nhân mới
        try {
            // Xác định bác sĩ phụ trách (Dentist):
            // - Nếu là Lễ tân (EMPLOYEE) -> để trống doctorId (assignedDentist = null)
            // - Nếu là Bác sĩ (DENTIST) -> cập nhật luôn ID của bác sĩ đó
            Dentist assignedDentist = null;

            // 1. Kiểm tra doctorId truyền từ FE (nếu có)
            if (dto.getDoctorId() != null) {
                assignedDentist = dentistRepository.findById(dto.getDoctorId())
                        .orElseGet(() -> dentistRepository.findByUserId(dto.getDoctorId()).orElse(null));
            }

            // 2. Nếu FE không truyền doctorId, tự động phát hiện từ người dùng đăng nhập hiện tại
            if (assignedDentist == null) {
                try {
                    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                    if (auth != null && auth.getName() != null && !auth.getName().equalsIgnoreCase("anonymousUser")) {
                        String username = auth.getName();
                        User currentUser = userRepository.findByUsername(username)
                                .orElseGet(() -> userRepository.findByEmail(username).orElse(null));
                        if (currentUser != null && currentUser.getRole() == Role.DENTIST) {
                            assignedDentist = dentistRepository.findByUserId(currentUser.getId()).orElse(null);
                        }
                        // Nếu là EMPLOYEE (Lễ tân) thì assignedDentist vẫn là null -> để trống doctorId
                    }
                } catch (Exception ex) {
                    log.warn("Không thể xác định thông tin người dùng đang đăng nhập: {}", ex.getMessage());
                }
            }

            // 3 biến truyền từ FE: tên bệnh viện/phòng khám, địa chỉ bệnh viện, tên hồ sơ
            String clinicName = (dto.getDentalClinicName() != null && !dto.getDentalClinicName().trim().isEmpty())
                    ? dto.getDentalClinicName().trim()
                    : "Nha Khoa Quốc Tế Crown Dental";

            String clinicAddress = (dto.getClinicAddress() != null && !dto.getClinicAddress().trim().isEmpty())
                    ? dto.getClinicAddress().trim()
                    : (patient.getAddress() != null && !patient.getAddress().trim().isEmpty()
                            ? patient.getAddress().trim()
                            : "12 Nguyễn Văn Bảo, Phường 4, Quận Gò Vấp, TP. Hồ Chí Minh");

            String defaultFileName = "Hồ sơ điện tử răng hàm mặt";

            String fileName = (dto.getFileName() != null && !dto.getFileName().trim().isEmpty())
                    ? dto.getFileName().trim()
                    : defaultFileName;

            String symptoms = (dto.getNotes() != null && !dto.getNotes().trim().isEmpty())
                    ? dto.getNotes().trim()
                    : "Khám sức khỏe răng miệng ban đầu";

            MedicalRecord medicalRecord = MedicalRecord.builder()
                    .patient(patient)
                    .dentist(assignedDentist)
                    .fileName(fileName)
                    .dentalClinicName(clinicName)
                    .address(clinicAddress)
                    .symptoms(symptoms)
                    .recordDate(LocalDateTime.now())
                    .build();

            medicalRecordRepository.save(medicalRecord);
            log.info("Successfully created default medical record for patient: {} (File: {}, Dentist: {})",
                    patient.getPatientCode(), fileName, (assignedDentist != null ? assignedDentist.getId() : "NONE (Receptionist)"));
        } catch (Exception e) {
            log.error("Failed to create default medical record for patient {}: {}", patient.getPatientCode(), e.getMessage(), e);
        }

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
        if (dto.getEmail() != null) {
            patient.setEmail(dto.getEmail().trim());
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
                .email(patient.getEmail())
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

package iuh.fit.backend.auth.service;

import iuh.fit.backend.auth.dto.CodeResponse;
import iuh.fit.backend.auth.dto.RegisterRequest;
import iuh.fit.backend.auth.dto.RegistrationResponse;
import iuh.fit.backend.auth.dto.VerifyRequest;
import iuh.fit.backend.auth.entity.PatientRegistration;
import iuh.fit.backend.auth.repository.PatientRegistrationRepository;
import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.exception.ErrorCode;
import iuh.fit.backend.inforclinic.entity.Branch;
import iuh.fit.backend.inforclinic.enums.BranchStatus;
import iuh.fit.backend.inforclinic.repository.BranchRepository;
import iuh.fit.backend.medicalrecord.entity.MedicalRecord;
import iuh.fit.backend.medicalrecord.repository.MedicalRecordRepository;
import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.patient.repository.PatientRepository;
import iuh.fit.backend.user.entity.User;
import iuh.fit.backend.user.enums.Role;
import iuh.fit.backend.user.enums.StatusUser;
import iuh.fit.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PatientRegistrationService {
    private final PatientRegistrationRepository registrations;
    private final UserRepository users;
    private final PatientRepository patients;
    private final MedicalRecordRepository records;
    private final PasswordEncoder encoder;
    private final PatientRegistrationMailService mail;
    private final ApplicationEventPublisher events;
    private final JdbcTemplate jdbc;
    private final BranchRepository branches;
    private final SecureRandom random = new SecureRandom();

    @Transactional
    public CodeResponse register(RegisterRequest request) {
        if (!request.password().equals(request.confirmPassword())
                || request.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Mật khẩu xác nhận phải khớp và mật khẩu không vượt quá 72 byte UTF-8");
        }
        String email = normalizeEmail(request.email());
        lockEmail(email);
        String phone = normalizePhone(request.phone());
        checkEligibility(email, phone);
        PatientRegistration pending = registrations.findById(email).orElseGet(PatientRegistration::new);
        checkCooldown(pending);
        Branch branch = requireActiveBranch(request.branchId());
        pending.setEmail(email);
        pending.setBranchId(branch.getBranchId());
        pending.setFullName(request.fullName().trim());
        pending.setDateOfBirth(request.dateOfBirth());
        pending.setGender(request.gender());
        pending.setAddress(request.address().trim());
        pending.setPhone(phone);
        pending.setPasswordHash(encoder.encode(request.password()));
        return sendCode(pending);
    }

    @Transactional
    public CodeResponse resend(String rawEmail) {
        String email = normalizeEmail(rawEmail);
        lockEmail(email);
        PatientRegistration pending = requirePending(email);
        checkCooldown(pending);
        checkEligibility(email, pending.getPhone());
        requireActiveBranch(pending.getBranchId());
        return sendCode(pending);
    }

    // Only invalid OTP attempts commit on error; creation failures always roll back all three entities.
    @Transactional(noRollbackFor = InvalidOtpException.class)
    public RegistrationResponse verify(VerifyRequest request) {
        String email = normalizeEmail(request.email());
        lockEmail(email);
        PatientRegistration pending = requirePending(email);
        if (!Instant.now().isBefore(pending.getExpiresAt())) {
            throw new AppException(ErrorCode.REGISTRATION_CODE_EXPIRED);
        }
        if (pending.getFailedAttempts() >= 5) {
            throw new AppException(ErrorCode.REGISTRATION_TOO_MANY_ATTEMPTS);
        }
        if (!encoder.matches(request.code(), pending.getCodeHash())) {
            pending.setFailedAttempts(pending.getFailedAttempts() + 1);
            registrations.save(pending);
            throw new InvalidOtpException(pending.getFailedAttempts() >= 5
                    ? ErrorCode.REGISTRATION_TOO_MANY_ATTEMPTS : ErrorCode.REGISTRATION_CODE_INVALID);
        }
        // PostgreSQL lock covers count + insert, including concurrent inserts from other flows.
        jdbc.execute("LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE");
        checkEligibility(email, pending.getPhone());
        Branch branch = requireActiveBranch(pending.getBranchId());
        String code = generatePatientCode();
        User user = users.save(User.builder().username(code).codeName(code).email(email)
                .phone(pending.getPhone()).password(pending.getPasswordHash())
                .role(Role.PATIENT).status(StatusUser.ACTIVE).build());
        Patient patient = patients.save(Patient.builder().patientCode(code).fullName(pending.getFullName())
                .createdBranch(branch)
                .dateOfBirth(pending.getDateOfBirth() == null ? null : pending.getDateOfBirth().atStartOfDay())
                .gender(pending.getGender()).address(pending.getAddress())
                .email(email).phoneNumber(pending.getPhone()).user(user).build());
        records.save(MedicalRecord.builder().patient(patient).branch(branch)
                .recordDate(LocalDateTime.now()).build());
        registrations.delete(pending);
        events.publishEvent(new PatientRegistrationMailService.Registered(email, code));
        return new RegistrationResponse(user.getId(), patient.getId(), code, branch.getBranchId(), branch.getBranchName());
    }

    private Branch requireActiveBranch(String branchId) {
        if (branchId == null || branchId.isBlank()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Vui lòng chọn cơ sở và gửi lại thông tin đăng ký");
        }
        Branch branch = branches.findById(branchId.trim())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Cơ sở đã chọn không tồn tại"));
        if (branch.getStatus() != BranchStatus.ACTIVE) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Cơ sở đã chọn hiện không hoạt động. Vui lòng chọn cơ sở khác");
        }
        return branch;
    }

    private String generatePatientCode() {
        String code;
        do {
            code = "PA-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
        } while (users.existsByCodeName(code) || patients.existsByPatientCode(code));
        return code;
    }

    private CodeResponse sendCode(PatientRegistration pending) {
        String code = String.format(Locale.ROOT, "%06d", random.nextInt(1_000_000));
        pending.setCodeHash(encoder.encode(code));
        mail.sendOtp(pending.getEmail(), code);
        pending.setExpiresAt(Instant.now().plusSeconds(60));
        pending.setFailedAttempts(0);
        registrations.save(pending);
        return new CodeResponse(pending.getExpiresAt(), 60);
    }

    private void checkCooldown(PatientRegistration pending) {
        if (pending.getExpiresAt() != null && Instant.now().isBefore(pending.getExpiresAt())) {
            throw new AppException(ErrorCode.REGISTRATION_RESEND_TOO_SOON);
        }
    }

    private PatientRegistration requirePending(String email) {
        return registrations.findById(email)
                .orElseThrow(() -> new AppException(ErrorCode.REGISTRATION_CODE_INVALID));
    }

    private void checkEligibility(String email, String phone) {
        if (users.existsByEmailIgnoreCase(email)) throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        if (users.countByNormalizedPhone(phone) >= 2) throw new AppException(ErrorCode.PHONE_ACCOUNT_LIMIT);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    static String normalizePhone(String phone) {
        String digits = phone.replaceAll("[^0-9]", "");
        return digits.startsWith("84") ? "0" + digits.substring(2) : digits;
    }

    private void lockEmail(String email) {
        jdbc.execute((ConnectionCallback<Void>) connection -> {
            try (var statement = connection.prepareStatement("SELECT pg_advisory_xact_lock(hashtext(?))")) {
                statement.setString(1, "patient-registration:" + email);
                statement.execute();
            }
            return null;
        });
    }

    private static class InvalidOtpException extends AppException {
        InvalidOtpException(ErrorCode code) { super(code); }
    }
}

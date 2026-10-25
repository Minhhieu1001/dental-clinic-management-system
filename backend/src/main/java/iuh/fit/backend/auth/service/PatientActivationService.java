package iuh.fit.backend.auth.service;

import iuh.fit.backend.auth.dto.PatientActivationRequest;
import iuh.fit.backend.auth.dto.PatientActivationCodeResponse;
import iuh.fit.backend.auth.dto.PatientActivationVerifyRequest;
import iuh.fit.backend.auth.dto.PatientActivationVerifyResponse;
import iuh.fit.backend.auth.dto.PatientActivationCompleteRequest;
import iuh.fit.backend.auth.dto.RegistrationResponse;
import iuh.fit.backend.auth.entity.PatientActivation;
import iuh.fit.backend.auth.repository.PatientActivationRepository;
import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.exception.ErrorCode;
import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.patient.repository.PatientRepository;
import iuh.fit.backend.user.entity.User;
import iuh.fit.backend.user.enums.Role;
import iuh.fit.backend.user.enums.StatusUser;
import iuh.fit.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PatientActivationService {
    private final PatientRepository patients;
    private final UserRepository users;
    private final PatientActivationRepository activations;
    private final PasswordEncoder encoder;
    private final PatientRegistrationMailService mail;
    private final JdbcTemplate jdbc;
    private final ApplicationEventPublisher events;
    private final SecureRandom random = new SecureRandom();

    @Transactional
    public PatientActivationCodeResponse requestCode(PatientActivationRequest request) {
        Patient patient = patients.findForActivationByCode(request.patientCode().trim())
                .orElseThrow(() -> new AppException(ErrorCode.ACTIVATION_PATIENT_MISMATCH));
        if (!phone(request.phone()).equals(phone(patient.getPhoneNumber()))) {
            throw new AppException(ErrorCode.ACTIVATION_PATIENT_MISMATCH);
        }
        checkAccountEligibility(patient);
        PatientActivation session = activations.findById(patient.getId()).orElseGet(PatientActivation::new);
        checkCooldown(session);
        session.setPatientId(patient.getId());
        session.setPatientCode(patient.getPatientCode());
        session.setPhone(phone(patient.getPhoneNumber()));
        // This address is only the OTP destination, not the patient's account email.
        session.setEmail(email(request.email()));
        return sendCode(session);
    }

    @Transactional
    public PatientActivationCodeResponse resend(UUID activationId) {
        Patient patient = requirePatient(activationId);
        PatientActivation session = requireSession(activationId);
        checkCooldown(session);
        checkSnapshot(patient, session);
        checkAccountEligibility(patient);
        return sendCode(session);
    }

    @Transactional(noRollbackFor = InvalidOtpException.class)
    public PatientActivationVerifyResponse verify(PatientActivationVerifyRequest request) {
        Patient patient = requirePatient(request.activationId());
        PatientActivation session = requireSession(request.activationId());
        if (session.getCodeHash() == null) throw new AppException(ErrorCode.ACTIVATION_CODE_INVALID);
        if (!Instant.now().isBefore(session.getCodeExpiresAt())) throw new AppException(ErrorCode.ACTIVATION_CODE_EXPIRED);
        if (session.getFailedAttempts() >= 5) throw new AppException(ErrorCode.ACTIVATION_TOO_MANY_ATTEMPTS);
        if (!encoder.matches(request.code(), session.getCodeHash())) {
            session.setFailedAttempts(session.getFailedAttempts() + 1);
            activations.save(session);
            throw new InvalidOtpException(session.getFailedAttempts() >= 5
                    ? ErrorCode.ACTIVATION_TOO_MANY_ATTEMPTS : ErrorCode.ACTIVATION_CODE_INVALID);
        }
        checkSnapshot(patient, session);
        checkAccountEligibility(patient);
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        session.setTokenHash(encoder.encode(token));
        session.setTokenExpiresAt(Instant.now().plusSeconds(300));
        session.setCodeHash(null);
        activations.save(session);
        return new PatientActivationVerifyResponse(patient.getFullName(), token, session.getTokenExpiresAt());
    }

    @Transactional
    public RegistrationResponse complete(PatientActivationCompleteRequest request) {
        if (!request.password().equals(request.confirmPassword())
                || request.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Mật khẩu xác nhận phải khớp và mật khẩu không vượt quá 72 byte UTF-8");
        }
        Patient patient = requirePatient(request.activationId());
        PatientActivation session = requireSession(request.activationId());
        if (session.getTokenHash() == null || session.getTokenExpiresAt() == null
                || !Instant.now().isBefore(session.getTokenExpiresAt())
                || !encoder.matches(request.activationToken(), session.getTokenHash())) {
            throw new AppException(ErrorCode.ACTIVATION_TOKEN_INVALID);
        }
        checkSnapshot(patient, session);
        // Share the registration flow's count-and-insert lock for the two-account phone limit.
        jdbc.execute("LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE");
        checkAccountEligibility(patient);
        User user = users.save(User.builder()
                .username(patient.getPatientCode()).codeName(patient.getPatientCode())
                .phone(patient.getPhoneNumber()).email(patient.getEmail())
                .password(encoder.encode(request.password())).role(Role.PATIENT).status(StatusUser.ACTIVE)
                .build());
        patient.setUser(user);
        patients.save(patient);
        activations.delete(session);
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            events.publishEvent(new PatientRegistrationMailService.Registered(user.getEmail(), patient.getPatientCode()));
        }
        return new RegistrationResponse(user.getId(), patient.getId(), patient.getPatientCode());
    }

    private PatientActivationCodeResponse sendCode(PatientActivation session) {
        String code = String.format(Locale.ROOT, "%06d", random.nextInt(1_000_000));
        session.setCodeHash(encoder.encode(code));
        mail.sendActivationOtp(session.getEmail(), code);
        session.setCodeExpiresAt(Instant.now().plusSeconds(120));
        session.setFailedAttempts(0);
        session.setTokenHash(null);
        session.setTokenExpiresAt(null);
        activations.save(session);
        return new PatientActivationCodeResponse(session.getPatientId(), session.getCodeExpiresAt(), 120);
    }

    private void checkAccountEligibility(Patient patient) {
        if (patient.getUser() != null || users.existsByCodeName(patient.getPatientCode())) {
            throw new AppException(ErrorCode.PATIENT_ALREADY_ACTIVATED);
        }
        if (users.countByNormalizedPhone(phone(patient.getPhoneNumber())) >= 2) throw new AppException(ErrorCode.PHONE_ACCOUNT_LIMIT);
    }

    private void checkSnapshot(Patient patient, PatientActivation session) {
        if (!Objects.equals(session.getPatientCode(), patient.getPatientCode())
                || !Objects.equals(session.getPhone(), phone(patient.getPhoneNumber()))) {
            throw new AppException(ErrorCode.ACTIVATION_PROFILE_CHANGED);
        }
    }

    private void checkCooldown(PatientActivation session) {
        if (session.getCodeExpiresAt() != null && Instant.now().isBefore(session.getCodeExpiresAt())) {
            throw new AppException(ErrorCode.ACTIVATION_RESEND_TOO_SOON);
        }
    }

    private Patient requirePatient(UUID id) {
        return patients.findForActivationById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ACTIVATION_CODE_INVALID));
    }

    private PatientActivation requireSession(UUID id) {
        return activations.findById(id).orElseThrow(() -> new AppException(ErrorCode.ACTIVATION_CODE_INVALID));
    }

    private String phone(String value) {
        return value == null ? "" : PatientRegistrationService.normalizePhone(value);
    }

    private String email(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private static class InvalidOtpException extends AppException {
        InvalidOtpException(ErrorCode code) { super(code); }
    }
}

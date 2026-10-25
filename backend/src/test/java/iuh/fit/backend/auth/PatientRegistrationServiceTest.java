package iuh.fit.backend.auth;

import iuh.fit.backend.auth.dto.CodeResponse;
import iuh.fit.backend.auth.dto.RegisterRequest;
import iuh.fit.backend.auth.dto.RegistrationResponse;
import iuh.fit.backend.auth.dto.VerifyRequest;
import iuh.fit.backend.auth.entity.PatientRegistration;
import iuh.fit.backend.auth.repository.PatientRegistrationRepository;
import iuh.fit.backend.auth.service.PatientRegistrationMailService;
import iuh.fit.backend.auth.service.PatientRegistrationService;
import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.exception.ErrorCode;
import iuh.fit.backend.inforclinic.entity.Branch;
import iuh.fit.backend.inforclinic.enums.BranchStatus;
import iuh.fit.backend.inforclinic.repository.BranchRepository;
import org.junit.jupiter.api.BeforeEach;
import iuh.fit.backend.medicalrecord.entity.MedicalRecord;
import iuh.fit.backend.medicalrecord.repository.MedicalRecordRepository;
import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.patient.repository.PatientRepository;
import iuh.fit.backend.user.entity.User;
import iuh.fit.backend.user.enums.Role;
import iuh.fit.backend.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.Instant;
import java.time.LocalDate;
import iuh.fit.backend.patient.enums.Gender;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PatientRegistrationServiceTest {
    private final PatientRegistrationRepository registrations = mock(PatientRegistrationRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final PatientRepository patients = mock(PatientRepository.class);
    private final MedicalRecordRepository records = mock(MedicalRecordRepository.class);
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private final PatientRegistrationMailService mail = mock(PatientRegistrationMailService.class);
    private final ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final BranchRepository branches = mock(BranchRepository.class);
    private final Branch branch = Branch.builder().branchId("BR-01").status(BranchStatus.ACTIVE).build();
    private final PatientRegistrationService service = new PatientRegistrationService(
            registrations, users, patients, records, encoder, mail, events, jdbc, branches);
    private static final String EMAIL = "patient@gmail.com";

    @BeforeEach
    void setupBranch() {
        when(branches.findById("BR-01")).thenReturn(Optional.of(branch));
    }

    private RegisterRequest request() {
        return new RegisterRequest("Nguyen Van A", LocalDate.of(2000, 5, 20), Gender.MALE,
                "12 Nguyen Trai, TP.HCM", "BR-01", EMAIL, "+84901234567", "password123", "password123");
    }

    private PatientRegistration pending() {
        PatientRegistration pending = new PatientRegistration();
        pending.setEmail(EMAIL);
        pending.setBranchId("BR-01");
        pending.setPhone("0901234567");
        pending.setFullName("Nguyen Van A");
        pending.setDateOfBirth(LocalDate.of(2000, 5, 20));
        pending.setGender(Gender.MALE);
        pending.setAddress("12 Nguyen Trai, TP.HCM");
        pending.setPasswordHash(encoder.encode("password123"));
        pending.setCodeHash(encoder.encode("123456"));
        pending.setExpiresAt(Instant.now().plusSeconds(60));
        when(registrations.findById(EMAIL)).thenReturn(Optional.of(pending));
        return pending;
    }

    @Test
    void registrationSendsOtpAndStoresHashesWithoutCreatingAccounts() {
        when(users.countByNormalizedPhone("0901234567")).thenReturn(1L);
        Instant before = Instant.now();
        CodeResponse response = service.register(request());
        var saved = ArgumentCaptor.forClass(PatientRegistration.class);
        var otp = ArgumentCaptor.forClass(String.class);
        verify(registrations).save(saved.capture());
        verify(mail).sendOtp(eq(EMAIL), otp.capture());
        assertTrue(otp.getValue().matches("[0-9]{6}"));
        assertTrue(encoder.matches(otp.getValue(), saved.getValue().getCodeHash()));
        assertTrue(encoder.matches("password123", saved.getValue().getPasswordHash()));
        assertEquals("0901234567", saved.getValue().getPhone());
        assertEquals(request().dateOfBirth(), saved.getValue().getDateOfBirth());
        assertEquals(request().gender(), saved.getValue().getGender());
        assertEquals(request().address(), saved.getValue().getAddress());
        assertEquals("BR-01", saved.getValue().getBranchId());
        assertFalse(response.expiresAt().isBefore(before.plusSeconds(60)));
        assertEquals(60, response.resendAfterSeconds());
        verify(users, never()).save(any());
        verifyNoInteractions(patients, records);
    }

    @Test
    void rejectsThirdAccountBeforeSendingOtp() {
        when(users.countByNormalizedPhone("0901234567")).thenReturn(2L);
        assertError(ErrorCode.PHONE_ACCOUNT_LIMIT, () -> service.register(request()));
        verifyNoInteractions(mail);
    }

    @Test
    void rejectsDuplicateEmail() {
        when(users.existsByEmailIgnoreCase(EMAIL)).thenReturn(true);
        assertError(ErrorCode.EMAIL_ALREADY_EXISTS, () -> service.register(request()));
        verifyNoInteractions(mail);
    }

    @Test
    void cannotBypassCooldownByRegisteringAgainOrResending() {
        pending();
        assertError(ErrorCode.REGISTRATION_RESEND_TOO_SOON, () -> service.resend(EMAIL));
        assertError(ErrorCode.REGISTRATION_RESEND_TOO_SOON, () -> service.register(request()));
        verifyNoInteractions(mail);
    }

    @Test
    void expiredOtpCannotCreateAccountAndResendReplacesIt() {
        PatientRegistration pending = pending();
        pending.setExpiresAt(Instant.now().minusSeconds(1));
        pending.setFailedAttempts(5);
        assertError(ErrorCode.REGISTRATION_CODE_EXPIRED, () -> service.verify(new VerifyRequest(EMAIL, "123456")));
        String previousHash = pending.getCodeHash();
        service.resend(EMAIL);
        assertNotEquals(previousHash, pending.getCodeHash());
        assertEquals(0, pending.getFailedAttempts());
        assertTrue(pending.getExpiresAt().isAfter(Instant.now()));
        verify(users, never()).save(any());
    }

    @Test
    void fifthWrongAttemptLocksVerificationEvenWithCorrectOtp() {
        PatientRegistration pending = pending();
        pending.setFailedAttempts(4);
        assertError(ErrorCode.REGISTRATION_TOO_MANY_ATTEMPTS, () -> service.verify(new VerifyRequest(EMAIL, "000000")));
        assertEquals(5, pending.getFailedAttempts());
        verify(registrations).save(pending);
        assertError(ErrorCode.REGISTRATION_TOO_MANY_ATTEMPTS, () -> service.verify(new VerifyRequest(EMAIL, "123456")));
        verify(users, never()).save(any());
    }

    @Test
    void rechecksPhoneLimitAtVerification() {
        pending();
        when(users.countByNormalizedPhone("0901234567")).thenReturn(2L);
        assertError(ErrorCode.PHONE_ACCOUNT_LIMIT, () -> service.verify(new VerifyRequest(EMAIL, "123456")));
        verify(users, never()).save(any());
        verifyNoInteractions(patients, records, events);
    }

    @Test
    void verifiedOtpCreatesLinkedEntitiesAndConsumesPendingRegistration() {
        PatientRegistration pending = pending();
        // Retry a collision in users, then a collision in patients, before accepting a code.
        when(users.existsByCodeName(anyString())).thenReturn(true, false, false);
        when(patients.existsByPatientCode(anyString())).thenReturn(true, false);
        when(users.save(any())).thenAnswer(call -> {
            User user = call.getArgument(0);
            user.setId(UUID.randomUUID());
            return user;
        });
        when(patients.save(any())).thenAnswer(call -> {
            Patient patient = call.getArgument(0);
            patient.setId(UUID.randomUUID());
            return patient;
        });
        RegistrationResponse response = service.verify(new VerifyRequest(EMAIL, "123456"));
        assertTrue(response.patientCode().matches("PA-[0-9A-F]{8}"));
        verify(users, times(3)).existsByCodeName(anyString());
        verify(patients, times(2)).existsByPatientCode(anyString());
        var user = ArgumentCaptor.forClass(User.class);
        var patient = ArgumentCaptor.forClass(Patient.class);
        var record = ArgumentCaptor.forClass(MedicalRecord.class);
        verify(users).save(user.capture());
        verify(patients).save(patient.capture());
        verify(records).save(record.capture());
        assertEquals(Role.PATIENT, user.getValue().getRole());
        assertEquals(response.patientCode(), user.getValue().getCodeName());
        assertEquals(response.patientCode(), patient.getValue().getPatientCode());
        assertSame(user.getValue(), patient.getValue().getUser());
        assertEquals(pending.getDateOfBirth().atStartOfDay(), patient.getValue().getDateOfBirth());
        assertEquals(pending.getGender(), patient.getValue().getGender());
        assertEquals(pending.getAddress(), patient.getValue().getAddress());
        assertSame(patient.getValue(), record.getValue().getPatient());
        assertSame(branch, record.getValue().getBranch());
        verify(registrations).delete(pending);
        verify(events).publishEvent(new PatientRegistrationMailService.Registered(EMAIL, response.patientCode()));
        when(registrations.findById(EMAIL)).thenReturn(Optional.empty());
        assertError(ErrorCode.REGISTRATION_CODE_INVALID, () -> service.verify(new VerifyRequest(EMAIL, "123456")));
    }

    @Test
    void rejectsUnknownBranchBeforeSendingOtp() {
        when(branches.findById("BR-01")).thenReturn(Optional.empty());
        assertError(ErrorCode.RESOURCE_NOT_FOUND, () -> service.register(request()));
        verifyNoInteractions(mail);
        verify(registrations, never()).save(any());
    }

    @Test
    void rejectsInactiveBranchBeforeSendingOtp() {
        branch.setStatus(BranchStatus.MAINTENANCE);
        assertError(ErrorCode.VALIDATION_ERROR, () -> service.register(request()));
        verifyNoInteractions(mail);
    }

    @Test
    void rejectsBranchClosedWhileWaitingForOtpWithoutCreatingAccount() {
        pending();
        branch.setStatus(BranchStatus.CLOSED);
        assertError(ErrorCode.VALIDATION_ERROR, () -> service.verify(new VerifyRequest(EMAIL, "123456")));
        verify(users, never()).save(any());
        verifyNoInteractions(patients, records, events);
    }

    private void assertError(ErrorCode code, Runnable action) {
        assertEquals(code, assertThrows(AppException.class, action::run).getErrorCode());
    }

    @Test
    void validatesRequiredProfileFieldsAndRejectsFutureBirthDate() {
        try (var factory = jakarta.validation.Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            assertTrue(validator.validate(request()).isEmpty());
            var missing = new RegisterRequest("Nguyen Van A", null, null, " ",
                    null, EMAIL, "0901234567", "123456", "123456");
            var fields = validator.validate(missing).stream()
                    .map(v -> v.getPropertyPath().toString()).collect(java.util.stream.Collectors.toSet());
            assertEquals(java.util.Set.of("dateOfBirth", "gender", "address", "branchId"), fields);
            var future = new RegisterRequest("Nguyen Van A", LocalDate.now().plusDays(1), Gender.FEMALE,
                    "TP.HCM", "BR-01", EMAIL, "0901234567", "123456", "123456");
            assertTrue(validator.validate(future).stream()
                    .anyMatch(v -> v.getPropertyPath().toString().equals("dateOfBirth")));
        }
    }
}

package iuh.fit.backend.patient;

import iuh.fit.backend.auth.service.PatientRegistrationMailService;
import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.exception.ErrorCode;
import iuh.fit.backend.common.security.CustomUserDetails;
import iuh.fit.backend.patient.dto.*;
import iuh.fit.backend.patient.entity.*;
import iuh.fit.backend.patient.enums.RelationshipType;
import iuh.fit.backend.patient.repository.*;
import iuh.fit.backend.patient.service.impl.PatientRelationshipServiceImpl;
import iuh.fit.backend.user.entity.User;
import iuh.fit.backend.user.enums.*;
import iuh.fit.backend.user.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PatientRelationshipServiceTest {
    private final PatientRepository patients = mock(PatientRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final PatientRelationshipRepository relationships = mock(PatientRelationshipRepository.class);
    private final PatientRelationshipOtpRepository challenges = mock(PatientRelationshipOtpRepository.class);
    private final PatientRegistrationMailService mail = mock(PatientRegistrationMailService.class);
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private final PatientRelationshipServiceImpl service = new PatientRelationshipServiceImpl(
            patients, users, relationships, challenges, mail, encoder, mock(JdbcTemplate.class));
    private final User user = User.builder().id(UUID.randomUUID()).role(Role.PATIENT)
            .status(StatusUser.ACTIVE).email("parent@example.com").phone("0901234567").build();
    private final Patient owner = Patient.builder().id(UUID.randomUUID()).user(user).build();
    private final Patient child = Patient.builder().id(UUID.randomUUID()).patientCode("PA-CHILD")
            .fullName("Nguyễn Văn An").dateOfBirth(LocalDate.of(2015, 3, 12).atStartOfDay())
            .phoneNumber("0912345678").build();

    @BeforeEach
    void setup() {
        var principal = new CustomUserDetails(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
        when(users.findById(user.getId())).thenReturn(Optional.of(user));
        when(patients.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(patients.findForActivationByCode("pa-child")).thenReturn(Optional.of(child));
        when(patients.findForActivationById(child.getId())).thenReturn(Optional.of(child));
        when(relationships.saveAndFlush(any())).thenAnswer(call -> {
            PatientRelationship saved = call.getArgument(0);
            if (saved.getId() == null) saved.setId(UUID.randomUUID());
            return saved;
        });
    }

    @AfterEach
    void clearContext() { SecurityContextHolder.clearContext(); }

    private PatientRelationshipRequest request() {
        return new PatientRelationshipRequest(owner.getId(), "+84901234567", "pa-child",
                "  Nguyễn   Văn An ", LocalDate.of(2015, 3, 12), "+84912345678", RelationshipType.CHILD);
    }

    private PatientRelationshipOtp issue() {
        service.requestCode(request());
        var captor = ArgumentCaptor.forClass(PatientRelationshipOtp.class);
        verify(challenges).saveAndFlush(captor.capture());
        PatientRelationshipOtp session = captor.getValue();
        when(challenges.findById(user.getId())).thenReturn(Optional.of(session));
        return session;
    }

    private String sentCode() {
        var code = ArgumentCaptor.forClass(String.class);
        verify(mail).sendRelationshipOtp(eq(user.getEmail()), code.capture());
        return code.getValue();
    }

    private void assertError(ErrorCode expected, Runnable action) {
        assertEquals(expected, assertThrows(AppException.class, action::run).getErrorCode());
    }

    @Test
    void sendsToAccountEmailAndCreatesOnlyAfterValidOtpWhichCannotBeReused() {
        var session = issue();
        String code = sentCode();
        assertTrue(code.matches("[0-9]{6}"));
        assertNotEquals(code, session.getCodeHash());
        assertTrue(encoder.matches(code, session.getCodeHash()));
        verify(relationships, never()).saveAndFlush(any());
        var verification = new PatientRelationshipVerifyRequest(session.getRequestId(), code);
        var response = service.verify(verification);
        assertEquals(owner.getId(), response.patientId());
        assertEquals(child.getId(), response.relatedPatientId());
        assertEquals(RelationshipType.CHILD, response.relationshipType());
        assertTrue(response.status());
        verify(challenges).delete(session);
        when(challenges.findById(user.getId())).thenReturn(Optional.empty());
        assertError(ErrorCode.RELATIONSHIP_CODE_INVALID, () -> service.verify(verification));
        verify(relationships, times(1)).saveAndFlush(any());
    }

    @Test
    void rejectsAnonymousAndOtherOwnersAndInactiveAccounts() {
        owner.setUser(User.builder().id(UUID.randomUUID()).build());
        assertError(ErrorCode.ACCESS_DENIED, () -> service.requestCode(request()));
        user.setStatus(StatusUser.BLOCK);
        assertError(ErrorCode.ACCOUNT_INACTIVE, () -> service.requestCode(request()));
        SecurityContextHolder.clearContext();
        assertError(ErrorCode.UNAUTHORIZED, () -> service.requestCode(request()));
        verifyNoInteractions(mail);
    }

    @Test
    void rejectsIncorrectOwnerPhone() {
        user.setPhone("0987654321");
        assertError(ErrorCode.RELATIONSHIP_DETAILS_INVALID, () -> service.requestCode(request()));
        verifyNoInteractions(mail);
    }

    @ParameterizedTest
    @ValueSource(strings = {"code", "name", "birthday", "phone"})
    void rejectsEachMismatchedTargetField(String field) {
        switch (field) {
            case "code" -> child.setPatientCode("PA-OTHER");
            case "name" -> child.setFullName("Người khác");
            case "birthday" -> child.setDateOfBirth(child.getDateOfBirth().plusDays(1));
            case "phone" -> child.setPhoneNumber("0987654321");
        }
        assertError(ErrorCode.RELATIONSHIP_DETAILS_INVALID, () -> service.requestCode(request()));
        verifyNoInteractions(mail);
    }

    @Test
    void rejectsTargetAccountByForeignKeyOrAccountCode() {
        child.setUser(User.builder().id(UUID.randomUUID()).status(StatusUser.INACTIVE).build());
        assertError(ErrorCode.PATIENT_ALREADY_ACTIVATED, () -> service.requestCode(request()));
        child.setUser(null);
        when(users.existsByCodeNameIgnoreCase(child.getPatientCode())).thenReturn(true);
        assertError(ErrorCode.PATIENT_ALREADY_ACTIVATED, () -> service.requestCode(request()));
        verifyNoInteractions(mail);
    }

    @Test
    void rejectsSelfLink() {
        child.setId(owner.getId());
        assertError(ErrorCode.RELATIONSHIP_DETAILS_INVALID, () -> service.requestCode(request()));
    }

    @Test
    void rejectsExpiryAndWrongRequestId() {
        var session = issue();
        assertError(ErrorCode.RELATIONSHIP_CODE_INVALID,
                () -> service.verify(new PatientRelationshipVerifyRequest(UUID.randomUUID(), "123456")));
        session.setExpiresAt(Instant.now().minusSeconds(1));
        assertError(ErrorCode.RELATIONSHIP_CODE_EXPIRED,
                () -> service.verify(new PatientRelationshipVerifyRequest(session.getRequestId(), "123456")));
        verify(relationships, never()).saveAndFlush(any());
    }

    @Test
    void wrongCodesCountTowardFiveAttemptLimitAndAreNotRolledBack() throws Exception {
        var session = issue();
        session.setCodeHash(encoder.encode("123456"));
        var wrong = new PatientRelationshipVerifyRequest(session.getRequestId(), "000000");
        for (int i = 1; i <= 5; i++) {
            AppException ex = assertThrows(AppException.class, () -> service.verify(wrong));
            assertEquals(i, session.getFailedAttempts());
            var transaction = PatientRelationshipServiceImpl.class
                    .getMethod("verify", PatientRelationshipVerifyRequest.class).getAnnotation(Transactional.class);
            assertTrue(Arrays.stream(transaction.noRollbackFor()).anyMatch(type -> type.isInstance(ex)));
        }
        assertError(ErrorCode.RELATIONSHIP_TOO_MANY_ATTEMPTS,
                () -> service.verify(new PatientRelationshipVerifyRequest(session.getRequestId(), "123456")));
        verify(relationships, never()).saveAndFlush(any());
    }

    @Test
    void revalidatesTargetAccountBeforeSaving() {
        var session = issue();
        String code = sentCode();
        child.setUser(User.builder().id(UUID.randomUUID()).build());
        assertError(ErrorCode.PATIENT_ALREADY_ACTIVATED,
                () -> service.verify(new PatientRelationshipVerifyRequest(session.getRequestId(), code)));
        verify(relationships, never()).saveAndFlush(any());
    }

    @Test
    void revalidatesTargetDetailsAndRecipientBeforeSaving() {
        var session = issue();
        String code = sentCode();
        var verification = new PatientRelationshipVerifyRequest(session.getRequestId(), code);
        child.setFullName("Changed");
        assertError(ErrorCode.RELATIONSHIP_PROFILE_CHANGED, () -> service.verify(verification));
        user.setEmail("changed@example.com");
        assertError(ErrorCode.RELATIONSHIP_PROFILE_CHANGED, () -> service.verify(verification));
        verify(relationships, never()).saveAndFlush(any());
    }

    @Test
    void resendHasAccountWideCooldownAndInvalidatesOldChallenge() {
        var session = issue();
        UUID oldRequestId = session.getRequestId();
        assertError(ErrorCode.RELATIONSHIP_RESEND_TOO_SOON, () -> service.requestCode(request()));
        session.setExpiresAt(Instant.now().minusSeconds(1));
        var replacement = service.requestCode(request());
        assertNotEquals(oldRequestId, replacement.requestId());
        assertError(ErrorCode.RELATIONSHIP_CODE_INVALID,
                () -> service.verify(new PatientRelationshipVerifyRequest(oldRequestId, "123456")));
    }

    @Test
    void reactivatesExistingInactiveLinkWithoutInsertingDuplicate() {
        var existing = PatientRelationship.builder().id(UUID.randomUUID()).patient(owner)
                .relatedPatient(child).status(false).relationshipType(RelationshipType.PARENT).build();
        when(relationships.findByPatientIdAndRelatedPatientId(owner.getId(), child.getId()))
                .thenReturn(Optional.of(existing));
        var session = issue();
        var result = service.verify(new PatientRelationshipVerifyRequest(session.getRequestId(), sentCode()));
        assertEquals(existing.getId(), result.id());
        assertEquals(RelationshipType.CHILD, result.relationshipType());
        assertTrue(result.status());
        verify(relationships).saveAndFlush(existing);
    }
}

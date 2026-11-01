package iuh.fit.backend.patient.service.impl;

import iuh.fit.backend.auth.service.PatientRegistrationMailService;
import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.exception.ErrorCode;
import iuh.fit.backend.common.security.CustomUserDetails;
import iuh.fit.backend.patient.dto.*;
import iuh.fit.backend.patient.entity.*;
import iuh.fit.backend.patient.repository.*;
import iuh.fit.backend.patient.service.PatientRelationshipService;
import iuh.fit.backend.user.entity.User;
import iuh.fit.backend.user.enums.Role;
import iuh.fit.backend.user.enums.StatusUser;
import iuh.fit.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.text.Normalizer;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Locale;
import java.util.UUID;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class PatientRelationshipServiceImpl implements PatientRelationshipService {
    private final PatientRepository patients;
    private final UserRepository users;
    private final PatientRelationshipRepository relationships;
    private final PatientRelationshipOtpRepository challenges;
    private final PatientRegistrationMailService mail;
    private final PasswordEncoder encoder;
    private final JdbcTemplate jdbc;
    private final SecureRandom random = new SecureRandom();

    @Override
    @Transactional(readOnly = true)
    public List<PatientRelationshipProfileResponse> getMyProfiles() {
        User user = currentUser();
        Patient owner = patients.findByUserId(user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.PATIENT_NOT_FOUND));
        return getProfiles(owner);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PatientRelationshipProfileResponse> getProfilesByPatientId(UUID patientId) {
        User user = currentUser(Role.PATIENT, Role.EMPLOYEE, Role.DENTIST);
        Patient owner = requireLinkOwner(patientId, user);
        return getProfiles(owner);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PatientRelationshipResponse> getAllActiveRelationships() {
        currentUser(Role.EMPLOYEE, Role.DENTIST);
        return relationships.findByStatusTrueOrderByCreatedAtDesc()
                .stream()
                .map(relationship -> new PatientRelationshipResponse(
                        relationship.getId(),
                        relationship.getPatient().getId(),
                        relationship.getRelatedPatient().getId(),
                        relationship.getRelationshipType(),
                        relationship.isStatus()
                ))
                .toList();
    }

    private List<PatientRelationshipProfileResponse> getProfiles(Patient owner) {
        List<PatientRelationship> links = relationships
                .findByPatientIdAndStatusTrueOrderByCreatedAtAscIdAsc(owner.getId());
        List<PatientRelationshipProfileResponse> profiles = new ArrayList<>();
        profiles.add(toProfile(owner, null, null));
        String sponsorPhone = owner.getPhoneNumber();
        for (PatientRelationship link : links) {
            profiles.add(toProfile(link.getRelatedPatient(), link, sponsorPhone));
        }
        return List.copyOf(profiles);
    }


    private PatientRelationshipProfileResponse toProfile(Patient patient, PatientRelationship link,
                                                         String sponsorPhone) {
        return new PatientRelationshipProfileResponse(
                patient.getId(), link == null ? null : link.getId(), link == null,
                patient.getFullName(), patient.getPatientCode(),
                patient.getDateOfBirth() == null ? null : patient.getDateOfBirth().toLocalDate(),
                patient.getPhoneNumber(), patient.getCccd(), sponsorPhone,
                link == null ? null : link.getRelationshipType(),
                link == null ? null : link.getCreatedAt(),
                link == null || link.isStatus());
    }

    @Override
    @Transactional
    public PatientRelationshipCodeResponse requestCode(PatientRelationshipRequest request) {
        User user = currentUser(Role.PATIENT, Role.EMPLOYEE);
        lockAccount(user.getId());
        Patient owner = requireLinkOwner(request.patientId(), user);
        if (!phone(request.patientPhone()).equals(phone(owner.getPhoneNumber()))) {
            throw new AppException(ErrorCode.RELATIONSHIP_DETAILS_INVALID);
        }
        if (owner.getEmail() == null || owner.getEmail().isBlank()) {
            throw new AppException(ErrorCode.RELATIONSHIP_DETAILS_INVALID, "Hồ sơ chính chủ chưa có email nhận OTP. Vui lòng cập nhật tại phòng khám");
        }
        PatientRelationshipOtp session = challenges.findById(user.getId()).orElseGet(PatientRelationshipOtp::new);
        if (session.getExpiresAt() != null && Instant.now().isBefore(session.getExpiresAt())) {
            throw new AppException(ErrorCode.RELATIONSHIP_RESEND_TOO_SOON);
        }
        Patient target = patients.findForActivationByCode(request.relatedPatientCode().trim())
                .orElseThrow(() -> new AppException(ErrorCode.RELATIONSHIP_DETAILS_INVALID));
        validateLink(owner, target, request.relatedPatientCode(), request.fullName(),
                request.birthday(), request.phoneRelatedPatient(), ErrorCode.RELATIONSHIP_DETAILS_INVALID);

        String code = String.format(Locale.ROOT, "%06d", random.nextInt(1_000_000));
        session.setUserId(user.getId());
        session.setRequestId(UUID.randomUUID());
        session.setPatientId(owner.getId());
        session.setRelatedPatientId(target.getId());
        // Patient is the source of profile data; request fields are only used for comparison.
        // Keep this snapshot to detect profile changes when the OTP is verified.
        session.setPatientPhone(phone(owner.getPhoneNumber()));
        session.setEmail(owner.getEmail());
        session.setRelatedPatientCode(target.getPatientCode());
        session.setFullName(target.getFullName());
        session.setBirthday(target.getDateOfBirth().toLocalDate());
        session.setPhoneRelatedPatient(phone(target.getPhoneNumber()));
        session.setRelationshipType(request.relationshipType());
        session.setCodeHash(encoder.encode(code));
        session.setExpiresAt(Instant.now().plusSeconds(120));
        session.setFailedAttempts(0);
        challenges.saveAndFlush(session);
        mail.sendRelationshipOtp(owner.getEmail(), code);
        return new PatientRelationshipCodeResponse(session.getRequestId(), session.getExpiresAt(), 120);
    }

    @Override
    @Transactional(noRollbackFor = InvalidRelationshipOtpException.class)
    public PatientRelationshipResponse verify(PatientRelationshipVerifyRequest request) {
        User user = currentUser(Role.PATIENT, Role.EMPLOYEE);
        lockAccount(user.getId());
        PatientRelationshipOtp session = challenges.findById(user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.RELATIONSHIP_CODE_INVALID));
        if (!request.requestId().equals(session.getRequestId()) || session.getCodeHash() == null) {
            throw new AppException(ErrorCode.RELATIONSHIP_CODE_INVALID);
        }
        if (!Instant.now().isBefore(session.getExpiresAt())) {
            throw new AppException(ErrorCode.RELATIONSHIP_CODE_EXPIRED);
        }
        if (session.getFailedAttempts() >= 5) {
            throw new AppException(ErrorCode.RELATIONSHIP_TOO_MANY_ATTEMPTS);
        }
        if (!encoder.matches(request.code(), session.getCodeHash())) {
            session.setFailedAttempts(session.getFailedAttempts() + 1);
            challenges.save(session);
            throw new InvalidRelationshipOtpException(session.getFailedAttempts() >= 5
                    ? ErrorCode.RELATIONSHIP_TOO_MANY_ATTEMPTS : ErrorCode.RELATIONSHIP_CODE_INVALID);
        }
        Patient owner = requireLinkOwner(session.getPatientId(), user);
        if (!Objects.equals(session.getEmail(), owner.getEmail())
                || !Objects.equals(session.getPatientPhone(), phone(owner.getPhoneNumber()))) {
            throw new AppException(ErrorCode.RELATIONSHIP_PROFILE_CHANGED);
        }
        // Same row lock as account activation: cannot link while activation is committing.
        Patient target = patients.findForActivationById(session.getRelatedPatientId())
                .orElseThrow(() -> new AppException(ErrorCode.RELATIONSHIP_PROFILE_CHANGED));
        // The target row is locked above, serializing competing parents before this check.
        validateLink(owner, target, session.getRelatedPatientCode(), session.getFullName(),
                session.getBirthday(), session.getPhoneRelatedPatient(), ErrorCode.RELATIONSHIP_PROFILE_CHANGED);
        PatientRelationship relationship = relationships.findByPatientIdAndRelatedPatientId(owner.getId(), target.getId())
                .orElseGet(() -> PatientRelationship.builder().patient(owner).relatedPatient(target).build());
        if (relationship.isStatus()) {
            throw new AppException(ErrorCode.RELATIONSHIP_ALREADY_ACTIVE);
        }
        relationship.setRelationshipType(session.getRelationshipType());
        relationship.setStatus(true);
        relationship = relationships.saveAndFlush(relationship);
        // Remove the completed OTP session in the same transaction as the relationship.
        challenges.delete(session);
        return new PatientRelationshipResponse(relationship.getId(), owner.getId(), target.getId(),
                relationship.getRelationshipType(), relationship.isStatus());
    }

    @Override
    @Transactional
    public void deleteRelationship(UUID relationshipId) {
        User user = currentUser(Role.PATIENT, Role.EMPLOYEE, Role.ADMIN);
        lockAccount(user.getId());
        PatientRelationship relationship = relationships.findById(relationshipId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy liên kết hồ sơ"));
        Patient owner = relationship.getPatient();
        if (user.getRole() == Role.PATIENT) {
            owner = requireOwner(owner.getId(), user);
        }
        UUID targetId = relationship.getRelatedPatient().getId();
        // Serialize deletion with OTP verification for the same target.
        patients.findForActivationById(targetId)
                .orElseThrow(() -> new AppException(ErrorCode.PATIENT_NOT_FOUND));
        relationships.delete(relationship);
        // Invalidate a pending challenge that could recreate this cancelled link.
        final UUID ownerPatientId = owner.getId();
        challenges.findById(owner.getUser() != null ? owner.getUser().getId() : user.getId())
                .filter(session -> ownerPatientId.equals(session.getPatientId())
                        && targetId.equals(session.getRelatedPatientId()))
                .ifPresent(challenges::delete);
    }

    private User currentUser(Role... allowedRoles) {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof CustomUserDetails principal)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        User user = users.findById(principal.getUser().getId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        boolean allowed = allowedRoles.length == 0 ? user.getRole() == Role.PATIENT
                : java.util.Arrays.asList(allowedRoles).contains(user.getRole());
        if (!allowed) throw new AppException(ErrorCode.ACCESS_DENIED);
        if (user.getStatus() != StatusUser.ACTIVE) throw new AppException(ErrorCode.ACCOUNT_INACTIVE);
        return user;
    }

    private Patient requireOwner(UUID patientId, User user) {
        Patient owner = patients.findById(patientId)
                .orElseThrow(() -> new AppException(ErrorCode.PATIENT_NOT_FOUND));
        if (owner.getUser() == null || !user.getId().equals(owner.getUser().getId())) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        return owner;
    }

    private Patient requireLinkOwner(UUID patientId, User actor) {
        if (actor.getRole() == Role.PATIENT) return requireOwner(patientId, actor);
        if (actor.getRole() == Role.DENTIST) {
            return patients.findById(patientId)
                    .orElseThrow(() -> new AppException(ErrorCode.PATIENT_NOT_FOUND));
        }
        if (actor.getRole() != Role.EMPLOYEE) throw new AppException(ErrorCode.ACCESS_DENIED);
        Patient owner = patients.findById(patientId)
                .orElseThrow(() -> new AppException(ErrorCode.PATIENT_NOT_FOUND));
        if (owner.getUser() == null) {
            throw new AppException(ErrorCode.RELATIONSHIP_DETAILS_INVALID,
                    "Hồ sơ chính chủ phải có tài khoản bệnh nhân đang hoạt động");
        }
        User ownerAccount = users.findById(owner.getUser().getId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        if (ownerAccount.getRole() != Role.PATIENT) throw new AppException(ErrorCode.ACCESS_DENIED);
        if (ownerAccount.getStatus() != StatusUser.ACTIVE) throw new AppException(ErrorCode.ACCOUNT_INACTIVE);
        return owner;
    }

    // Shared rules for issuing an OTP and committing the link. Always compare against Patient.
    private void validateLink(Patient owner, Patient target, String code, String fullName,
                              LocalDate birthday, String targetPhone, ErrorCode mismatchError) {
        if (owner.getId().equals(target.getId())) throw new AppException(ErrorCode.RELATIONSHIP_DETAILS_INVALID);
        String ownerPhone = phone(owner.getPhoneNumber());
        if (ownerPhone.isBlank() || !ownerPhone.equals(phone(target.getPhoneNumber()))) {
            throw new AppException(ErrorCode.RELATIONSHIP_DETAILS_INVALID,
                    "Số điện thoại hồ sơ chính chủ và hồ sơ người thân phải giống nhau để liên kết");
        }
        if (target.getUser() != null || users.existsByCodeNameIgnoreCase(target.getPatientCode())) {
            throw new AppException(ErrorCode.PATIENT_ALREADY_ACTIVATED);
        }
        if (!matches(target, code, fullName, birthday, targetPhone)) {
            throw new AppException(mismatchError);
        }
        rejectActiveRelationship(owner.getId(), target.getId());
    }

    private void rejectActiveRelationship(UUID ownerId, UUID targetId) {
        relationships.findByPatientIdAndRelatedPatientId(ownerId, targetId).ifPresent(existing -> {
            if (existing.isStatus()) throw new AppException(ErrorCode.RELATIONSHIP_ALREADY_ACTIVE);
        });
        if (relationships.existsByRelatedPatientIdAndStatusTrue(targetId)) {
            throw new AppException(ErrorCode.RELATIONSHIP_TARGET_ALREADY_LINKED);
        }
    }

    private boolean matches(Patient target, String code, String name, LocalDate birthday, String targetPhone) {
        return target.getPatientCode() != null && target.getPatientCode().equalsIgnoreCase(code.trim())
                && name(target.getFullName()).equals(name(name))
                && target.getDateOfBirth() != null && target.getDateOfBirth().toLocalDate().equals(birthday)
                && phone(target.getPhoneNumber()).equals(phone(targetPhone));
    }

    private static String name(String value) {
        return value == null ? "" : Normalizer.normalize(value, Normalizer.Form.NFC)
                .strip().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }

    private static String phone(String value) {
        if (value == null) return "";
        String digits = value.replaceAll("[^0-9]", "");
        return digits.startsWith("84") ? "0" + digits.substring(2) : digits;
    }

    private void lockAccount(UUID userId) {
        jdbc.execute((ConnectionCallback<Void>) connection -> {
            try (var statement = connection.prepareStatement("SELECT pg_advisory_xact_lock(hashtext(?))")) {
                statement.setString(1, "patient-relationship:" + userId);
                statement.execute();
            }
            return null;
        });
    }

    private static class InvalidRelationshipOtpException extends AppException {
        InvalidRelationshipOtpException(ErrorCode errorCode) { super(errorCode); }
    }
}

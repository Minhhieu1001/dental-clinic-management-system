package iuh.fit.backend.auth.service;

import iuh.fit.backend.auth.dto.PasswordResetDtos.*;
import iuh.fit.backend.auth.entity.PasswordReset;
import iuh.fit.backend.auth.repository.PasswordResetRepository;
import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.exception.ErrorCode;
import iuh.fit.backend.user.entity.User;
import iuh.fit.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class PasswordResetService {
    private final UserRepository users;
    private final PasswordResetRepository resets;
    private final PasswordEncoder encoder;
    private final PasswordResetMailService mail;
    private final ApplicationEventPublisher events;
    private final SecureRandom random = new SecureRandom();

    @Transactional
    public CodeResponse requestCode(String email) {
        User user = requireUser(email);
        PasswordReset reset = resets.findById(user.getId()).orElseGet(() -> {
            PasswordReset created = new PasswordReset();
            created.setUserId(user.getId());
            return created;
        });
        Instant now = Instant.now();
        if (reset.getSentAt() != null && now.isBefore(reset.getSentAt().plusSeconds(60))) {
            throw new AppException(ErrorCode.RESET_RESEND_TOO_SOON);
        }
        String code = String.format(Locale.ROOT, "%06d", random.nextInt(1_000_000));
        String hash = encoder.encode(code);
        mail.sendCode(user.getEmail(), code);
        now = Instant.now();
        reset.setCodeHash(hash);
        reset.setCodeExpiresAt(now.plusSeconds(60));
        reset.setSentAt(now);
        reset.setFailedAttempts(0);
        reset.setTokenHash(null);
        reset.setTokenExpiresAt(null);
        resets.save(reset);
        return new CodeResponse(reset.getCodeExpiresAt(), 60);
    }

    // Persist failed-attempt counts even when returning a validation error.
    @Transactional(noRollbackFor = AppException.class)
    public VerifyResponse verify(VerifyRequest request) {
        User user = requireUser(request.email());
        PasswordReset reset = resets.findById(user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.RESET_CODE_INVALID));
        if (reset.getCodeHash() == null) throw new AppException(ErrorCode.RESET_CODE_INVALID);
        if (!Instant.now().isBefore(reset.getCodeExpiresAt())) throw new AppException(ErrorCode.RESET_CODE_EXPIRED);
        if (reset.getFailedAttempts() >= 5) throw new AppException(ErrorCode.RESET_TOO_MANY_ATTEMPTS);
        if (!encoder.matches(request.code(), reset.getCodeHash())) {
            reset.setFailedAttempts(reset.getFailedAttempts() + 1);
            resets.save(reset);
            throw new AppException(reset.getFailedAttempts() >= 5
                    ? ErrorCode.RESET_TOO_MANY_ATTEMPTS : ErrorCode.RESET_CODE_INVALID);
        }
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        reset.setTokenHash(encoder.encode(token));
        reset.setTokenExpiresAt(Instant.now().plusSeconds(300));
        reset.setCodeHash(null);
        resets.save(reset);
        return new VerifyResponse(token, reset.getTokenExpiresAt());
    }

    @Transactional
    public void resetPassword(ResetRequest request) {
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Mật khẩu xác nhận không khớp");
        }
        if (request.newPassword().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Mật khẩu không được vượt quá 72 byte UTF-8");
        }
        User user = requireUser(request.email());
        PasswordReset reset = resets.findById(user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.RESET_TOKEN_INVALID));
        if (reset.getTokenHash() == null || reset.getTokenExpiresAt() == null
                || !Instant.now().isBefore(reset.getTokenExpiresAt())
                || !encoder.matches(request.resetToken(), reset.getTokenHash())) {
            throw new AppException(ErrorCode.RESET_TOKEN_INVALID);
        }
        user.setPassword(encoder.encode(request.newPassword()));
        users.save(user);
        reset.setCodeHash(null);
        reset.setTokenHash(null);
        reset.setTokenExpiresAt(null);
        resets.save(reset);
        events.publishEvent(new PasswordResetMailService.PasswordChanged(user.getEmail()));
    }

    private User requireUser(String email) {
        return users.findByEmailForPasswordReset(email.trim())
                .orElseThrow(() -> new AppException(ErrorCode.EMAIL_NOT_FOUND));
    }
}

package iuh.fit.backend.user.service.Impl;

import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.exception.ErrorCode;
import iuh.fit.backend.notification.service.NotificationService;
import iuh.fit.backend.user.dto.UserRequest;
import iuh.fit.backend.user.dto.ChangePasswordRequest;
import iuh.fit.backend.user.dto.UserResponse;
import iuh.fit.backend.user.entity.User;
import iuh.fit.backend.user.enums.Role;
import iuh.fit.backend.user.enums.StatusUser;
import iuh.fit.backend.user.repository.UserRepository;
import iuh.fit.backend.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::toUserResponse)
                .toList();
    }

    @Override
    public UserResponse getUserById(UUID id) {
        return toUserResponse(findUser(id));
    }

    @Override
    public long countBlockedEmployeeAccounts() {
        return userRepository.countByRoleAndStatus(Role.EMPLOYEE, StatusUser.BLOCK);
    }

    @Override
    public long countActiveEmployeeAccounts() {
        return userRepository.countByRoleAndStatus(Role.EMPLOYEE, StatusUser.ACTIVE);
    }

    @Override
    public UserResponse createUser(UserRequest request) {
        if (request.email() != null && userRepository.existsByEmail(request.email().trim())) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        String rawPassword = request.password();
        User user = new User();
        applyUserRequest(user, request);
        user.setCodeName(generateCodeName(user.getRole()));
        User savedUser = userRepository.save(user);
        CompletableFuture.runAsync(() -> {
            try {
                notificationService.sendAccountCreatedEmail(savedUser.getEmail(), savedUser.getUsername(), rawPassword);
            } catch (Exception ex) {
                log.error("Cannot send email", ex);
            }
        });
        return toUserResponse(savedUser);
    }

    @Override
    public UserResponse updateUser(UUID id, UserRequest request) {
        User user = findUser(id);
        if (request.email() != null && !request.email().trim().equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(request.email().trim())) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        applyUserUpdate(user, request);
        return toUserResponse(userRepository.save(user));
    }

    @Override
    public UserResponse updateUserStatus(UUID id, StatusUser status) {
        User user = findUser(id);
        user.setStatus(status);
        return toUserResponse(userRepository.save(user));
    }

    @Override
    public void deleteUser(UUID id) {
        User user = findUser(id);
        try {
            userRepository.delete(user);
            userRepository.flush();
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot delete user because it is referenced by other data.",
                    exception
            );
        }
    }

    @Override
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = findUser(userId);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Mật khẩu hiện tại không chính xác");
        }
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Xác nhận mật khẩu mới không khớp");
        }
        // BCrypt limits input by UTF-8 bytes, not Java character count.
        if (request.newPassword().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Mật khẩu mới không được vượt quá 72 byte UTF-8");
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Mật khẩu mới phải khác mật khẩu hiện tại");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    private void applyUserUpdate(User user, UserRequest request) {
        // Update forms send only the fields they edit; retain omitted account data.
        if (request.username() != null) user.setUsername(request.username());
        if (request.password() != null && !request.password().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.password()));
        }
        if (request.email() != null) user.setEmail(request.email());
        if (request.phone() != null) user.setPhone(request.phone());
        if (request.avatarUrl() != null) user.setAvatarUrl(request.avatarUrl());
        if (request.role() != null) user.setRole(request.role());
        if (request.status() != null) user.setStatus(request.status());
    }

    private String generateCodeName(Role role) {
        if (role == null || role == Role.ADMIN) {
            return null;
        }
        String prefix = switch (role) {
            case DENTIST -> "BS-";
            case EMPLOYEE -> "EM-";
            case PATIENT -> "PA-";
            default -> throw new IllegalArgumentException("Unsupported role: " + role);
        };
        for (int attempt = 0; attempt < 100; attempt++) {
            String codeName = prefix + ThreadLocalRandom.current().nextInt(100000, 1000000);
            if (!userRepository.existsByCodeName(codeName)) {
                return codeName;
            }
        }
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Unable to generate a unique user code. Please retry.");
    }

    private void applyUserRequest(User user, UserRequest request) {
        user.setUsername(request.username());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setEmail(request.email());
        user.setPhone(request.phone());
        user.setAvatarUrl(request.avatarUrl());
        user.setRole(request.role());
        user.setStatus(request.status());
    }

    private User findUser(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() ->  new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private UserResponse toUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPhone(),
                user.getAvatarUrl(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}

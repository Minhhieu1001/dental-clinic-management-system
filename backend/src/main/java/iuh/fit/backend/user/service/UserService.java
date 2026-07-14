package iuh.fit.backend.user.service;

import iuh.fit.backend.user.dto.UserRequest;
import iuh.fit.backend.user.dto.UserResponse;
import iuh.fit.backend.user.entity.User;
import iuh.fit.backend.user.enums.Role;
import iuh.fit.backend.user.enums.StatusUser;
import iuh.fit.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {
    private final UserRepository userRepository;

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::toUserResponse)
                .toList();
    }

    public UserResponse getUserById(UUID id) {
        return toUserResponse(findUser(id));
    }

    public long countBlockedEmployeeAccounts() {
        return userRepository.countByRoleAndStatus(Role.EMPLOYEE, StatusUser.BLOCK);
    }

    public long countActiveEmployeeAccounts() {
        return userRepository.countByRoleAndStatus(Role.EMPLOYEE, StatusUser.ACTIVE);
    }

    public UserResponse createUser(UserRequest request) {
        User user = new User();
        applyUserRequest(user, request);
        return toUserResponse(userRepository.save(user));
    }

    public UserResponse updateUser(UUID id, UserRequest request) {
        User user = findUser(id);
        applyUserRequest(user, request);
        return toUserResponse(userRepository.save(user));
    }

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

    private void applyUserRequest(User user, UserRequest request) {
        user.setUsername(request.username());
        user.setPassword(request.password());
        user.setEmail(request.email());
        user.setPhone(request.phone());
        user.setAvatarUrl(request.avatarUrl());
        user.setRole(request.role());
        user.setStatus(request.status());
    }

    private User findUser(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + id));
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

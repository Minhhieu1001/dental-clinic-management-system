package iuh.fit.backend.user.service;

import iuh.fit.backend.user.dto.UserRequest;
import iuh.fit.backend.user.dto.ChangePasswordRequest;
import iuh.fit.backend.user.dto.UserResponse;
import iuh.fit.backend.user.enums.StatusUser;

import java.util.List;
import java.util.UUID;

public interface UserService {
    List<UserResponse> getAllUsers();

    UserResponse getUserById(UUID id);

    long countBlockedEmployeeAccounts();

    long countActiveEmployeeAccounts();

    UserResponse createUser(UserRequest request);

    UserResponse updateUser(UUID id, UserRequest request);

    void changePassword(UUID userId, ChangePasswordRequest request);

    UserResponse updateUserStatus(UUID id, StatusUser status);

    void deleteUser(UUID id);
}

package iuh.fit.backend.user.controller;

import iuh.fit.backend.user.dto.UserRequest;
import iuh.fit.backend.user.dto.ChangePasswordRequest;
import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.exception.ErrorCode;
import iuh.fit.backend.common.response.ApiResponse;
import iuh.fit.backend.common.security.CustomUserDetails;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import iuh.fit.backend.user.dto.UserResponse;
import iuh.fit.backend.user.dto.UpdateUserStatusRequest;
import iuh.fit.backend.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping
    public List<UserResponse> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/employees/blocked/count")
    public long countBlockedEmployeeAccounts() {
        return userService.countBlockedEmployeeAccounts();
    }

    @GetMapping("/employees/active/count")
    public long countActiveEmployeeAccounts() {
        return userService.countActiveEmployeeAccounts();
    }

    @GetMapping("/{id}")
    public UserResponse getUserById(@PathVariable UUID id) {
        return userService.getUserById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createUser(@RequestBody UserRequest request) {
        return userService.createUser(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or (#request.status() == null and #request.role() == null)")
    public UserResponse updateUser(@PathVariable UUID id, @RequestBody UserRequest request) {
        return userService.updateUser(id, request);
    }

    @PutMapping("/me/password")
    public ApiResponse<Void> changePassword(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody ChangePasswordRequest request) {
        if (principal == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        userService.changePassword(principal.getUser().getId(), request);
        return ApiResponse.success("Đổi mật khẩu thành công", null);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse updateUserStatus(@PathVariable UUID id, @RequestBody UpdateUserStatusRequest request) {
        return userService.updateUserStatus(id, request.status());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
    }
}

package iuh.fit.backend.user;

import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.user.dto.UserRequest;
import iuh.fit.backend.user.entity.User;
import iuh.fit.backend.user.enums.Role;
import iuh.fit.backend.user.enums.StatusUser;
import iuh.fit.backend.user.repository.UserRepository;
import iuh.fit.backend.user.service.Impl.UserServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class UserServiceUpdateTest {
    private final UserRepository repository = mock(UserRepository.class);
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private final UserServiceImpl service = new UserServiceImpl(repository, encoder, null);

    private User existingUser(Role role) {
        User user = User.builder().id(UUID.randomUUID()).username("existing")
                .password(encoder.encode("old-password")).email("existing@example.com")
                .phone("0900000000").avatarUrl("avatar.png").role(role)
                .status(StatusUser.ACTIVE).build();
        when(repository.findById(user.getId())).thenReturn(Optional.of(user));
        when(repository.save(any(User.class))).thenAnswer(call -> call.getArgument(0));
        return user;
    }

    @Test
    void dentistProfileUpdatePreservesOmittedAccountFields() {
        User user = existingUser(Role.DENTIST);
        String originalPassword = user.getPassword();

        service.updateUser(user.getId(), new UserRequest(
                "updated", null, null, "0911111111", "new-avatar.png", null, null));

        assertEquals("updated", user.getUsername());
        assertEquals("0911111111", user.getPhone());
        assertEquals("new-avatar.png", user.getAvatarUrl());
        assertEquals("existing@example.com", user.getEmail());
        assertEquals(Role.DENTIST, user.getRole());
        assertEquals(StatusUser.ACTIVE, user.getStatus());
        assertEquals(originalPassword, user.getPassword());
        verify(repository).save(user);
    }

    @Test
    void employeeUpdateWithoutPasswordPreservesLoginAndOmittedAvatar() {
        User user = existingUser(Role.EMPLOYEE);
        String originalPassword = user.getPassword();

        service.updateUser(user.getId(), new UserRequest(
                "updated", null, "updated@example.com", "0922222222", null,
                Role.EMPLOYEE, StatusUser.BLOCK));

        assertEquals(originalPassword, user.getPassword());
        assertEquals("avatar.png", user.getAvatarUrl());
        assertEquals("updated@example.com", user.getEmail());
        assertEquals(Role.EMPLOYEE, user.getRole());
        assertEquals(StatusUser.BLOCK, user.getStatus());
    }

    @Test
    void blankPasswordIsIgnoredAndExplicitNewPasswordIsEncoded() {
        User user = existingUser(Role.DENTIST);
        String originalPassword = user.getPassword();
        service.updateUser(user.getId(), new UserRequest(null, "  ", null, null, null, null, null));
        assertEquals(originalPassword, user.getPassword());
        assertEquals("existing", user.getUsername());
        assertEquals("0900000000", user.getPhone());

        service.updateUser(user.getId(), new UserRequest(null, "new-password", null, null, null, null, null));
        assertTrue(encoder.matches("new-password", user.getPassword()));
        assertFalse(encoder.matches("old-password", user.getPassword()));
    }

    @Test
    void duplicateEmailIsRejectedBeforeChangingTheAccount() {
        User user = existingUser(Role.EMPLOYEE);
        when(repository.existsByEmail("taken@example.com")).thenReturn(true);

        assertThrows(AppException.class, () -> service.updateUser(user.getId(), new UserRequest(
                "changed", null, "taken@example.com", null, null, null, null)));

        assertEquals("existing", user.getUsername());
        assertEquals("existing@example.com", user.getEmail());
        verify(repository, never()).save(any(User.class));
    }
}

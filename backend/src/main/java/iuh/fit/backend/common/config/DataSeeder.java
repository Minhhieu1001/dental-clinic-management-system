package iuh.fit.backend.common.config;

import iuh.fit.backend.user.entity.User;
import iuh.fit.backend.user.enums.Role;
import iuh.fit.backend.user.enums.StatusUser;
import iuh.fit.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        createAdminAccountIfNotExists();
    }

    private void createAdminAccountIfNotExists() {
        String adminEmail = "admin@dental.com";

        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .username("Admin")
                    .email(adminEmail)
                    .password(passwordEncoder.encode("123456"))
                    .role(Role.ADMIN)
                    .status(StatusUser.ACTIVE)
                    .build();

            userRepository.save(admin);
            log.info("Default admin account created: {}", adminEmail);
        } else {
            log.info("ℹAdmin account already exists: {}", adminEmail);
        }
    }
}

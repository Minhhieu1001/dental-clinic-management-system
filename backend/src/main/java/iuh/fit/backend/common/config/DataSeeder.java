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

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        boolean exists = userRepository.findByUsername("Admin").isPresent()
                || userRepository.findByUsername("admin").isPresent()
                || userRepository.findByEmail("admin@dental.com").isPresent();

        if (!exists) {
            User admin = User.builder()
                    .username("Admin")
                    .email("admin@dental.com")
                    .password(passwordEncoder.encode("123456"))
                    .phone("0900000000")
                    .role(Role.ADMIN)
                    .status(StatusUser.ACTIVE)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            userRepository.save(admin);
            log.info("DataSeeder: Đã tự động tạo tài khoản Admin (Admin / 123456)");
        } else {
            log.info("DataSeeder: Tài khoản Admin (admin@dental.com) đã tồn tại trong CSDL.");
        }
    }
}

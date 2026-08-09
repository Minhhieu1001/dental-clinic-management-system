package iuh.fit.backend.common.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    @Override
    public void run(String... args) {
        log.info("DataSeeder: Tự động khởi tạo bị tắt. Dữ liệu được nạp trực tiếp qua PostgreSQL SQL scripts.");
    }
}

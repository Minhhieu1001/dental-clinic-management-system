package iuh.fit.backend.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Slf4j
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(Caffeine.newBuilder()
                // Giới hạn tối đa 2.000 danh sách trên RAM (chống tràn RAM)
                .maximumSize(2000)
                // Tự động hết hạn sau 60 phút để nạp mới
                .expireAfterWrite(60, TimeUnit.MINUTES)
                .recordStats());
        log.info("Khởi tạo In-Memory Caffeine Cache trên RAM thành công.");
        return cacheManager;
    }
}

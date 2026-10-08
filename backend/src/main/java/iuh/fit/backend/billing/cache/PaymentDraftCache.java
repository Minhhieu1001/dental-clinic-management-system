package iuh.fit.backend.billing.cache;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Bộ nhớ tạm RAM (PaymentDraftCache) sử dụng ConcurrentHashMap.
 * Lưu tạm thông tin payload thanh toán QR trước khi Casso bắn Webhook về.
 * Tự động xoá cache cũ sau 15 phút (TTL).
 */
@Slf4j
@Component
public class PaymentDraftCache {

    private static final Duration TTL = Duration.ofMinutes(15);
    private final Map<String, PaymentDraft> cache = new ConcurrentHashMap<>();

    /**
     * Lưu thông tin bản nháp thanh toán vào RAM (giai đoạn tạo mã QR)
     */
    public void put(String transactionCode, PaymentDraft draft) {
        if (transactionCode == null || draft == null) return;
        draft.setCreatedAt(Instant.now());
        draft.setStatus("PENDING");
        cache.put(transactionCode.toUpperCase(), draft);
        log.info("Lưu nháp thanh toán QR thành công vào RAM: code={}, amount={}đ", transactionCode, draft.getAmount());
    }

    /**
     * Lấy thông tin bản nháp thanh toán từ RAM theo transactionCode
     */
    public Optional<PaymentDraft> get(String transactionCode) {
        if (transactionCode == null) return Optional.empty();
        return Optional.ofNullable(cache.get(transactionCode.toUpperCase()));
    }

    /**
     * Xoá bản nháp theo transactionCode
     */
    public void remove(String transactionCode) {
        if (transactionCode != null) {
            cache.remove(transactionCode.toUpperCase());
            log.info("Đã xoá nháp thanh toán QR khỏi RAM: code={}", transactionCode);
        }
    }

    /**
     * Tìm nháp trong RAM Cache dựa theo nội dung chuyển khoản từ ngân hàng
     */
    public Optional<PaymentDraft> findByDescription(String description) {
        if (description == null || description.isBlank()) return Optional.empty();
        String cleanDesc = description.replaceAll("\\s+", "").toUpperCase();

        // 1. Thử get trực tiếp theo key
        if (cache.containsKey(cleanDesc)) {
            return Optional.ofNullable(cache.get(cleanDesc));
        }

        // 2. Tìm bản nháp có transactionCode hoặc invoiceId nằm trong nội dung chuyển khoản
        return cache.values().stream()
                .filter(draft -> {
                    if (draft.getTransactionCode() != null) {
                        String cleanTxCode = draft.getTransactionCode().replaceAll("\\s+", "").toUpperCase();
                        if (cleanDesc.contains(cleanTxCode) || cleanTxCode.contains(cleanDesc)) {
                            return true;
                        }
                    }
                    if (draft.getInvoiceId() != null) {
                        String cleanUuid = draft.getInvoiceId().toString().replaceAll("-", "").toUpperCase();
                        if (cleanDesc.contains(cleanUuid)) {
                            return true;
                        }
                    }
                    return false;
                })
                .findFirst();
    }

    /**
     * Xoá bản nháp cũ của hóa đơn (nếu thu ngân đổi ý nhập lại số tiền khác)
     */
    public void removeByInvoiceId(UUID invoiceId) {
        if (invoiceId == null) return;
        cache.entrySet().removeIf(entry -> invoiceId.equals(entry.getValue().getInvoiceId()));
        log.info("Đã xoá các nháp thanh toán cũ của invoiceId={}", invoiceId);
    }

    /**
     * Tiến trình tự động dọn dẹp RAM các bản nháp hết hạn quá 15 phút (mỗi 5 phút chạy 1 lần)
     */
    @Scheduled(fixedRate = 300000)
    public void cleanupExpiredDrafts() {
        Instant now = Instant.now();
        int initialSize = cache.size();
        cache.entrySet().removeIf(entry -> Duration.between(entry.getValue().getCreatedAt(), now).compareTo(TTL) > 0);
        int removedCount = initialSize - cache.size();
        if (removedCount > 0) {
            log.info("Đã dọn dẹp {} bản nháp thanh toán QR hết hạn khỏi RAM", removedCount);
        }
    }
}

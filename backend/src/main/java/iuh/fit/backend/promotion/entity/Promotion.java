package iuh.fit.backend.promotion.entity;

import iuh.fit.backend.billing.entity.Invoice;
import iuh.fit.backend.promotion.enums.PromotionStatus;
import iuh.fit.backend.promotion.enums.PromotionType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "promotions")
public class Promotion {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(length = 255, nullable = false)
    private String title;

    @Column(name = "coupon_code", length = 100)
    private String couponCode;

    @Column(length = 255)
    private String category;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 1000)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "promotion_type", length = 50)
    private PromotionType promotionType;

    @Column(name = "discount_percent", precision = 5, scale = 2)
    private BigDecimal discountPercent;

    @Column(name = "discount_amount", precision = 15, scale = 2)
    private BigDecimal discountAmount;

    @Column(name = "max_discount_amount", precision = 15, scale = 2)
    private BigDecimal maxDiscountAmount;

    @Column(name = "min_order_amount", precision = 15, scale = 2)
    private BigDecimal minOrderAmount;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(name = "usage_limit")
    private Integer usageLimit;

    @Builder.Default
    @Column(name = "used_count")
    private Integer usedCount = 0;

    @Builder.Default
    @Column(name = "apply_all_services")
    private Boolean applyAllServices = false;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private PromotionStatus status;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder.Default
    @OneToMany(mappedBy = "promotion", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PromotionService> promotionServices = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "promotion", fetch = FetchType.LAZY)
    private List<Invoice> invoices = new ArrayList<>();

    // =========================================================================
    // LIFECYCLE CALLBACKS
    // =========================================================================

    @PrePersist
    public void prePersist() {
        if (this.usedCount == null) {
            this.usedCount = 0;
        }
        if (this.applyAllServices == null) {
            this.applyAllServices = (promotionServices == null || promotionServices.isEmpty());
        }
        if (this.status == null) {
            this.status = PromotionStatus.ACTIVE;
        }
        autoResolvePromotionType();
        autoSyncStatus();
    }

    @PreUpdate
    public void preUpdate() {
        if (this.usedCount == null) {
            this.usedCount = 0;
        }
        autoResolvePromotionType();
        autoSyncStatus();
    }

    private void autoResolvePromotionType() {
        if (this.promotionType == null) {
            if (this.couponCode != null && !this.couponCode.trim().isEmpty()) {
                this.promotionType = PromotionType.VOUCHER;
            } else if (this.discountAmount != null && this.discountAmount.compareTo(BigDecimal.ZERO) > 0
                    && (this.discountPercent == null || this.discountPercent.compareTo(BigDecimal.ZERO) <= 0)) {
                this.promotionType = PromotionType.FIXED_AMOUNT;
            } else {
                this.promotionType = PromotionType.DISCOUNT_PERCENT;
            }
        }
    }

    public void autoSyncStatus() {
        LocalDateTime now = LocalDateTime.now();
        if (this.endDate != null && this.endDate.isBefore(now)) {
            this.status = PromotionStatus.EXPIRED;
            return;
        }
        if (this.usageLimit != null && this.usageLimit > 0 && this.usedCount != null && this.usedCount >= this.usageLimit) {
            this.status = PromotionStatus.EXPIRED;
            return;
        }
        if (this.status == null) {
            this.status = PromotionStatus.ACTIVE;
        }
    }

    // =========================================================================
    // BUSINESS DOMAIN LOGIC
    // =========================================================================

    /**
     * Kiểm tra chương trình khuyến mãi có còn hiệu lực không
     */
    public boolean isValid() {
        LocalDateTime now = LocalDateTime.now();
        boolean timeValid = (startDate == null || !startDate.isAfter(now))
                && (endDate == null || !endDate.isBefore(now));
        boolean limitValid = (usageLimit == null || usageLimit <= 0
                || (usedCount != null && usedCount < usageLimit));
        return status == PromotionStatus.ACTIVE && timeValid && limitValid;
    }

    /**
     * Kiểm tra xem ưu đãi có thể áp dụng cho mức tiền cụ thể không
     */
    public boolean canApply(BigDecimal orderAmount) {
        if (!isValid()) {
            return false;
        }
        if (minOrderAmount != null && minOrderAmount.compareTo(BigDecimal.ZERO) > 0) {
            return orderAmount != null && orderAmount.compareTo(minOrderAmount) >= 0;
        }
        return true;
    }

    /**
     * Tính toán số tiền được giảm giá theo đúng nghiệp vụ
     */
    public BigDecimal calculateDiscount(BigDecimal orderAmount) {
        if (orderAmount == null || orderAmount.compareTo(BigDecimal.ZERO) <= 0 || !canApply(orderAmount)) {
            return BigDecimal.ZERO;
        }

        BigDecimal discount = BigDecimal.ZERO;

        if (discountPercent != null && discountPercent.compareTo(BigDecimal.ZERO) > 0) {
            discount = orderAmount.multiply(discountPercent)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            if (maxDiscountAmount != null && maxDiscountAmount.compareTo(BigDecimal.ZERO) > 0) {
                discount = discount.min(maxDiscountAmount);
            }
        } else if (discountAmount != null && discountAmount.compareTo(BigDecimal.ZERO) > 0) {
            discount = discountAmount;
        }

        // Không được giảm quá tổng số tiền đơn hàng
        return discount.min(orderAmount);
    }

    /**
     * Tăng số lượt sử dụng và cập nhật trạng thái nếu đạt giới hạn
     */
    public void incrementUsedCount() {
        this.usedCount = (this.usedCount != null ? this.usedCount : 0) + 1;
        if (this.usageLimit != null && this.usageLimit > 0 && this.usedCount >= this.usageLimit) {
            this.status = PromotionStatus.EXPIRED;
        }
    }

    /**
     * Kiểm tra ưu đãi sắp hết hạn trong vòng n ngày (phục vụ nút gia hạn)
     */
    public boolean isExpiringSoon(int days) {
        if (this.endDate == null || this.status == PromotionStatus.EXPIRED) {
            return false;
        }
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime threshold = now.plusDays(days);
        return !this.endDate.isBefore(now) && !this.endDate.isAfter(threshold);
    }

    /**
     * Gia hạn thêm số ngày kết thúc và kích hoạt lại trạng thái ACTIVE nếu trước đó hết hạn do ngày
     */
    public void extendEndDate(int days) {
        LocalDateTime base = (this.endDate != null && this.endDate.isAfter(LocalDateTime.now()))
                ? this.endDate
                : LocalDateTime.now();
        this.endDate = base.plusDays(days);
        if (this.status == PromotionStatus.EXPIRED && (this.usageLimit == null || this.usedCount < this.usageLimit)) {
            this.status = PromotionStatus.ACTIVE;
        }
    }
}

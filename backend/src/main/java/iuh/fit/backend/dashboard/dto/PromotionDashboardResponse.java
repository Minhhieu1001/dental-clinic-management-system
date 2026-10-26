package iuh.fit.backend.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromotionDashboardResponse {
    private String periodLabel;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String branchId;
    private String branchName;

    // Tổng quan khuyến mãi
    private Long totalPromotions;           // Tổng chương trình khuyến mãi
    private Long activePromotions;          // Chương trình đang áp dụng
    private Long totalUsageCount;           // Lượt sử dụng trong kỳ
    private BigDecimal totalDiscountAmount; // Tổng tiền giảm cho khách
    private Long totalInvoicesApplied;      // Số hóa đơn có áp dụng khuyến mãi
    private BigDecimal totalSalesGenerated; // Tổng doanh số tạo ra từ các hóa đơn có KM

    // Chi tiết từng chương trình khuyến mãi
    private List<PromotionDetailItem> promotions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PromotionDetailItem {
        private String id;
        private String title;
        private String couponCode;
        private String promotionType;
        private BigDecimal discountPercent;
        private BigDecimal discountAmount;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        private String status;
        private Long usageCount;            // Lượt sử dụng trong kỳ
        private Long invoicesCount;         // Số hóa đơn áp dụng
        private BigDecimal discountGiven;   // Tiền giảm bao nhiêu
        private BigDecimal salesGenerated;  // Doanh thu hóa đơn áp dụng mã này
    }
}

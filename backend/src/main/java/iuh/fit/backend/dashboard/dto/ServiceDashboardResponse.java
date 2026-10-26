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
public class ServiceDashboardResponse {
    private String periodLabel;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String branchId;
    private String branchName;

    // Tổng quan dịch vụ
    private Long totalServicesCount;        // Tổng số dịch vụ trong hệ thống
    private Long activeServicesCount;       // Dịch vụ đang hoạt động
    private Long totalUsageCount;           // Tổng lượt thực hiện dịch vụ trong kỳ
    private BigDecimal totalServiceRevenue; // Tổng doanh thu dịch vụ trong kỳ

    // So sánh với kỳ trước (năm / quý / tháng)
    private BigDecimal prevServiceRevenue;
    private Long prevUsageCount;
    private Double revenueGrowthPercent;    // % tăng/giảm doanh thu so với kỳ trước
    private Double usageGrowthPercent;      // % tăng/giảm lượt thực hiện

    // Thống kê dịch vụ theo từng tháng trong năm
    private List<MonthlyServiceStat> monthlyStats;

    // Chi tiết từng dịch vụ
    private List<ServiceUsageItem> services;

    // Phân bổ theo danh mục dịch vụ (Category)
    private List<ServiceCategoryStat> categoryStats;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyServiceStat {
        private String monthKey;            // e.g. "2026-07" or "Tháng 07"
        private String label;
        private Long usageCount;            // Lượt sử dụng
        private BigDecimal revenue;         // Doanh thu
        private Double growthRate;          // So với tháng trước
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceUsageItem {
        private String serviceId;
        private String serviceCode;
        private String serviceName;
        private String category;
        private String categoryName;
        private String unit;
        private BigDecimal basePrice;
        private Long usageCount;            // Số lượt sử dụng trong kỳ
        private BigDecimal totalRevenue;    // Doanh thu mang lại
        private BigDecimal prevPeriodRevenue;
        private Double growthPercent;       // Tăng giảm bao nhiêu % so với kỳ trước
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceCategoryStat {
        private String category;
        private String categoryName;
        private Long serviceCount;
        private Long usageCount;
        private BigDecimal totalRevenue;
        private Double percentage;
    }
}

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
public class RevenueDashboardResponse {
    private String periodLabel;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String branchId;
    private String branchName;
    private String comparisonMode;
    private String paymentStatus;
    private String paymentMethod;
    private String patientSegment;

    // Core indicators
    private Long totalInvoices;
    private BigDecimal invoiceRevenue;       // Tong doanh thu tren hoa don (final_amount)
    private BigDecimal actualCollected;       // Thuc thu tu payment_transactions
    private BigDecimal remainingDebt;         // Cong no con lai (remaining_amount)

    // Growth compared to previous period (%)
    private Double invoiceCountGrowthRate;
    private Double invoiceRevenueGrowthRate;
    private Double actualCollectedGrowthRate;
    private Double remainingDebtGrowthRate;

    // Chi tiet doanh thu
    private BigDecimal totalAmount;           // Tong tien truoc giam
    private BigDecimal totalDiscount;         // Tong tien giam gia
    private BigDecimal serviceAmount;         // Tien dich vu
    private BigDecimal medicineAmount;        // Tien thuoc
    private BigDecimal otherAmount;  // Thu ho / phu thu khac

    // Xu huong doanh thu (trend data for chart)
    private List<RevenueTrendPoint> trend;

    // Phân bổ phương thức thanh toán
    private List<PaymentMethodStat> paymentMethods;

    // Phân bổ trạng thái hóa đơn
    private List<InvoiceStatusStat> invoiceStatuses;

    // Danh sách giao dịch / hóa đơn gần nhất trong kỳ
    private List<RecentPaymentItem> recentPayments;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RevenueTrendPoint {
        private String dateKey;               // e.g. "2026-10-15" or "Thg 10"
        private String label;
        private BigDecimal invoiceRevenue;
        private BigDecimal actualCollected;
        private BigDecimal remainingDebt;
        private Long invoiceCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentMethodStat {
        private String method;
        private String methodName;
        private Long count;
        private BigDecimal amount;
        private Double percentage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InvoiceStatusStat {
        private String status;
        private String statusName;
        private Long count;
        private BigDecimal amount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentPaymentItem {
        private String id;
        private String transactionCode;
        private String invoiceCode;
        private String patientName;
        private BigDecimal amount;
        private String paymentMethod;
        private String status;
        private LocalDateTime paymentTime;
        private String cashierName;
    }
}

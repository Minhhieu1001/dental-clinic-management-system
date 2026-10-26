package iuh.fit.backend.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardOverviewResponse {
    private String periodLabel;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String branchId;
    private String branchName;
    private String comparisonMode;
    private String paymentStatus;
    private String paymentMethod;
    private String patientSegment;

    // 1. Doanh thu
    private RevenueSummary revenue;

    // 2. Nhân sự
    private StaffSummary staff;

    // 3. Vật tư & Thuốc
    private MedicineSummary medicines;

    // 4. Dịch vụ
    private ServiceSummary services;

    // 5. Khuyến mãi
    private PromotionSummary promotions;

    // 6. Lịch hẹn
    private AppointmentSummary appointments;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RevenueSummary {
        private Long totalInvoices;
        private BigDecimal invoiceRevenue;
        private BigDecimal actualCollected;
        private BigDecimal remainingDebt;
        private Double revenueGrowthRate;
        private Double actualGrowthRate;
        private BigDecimal serviceAmount;
        private BigDecimal medicineAmount;
        private BigDecimal otherAmount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StaffSummary {
        private Long totalStaff;
        private Long totalDoctors;
        private Long totalEmployees;
        private Long totalReceptionists;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MedicineSummary {
        private Long totalMedicinesCount;
        private Long totalUsedCount;
        private Long totalUnitsDispensed;
        private BigDecimal totalRevenue;
        private Long lowStockCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceSummary {
        private Long totalServices;
        private Long totalUsageCount;
        private BigDecimal totalRevenue;
        private Double growthRate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PromotionSummary {
        private Long totalPromotions;
        private Long activePromotions;
        private Long totalUsageCount;
        private BigDecimal totalDiscountAmount;
        private Long totalInvoicesApplied;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AppointmentSummary {
        private Long totalAppointments;
        private Long completedAppointments;
        private Long cancelledAppointments;
        private Long confirmedAppointments;
        private Double completionRate;
        private Double cancellationRate;
        private Double growthRate;
    }
}

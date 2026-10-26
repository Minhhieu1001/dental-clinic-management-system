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
public class MedicineDashboardResponse {
    private String periodLabel;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String branchId;
    private String branchName;

    // Tổng quan
    private Long totalMedicinesCount;       // Tổng số loại thuốc trong danh mục
    private Long totalMedicinesUsedCount;   // Số loại thuốc có phát sinh dùng trong kỳ
    private Long totalUnitsDispensed;       // Tổng số lượng thuốc đã dùng (viên/chai/vỉ)
    private BigDecimal totalMedicineRevenue; // Tiền thu được từ thuốc
    private Long lowStockCount;             // Số loại thuốc sắp hết hàng (< 30)

    // Chi tiết từng loại thuốc được sử dụng
    private List<MedicineUsageItem> medicines;

    // Chi tiết vật tư tiêu hao trong kho (Supplies)
    private List<SupplyStockItem> supplies;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MedicineUsageItem {
        private String medicineId;
        private String code;
        private String name;
        private String unit;
        private String manufacturer;
        private Integer stockQuantity;
        private BigDecimal price;
        private Long quantityUsed;          // Số lượng đã sử dụng
        private BigDecimal totalRevenue;    // Tiền thu được
        private Long prescriptionCount;     // Số đơn thuốc áp dụng
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SupplyStockItem {
        private String supplyId;
        private String suppliesName;
        private String unit;
        private Integer stockQuantity;
        private Integer minStock;
        private Long exportedQuantity;      // Số lượng xuất kho trong kỳ
    }
}

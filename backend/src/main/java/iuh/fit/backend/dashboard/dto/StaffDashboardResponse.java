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
public class StaffDashboardResponse {
    private String periodLabel;
    private LocalDateTime startDate;
    private LocalDateTime endDate;

    // Tổng quan nhân sự
    private Long totalStaff;
    private Long totalDoctors;
    private Long totalEmployees;
    private Long totalReceptionists;
    private Long totalWarehouse;

    // Chi tiết Bác sĩ
    private List<DoctorStatItem> doctors;

    // Chi tiết Lễ tân / Nhân viên
    private List<EmployeeStatItem> employees;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DoctorStatItem {
        private String dentistId;
        private String fullName;
        private String phone;
        private String email;
        private String specialization;
        private Integer experienceYears;
        private Long examCount;              // Số lượt khám (appointments completed / examinations)
        private Long completedTreatments;   // Số ca điều trị hoàn thành (treatment plans completed)
        private BigDecimal serviceRevenue;  // Doanh thu dịch vụ được thực hiện
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployeeStatItem {
        private String employeeId;
        private String fullName;
        private String position;
        private String positionLabel;
        private String phone;
        private String email;
        private Long appointmentsReceived;  // Số lịch tiếp nhận
        private Long invoicesAssisted;      // Số hóa đơn hỗ trợ thanh toán
        private BigDecimal totalAssistedAmount; // Tổng tiền thanh toán hỗ trợ
    }
}

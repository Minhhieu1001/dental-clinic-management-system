package iuh.fit.backend.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentDashboardResponse {
    private String periodLabel;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String branchId;
    private String branchName;

    // Chỉ số tổng quan
    private Long totalAppointments;         // Tổng số lịch hẹn
    private Long completedAppointments;     // Lịch hoàn thành
    private Long cancelledAppointments;     // Lịch hủy
    private Long confirmedAppointments;     // Lịch đã xác nhận
    private Long waitingAppointments;       // Lịch đang chờ
    private Long inProgressAppointments;    // Lịch đang khám

    // Tỉ lệ %
    private Double completionRate;          // Tỉ lệ hoàn thành (%)
    private Double cancellationRate;        // Tỉ lệ hủy (%)

    // So sánh với kỳ trước
    private Long prevTotalAppointments;
    private Long prevCompletedAppointments;
    private Long prevCancelledAppointments;
    private Double totalGrowthRate;         // % tăng/giảm so với kỳ trước

    // Phân bổ trạng thái
    private List<AppointmentStatusStat> statusBreakdown;

    // Xu hướng lịch hẹn theo thời gian (trend data for chart)
    private List<AppointmentTrendPoint> trend;

    // Phân bổ lịch hẹn theo Bác sĩ
    private List<DoctorAppointmentStat> doctorStats;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AppointmentStatusStat {
        private String status;
        private String statusName;
        private Long count;
        private Double percentage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AppointmentTrendPoint {
        private String dateKey;
        private String label;
        private Long total;
        private Long completed;
        private Long cancelled;
        private Long other;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DoctorAppointmentStat {
        private String dentistId;
        private String doctorName;
        private Long total;
        private Long completed;
        private Long cancelled;
    }
}

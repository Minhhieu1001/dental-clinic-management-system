package iuh.fit.backend.customercare.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentCareItemDTO {
    private UUID appointmentId;
    private UUID patientId;
    private String patientCode;
    private String patientName;
    private String phone;
    private LocalDateTime appointmentTime;
    private String dentistName;
    private String scheduleStatus; // Chưa đến, Đã đến, Không đến, Đang điều trị, Đã xong
    private String careStatus; // Cần chăm sóc lại, Chưa chăm sóc, Hoàn thành, Gửi thất bại, Không nghe máy
    private String careChannel; // Gọi điện, Zalo SMS, Tin nhắn...
    private LocalDateTime careTime;
    private String careNotes;
    private String outcome;
    private LocalDateTime nextCareDate;
    private Boolean reminded1Day;
    private Boolean reminded1Hour;
    private String assignedEmployeeName;
    private UUID lastCareId;
    private String serviceName; // Dịch vụ / Lý do khám
    private String customerGroup; // Khách VIP, Khách thân thiết, Khách mới...
    private Boolean isToday;
    private Boolean isTomorrow;
    private Integer daysUntil;
    private String appointmentType; // Đặt trước, Tái khám...
    private Boolean isFollowUp;     // true: Lịch tái khám, false: Lịch hẹn
}

package iuh.fit.backend.customercare.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientCareDetailDTO {

    // 1. Thông tin khách hàng
    private UUID patientId;
    private String patientCode;
    private String fullName;
    private String phone;
    private LocalDateTime dateOfBirth;
    private String dateOfBirthFormatted; // "30-10-1989"
    private String address;
    private String customerGroup;
    private String customerSource;
    private String customerCard;
    private String notes;

    // 2. Thông tin nhắc lịch hẹn (ngữ cảnh hiện tại hoặc lịch hẹn gần nhất)
    private AppointmentReminderInfoDTO reminderInfo;

    // 3. Lịch sử chăm sóc
    private List<CustomerCareRecordResponseDTO> careHistory;

    // 4. Lịch hẹn của bệnh nhân
    private List<PatientAppointmentDTO> appointments;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AppointmentReminderInfoDTO {
        private UUID appointmentId;
        private LocalDateTime appointmentTime;
        private String timeFormatted;   // "18:30 21-10-2024"
        private String status;          // "Chưa đến", "Đang điều trị"...
        private String statusCode;      // "PENDING", "IN_PROGRESS"...
        private String dentistName;     // "BS Hoàng Văn Tiến"
        private String content;         // "Điều trị tủy"
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PatientAppointmentDTO {
        private UUID id;
        private LocalDateTime appointmentTime;
        private String timeFormatted;   // "21/10/2024, 18:30"
        private String appointmentType; // "Đặt trước", "Dự kiến"
        private UUID dentistId;
        private String dentistName;
        private String content;         // Dịch vụ / Lý do khám
        private String notes;           // Ghi chú
        private String status;          // PENDING, IN_PROGRESS, WAITING, COMPLETED, CANCELLED
        private String statusLabel;     // "Chưa đến", "Đang điều trị", "Đã hẹn lại", "Đã xong", "Đã hủy"
    }
}

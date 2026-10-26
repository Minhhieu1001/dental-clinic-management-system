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
public class PostTreatmentCareItemDTO {
    private UUID appointmentId;
    private UUID patientId;
    private String patientCode;
    private String patientName;
    private String phone;
    private String email;
    private LocalDateTime completedTime; // Thời gian hoàn tất khám/thủ thuật
    private String dentistName;
    private String serviceName;          // Thủ thuật đã thực hiện (nhổ răng, cấy implant, điều trị tủy...)
    private String customerGroup;
    private String careStatus;           // Chưa chăm sóc, Liên hệ thành công, Hẹn chăm sóc lại, Không nghe máy
    private String careChannel;          // Gọi điện, Zalo, SMS, Trực tiếp
    private LocalDateTime careTime;
    private String careNotes;
    private String outcome;              // Hồi phục tốt, Đau/khó chịu nhẹ, Cần khám lại khẩn cấp, Đã uống thuốc theo đơn
    private LocalDateTime nextCareDate;
    private String assignedEmployeeName;
    private UUID lastCareId;
    private Integer daysSinceTreatment;  // Đã qua bao nhiêu ngày kể từ khi điều trị
}

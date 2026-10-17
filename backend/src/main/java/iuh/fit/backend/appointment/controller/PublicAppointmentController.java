package iuh.fit.backend.appointment.controller;

import iuh.fit.backend.appointment.dto.AppointmentCreateDTO;
import iuh.fit.backend.appointment.dto.AppointmentDetailDTO;
import iuh.fit.backend.appointment.service.AppointmentService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class PublicAppointmentController {

    private final AppointmentService appointmentService;

    @GetMapping
    public List<AppointmentDetailDTO> getAppointments() {
        return appointmentService.getAllAppointments(null, null, null);
    }

    @PostMapping
    public ResponseEntity<?> createPublicAppointment(@RequestBody LegacyAppointmentRequest request) {
        try {
            AppointmentCreateDTO dto = AppointmentCreateDTO.builder()
                    .fullName(request.getFullName())
                    .phone(request.getPhone())
                    .branchName(request.getBranchName())
                    .appointmentDate(request.getDate())
                    .appointmentTime(request.getTime())
                    .reason("Đặt lịch trực tuyến: Dịch vụ " + (request.getServiceName() != null ? request.getServiceName() : "Khám tổng quát"))
                    .notes(request.getMessage())
                    .build();

            AppointmentDetailDTO created = appointmentService.createAppointment(dto);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Đặt lịch hẹn thành công!");
            response.put("appointmentId", created.getId());
            response.put("patientCode", created.getPatientCode());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Lỗi tạo lịch hẹn: " + e.getMessage()
            ));
        }
    }

    @Data
    public static class LegacyAppointmentRequest {
        private String fullName;
        private String phone;
        private String serviceName;
        private String branchName;
        private String message;
        private String date;
        private String time;
    }
}

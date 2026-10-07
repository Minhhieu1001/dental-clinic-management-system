package iuh.fit.backend.appointment.controller;

import iuh.fit.backend.appointment.dto.FollowUpAppointmentDTO;
import iuh.fit.backend.appointment.dto.FollowUpAppointmentRequestDTO;
import iuh.fit.backend.appointment.service.FollowUpAppointmentService;
import iuh.fit.backend.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/follow-up-appointments")
@RequiredArgsConstructor
public class FollowUpAppointmentController {

    private final FollowUpAppointmentService followUpAppointmentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<FollowUpAppointmentDTO>>> getAllFollowUpAppointments(
            @RequestParam(required = false) UUID patientId,
            @RequestParam(required = false) UUID examinationResultId,
            @RequestParam(required = false) String patientCode
    ) {
        List<FollowUpAppointmentDTO> list = followUpAppointmentService.getAllFollowUpAppointments(patientId, examinationResultId, patientCode);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách lịch tái khám thành công", list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FollowUpAppointmentDTO>> getFollowUpAppointmentById(@PathVariable UUID id) {
        FollowUpAppointmentDTO dto = followUpAppointmentService.getFollowUpAppointmentById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết lịch tái khám thành công", dto));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FollowUpAppointmentDTO>> createFollowUpAppointment(
            @Valid @RequestBody FollowUpAppointmentRequestDTO request
    ) {
        FollowUpAppointmentDTO created = followUpAppointmentService.createFollowUpAppointment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo lịch tái khám thành công", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<FollowUpAppointmentDTO>> updateFollowUpAppointment(
            @PathVariable UUID id,
            @Valid @RequestBody FollowUpAppointmentRequestDTO request
    ) {
        FollowUpAppointmentDTO updated = followUpAppointmentService.updateFollowUpAppointment(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật lịch tái khám thành công", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFollowUpAppointment(@PathVariable UUID id) {
        followUpAppointmentService.deleteFollowUpAppointment(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa lịch tái khám thành công", null));
    }
}

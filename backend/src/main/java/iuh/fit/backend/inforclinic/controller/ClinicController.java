package iuh.fit.backend.inforclinic.controller;

import iuh.fit.backend.common.response.ApiResponse;
import iuh.fit.backend.inforclinic.dto.ClinicRequest;
import iuh.fit.backend.inforclinic.dto.ClinicResponse;
import iuh.fit.backend.inforclinic.service.ClinicService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ClinicController {
    private final ClinicService clinicService;

    @GetMapping("/clinics")
    public ResponseEntity<ApiResponse<List<ClinicResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách phòng khám thành công", clinicService.getAll()));
    }

    @GetMapping("/clinics/{clinicId}")
    public ResponseEntity<ApiResponse<ClinicResponse>> getById(@PathVariable String clinicId) {
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin phòng khám thành công", clinicService.getById(clinicId)));
    }

    @PostMapping("/admin/clinics")
    public ResponseEntity<ApiResponse<ClinicResponse>> create(@Valid @RequestBody ClinicRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo phòng khám thành công", clinicService.create(request)));
    }

    @PutMapping("/admin/clinics/{clinicId}")
    public ResponseEntity<ApiResponse<ClinicResponse>> update(
            @PathVariable String clinicId, @Valid @RequestBody ClinicRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật phòng khám thành công",
                clinicService.update(clinicId, request)));
    }

    @DeleteMapping("/admin/clinics/{clinicId}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String clinicId) {
        clinicService.delete(clinicId);
        return ResponseEntity.ok(ApiResponse.success("Xóa phòng khám thành công", null));
    }
}

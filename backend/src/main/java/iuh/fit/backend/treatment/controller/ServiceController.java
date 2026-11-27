package iuh.fit.backend.treatment.controller;

import iuh.fit.backend.common.response.ApiResponse;
import iuh.fit.backend.treatment.dto.ServiceCreateDTO;
import iuh.fit.backend.treatment.dto.ServiceDTO;
import iuh.fit.backend.treatment.enums.ServiceCategory;
import iuh.fit.backend.treatment.service.DentalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/v1/services", "/api/services"})
@RequiredArgsConstructor
public class ServiceController {

    private final DentalService dentalService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ServiceDTO>>> getAllServices(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ServiceCategory category,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) Boolean isFeatured) {
        List<ServiceDTO> services = dentalService.getAllServices(search, category, isActive, isFeatured);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách dịch vụ thành công", services));
    }

    @GetMapping("/top-5")
    public ResponseEntity<ApiResponse<List<ServiceDTO>>> getTopFiveServices() {
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy 5 gói dịch vụ thành công",
                dentalService.getTopFiveServices()));
    }

    @GetMapping("/by-budget")
    public ResponseEntity<ApiResponse<List<ServiceDTO>>> getServicesByBudget(
            @RequestParam BigDecimal maxPrice) {
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy danh sách dịch vụ phù hợp với ngân sách thành công",
                dentalService.getServicesByBudget(maxPrice)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ServiceDTO>> getServiceById(@PathVariable UUID id) {
        ServiceDTO service = dentalService.getServiceById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin chi tiết dịch vụ thành công", service));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ServiceDTO>> createService(@Valid @RequestBody ServiceCreateDTO dto) {
        ServiceDTO created = dentalService.createService(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo dịch vụ mới thành công", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ServiceDTO>> updateService(
            @PathVariable UUID id,
            @Valid @RequestBody ServiceCreateDTO dto) {
        ServiceDTO updated = dentalService.updateService(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin dịch vụ thành công", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteService(@PathVariable UUID id) {
        dentalService.deleteService(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa dịch vụ thành công", null));
    }

    @PatchMapping("/{id}/toggle-active")
    public ResponseEntity<ApiResponse<ServiceDTO>> toggleActiveStatus(@PathVariable UUID id) {
        ServiceDTO updated = dentalService.toggleActiveStatus(id);
        return ResponseEntity.ok(ApiResponse.success("Thay đổi trạng thái hoạt động dịch vụ thành công", updated));
    }

    @PatchMapping("/{id}/toggle-featured")
    public ResponseEntity<ApiResponse<ServiceDTO>> toggleFeaturedStatus(@PathVariable UUID id) {
        ServiceDTO updated = dentalService.toggleFeaturedStatus(id);
        return ResponseEntity.ok(ApiResponse.success("Thay đổi trạng thái dịch vụ nổi bật thành công", updated));
    }
}

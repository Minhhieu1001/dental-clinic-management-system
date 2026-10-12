package iuh.fit.backend.inforclinic.controller;

import iuh.fit.backend.common.response.ApiResponse;
import iuh.fit.backend.inforclinic.dto.BranchRequest;
import iuh.fit.backend.inforclinic.dto.BranchResponse;
import iuh.fit.backend.inforclinic.service.BranchService;
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
public class BranchController {
    private final BranchService branchService;

    @GetMapping("/branches")
    public ResponseEntity<ApiResponse<List<BranchResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách chi nhánh thành công", branchService.getAll()));
    }

    @GetMapping("/branches/{branchId}")
    public ResponseEntity<ApiResponse<BranchResponse>> getById(@PathVariable String branchId) {
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin chi nhánh thành công", branchService.getById(branchId)));
    }

    @GetMapping("/clinics/{clinicId}/branches")
    public ResponseEntity<ApiResponse<List<BranchResponse>>> getByClinic(@PathVariable String clinicId) {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách chi nhánh của phòng khám thành công",
                branchService.getByClinicId(clinicId)));
    }

    @PostMapping("/admin/branches")
    public ResponseEntity<ApiResponse<BranchResponse>> create(@Valid @RequestBody BranchRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo chi nhánh thành công", branchService.create(request)));
    }

    @PutMapping("/admin/branches/{branchId}")
    public ResponseEntity<ApiResponse<BranchResponse>> update(
            @PathVariable String branchId, @Valid @RequestBody BranchRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật chi nhánh thành công",
                branchService.update(branchId, request)));
    }

    @DeleteMapping("/admin/branches/{branchId}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String branchId) {
        branchService.delete(branchId);
        return ResponseEntity.ok(ApiResponse.success("Xóa chi nhánh thành công", null));
    }
}

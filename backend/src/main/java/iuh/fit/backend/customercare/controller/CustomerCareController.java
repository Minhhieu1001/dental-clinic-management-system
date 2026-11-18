package iuh.fit.backend.customercare.controller;

import iuh.fit.backend.common.response.ApiResponse;
import iuh.fit.backend.customercare.dto.CustomerCareResponse;
import iuh.fit.backend.customercare.dto.CustomerCareRequest;
import iuh.fit.backend.customercare.dto.BulkCareMessageDTO;
import iuh.fit.backend.customercare.dto.BulkCareResponse;
import jakarta.validation.Valid;
import iuh.fit.backend.customercare.dto.CustomerCareSuggestionResponse;
import iuh.fit.backend.customercare.dto.CustomerCareSummaryResponse;
import iuh.fit.backend.customercare.service.CustomerCareService;
import iuh.fit.backend.patient.dto.PatientWithInvoicesResponse;
import iuh.fit.backend.patient.service.PatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/customer-care")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
public class CustomerCareController {
    private final PatientService patientService;
    private final CustomerCareService customerCareService;

    @PostMapping("/bulk-promotions")
    public ResponseEntity<ApiResponse<BulkCareResponse>> createBulk(
            @Valid @RequestBody BulkCareMessageDTO request) {
        return ResponseEntity.accepted().body(ApiResponse.<BulkCareResponse>builder().status(202)
                .message("Đã lưu chăm sóc khách hàng và xếp hàng gửi email")
                .data(customerCareService.createBulkPromotion(request)).build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CustomerCareResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết chăm sóc khách hàng thành công",
                customerCareService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CustomerCareResponse>> create(@Valid @RequestBody CustomerCareRequest request) {
        CustomerCareResponse response = customerCareService.create(request);
        return ResponseEntity.status(201).body(ApiResponse.<CustomerCareResponse>builder()
                .status(201).message("Tạo chăm sóc khách hàng thành công").data(response).build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CustomerCareResponse>> update(
            @PathVariable UUID id, @Valid @RequestBody CustomerCareRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật chăm sóc khách hàng thành công",
                customerCareService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        customerCareService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa chăm sóc khách hàng thành công", null));
    }

    @GetMapping("/suggestions")
    public ResponseEntity<ApiResponse<List<CustomerCareSuggestionResponse>>> getSuggestions(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) UUID patientId) {
        return ResponseEntity.ok(ApiResponse.success("Lấy gợi ý chăm sóc khách hàng thành công",
                customerCareService.getSuggestions(month, year, patientId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CustomerCareResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy danh sách chăm sóc khách hàng thành công", customerCareService.getAll()));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<CustomerCareSummaryResponse>> getSummary() {
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy thống kê chăm sóc khách hàng thành công", customerCareService.getSummary()));
    }

    @GetMapping({"/patients-with-invoices", "/patients"})
    public ResponseEntity<ApiResponse<List<PatientWithInvoicesResponse>>> getPatientsWithInvoices() {
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy danh sách bệnh nhân và hóa đơn thành công", patientService.getPatientsWithInvoices()));
    }
}

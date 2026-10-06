package iuh.fit.backend.billing.controller;

import iuh.fit.backend.billing.dto.CreateInvoiceRequest;
import iuh.fit.backend.billing.dto.InvoiceListResponse;
import iuh.fit.backend.billing.dto.InvoiceResponse;
import iuh.fit.backend.billing.dto.PaymentRequest;
import iuh.fit.backend.billing.enums.PaymentStatus;
import iuh.fit.backend.billing.service.InvoiceService;
import iuh.fit.backend.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping
    public ResponseEntity<ApiResponse<InvoiceListResponse>> getAllInvoiceDateDesc(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(required = false) String search
    ) {
        InvoiceListResponse result = invoiceService.getAllInvoiceDateDesc(year, month, status, search);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách hóa đơn thành công", result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoiceById(@PathVariable UUID id) {
        InvoiceResponse invoice = invoiceService.getInvoiceById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin hóa đơn thành công", invoice));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<InvoiceResponse>> createInvoice(@RequestBody CreateInvoiceRequest request) {
        InvoiceResponse invoice = invoiceService.createInvoice(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo hóa đơn thành công", invoice));
    }

    @PostMapping("/{id}/payments")
    public ResponseEntity<ApiResponse<InvoiceResponse>> processPayment(
            @PathVariable UUID id,
            @RequestBody PaymentRequest request
    ) {
        InvoiceResponse invoice = invoiceService.processPayment(id, request);
        return ResponseEntity.ok(ApiResponse.success("Thanh toán hóa đơn thành công", invoice));
    }
}

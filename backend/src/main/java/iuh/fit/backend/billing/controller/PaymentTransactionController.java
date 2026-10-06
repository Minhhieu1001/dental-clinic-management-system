package iuh.fit.backend.billing.controller;

import iuh.fit.backend.billing.dto.PaymentTransactionDTO;
import iuh.fit.backend.billing.service.PaymentTransactionService;
import iuh.fit.backend.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payment-transactions")
@RequiredArgsConstructor
public class PaymentTransactionController {

    private final PaymentTransactionService paymentTransactionService;

    @GetMapping("/invoice/{invoiceId}")
    public ResponseEntity<ApiResponse<List<PaymentTransactionDTO>>> getPaymentTransactionsByInvoiceId(@PathVariable UUID invoiceId) {
        List<PaymentTransactionDTO> transactions = paymentTransactionService.getPaymentTransactionsByInvoiceId(invoiceId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách lịch sử thanh toán thành công", transactions));
    }
}

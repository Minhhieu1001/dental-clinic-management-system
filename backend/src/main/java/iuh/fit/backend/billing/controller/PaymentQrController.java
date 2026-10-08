package iuh.fit.backend.billing.controller;

import iuh.fit.backend.billing.dto.CassoWebhookPayload;
import iuh.fit.backend.billing.dto.InitiateQrRequest;
import iuh.fit.backend.billing.dto.InitiateQrResponse;
import iuh.fit.backend.billing.service.PaymentQrService;
import iuh.fit.backend.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentQrController {

    private final PaymentQrService paymentQrService;


     // API Khởi tạo Mã QR VietQR Động & Lưu nháp vào RAM (Giai đoạn 2)

    @PostMapping("/initiate-qr")
    public ResponseEntity<ApiResponse<InitiateQrResponse>> initiateQrPayment(
            @RequestBody InitiateQrRequest request
    ) {
        InitiateQrResponse response = paymentQrService.initiateQrPayment(request);
        return ResponseEntity.ok(ApiResponse.success("Khởi tạo mã VietQR động thành công", response));
    }

    //API Webhook nhận thông báo chuyển khoản tự động từ Casso.vn
    //(Cấu hình Webhook Casso: https://<NGROK_DOMAIN>/api/v1/payments/casso-webhook)

    @PostMapping("/casso-webhook")
    public ResponseEntity<ApiResponse<String>> processCassoWebhook(
            @RequestBody CassoWebhookPayload payload
    ) {
        log.info("Nhận thông báo Webhook từ Casso: {}", payload);
        paymentQrService.processCassoWebhook(payload);
        return ResponseEntity.ok(ApiResponse.success("Đã xử lý thông báo Casso Webhook thành công", "SUCCESS"));
    }


     //API Hủy bản nháp thanh toán trong RAM khi Thu ngân tắt Modal QR

    @DeleteMapping("/qr-draft/{invoiceId}")
    public ResponseEntity<ApiResponse<String>> cancelQrDraft(
            @PathVariable UUID invoiceId
    ) {
        paymentQrService.cancelQrDraft(invoiceId);
        return ResponseEntity.ok(ApiResponse.success("Đã hủy bản nháp thanh toán thành công", "CANCELLED"));
    }
}

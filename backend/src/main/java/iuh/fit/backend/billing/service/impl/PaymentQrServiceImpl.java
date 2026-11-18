package iuh.fit.backend.billing.service.impl;

import iuh.fit.backend.billing.cache.PaymentDraft;
import iuh.fit.backend.billing.cache.PaymentDraftCache;
import iuh.fit.backend.billing.dto.*;
import iuh.fit.backend.billing.entity.Invoice;
import iuh.fit.backend.billing.enums.PaymentMethod;
import iuh.fit.backend.billing.repository.InvoiceRepository;
import iuh.fit.backend.billing.service.InvoiceService;
import iuh.fit.backend.billing.service.PaymentQrService;
import iuh.fit.backend.inforclinic.repository.BranchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentQrServiceImpl implements PaymentQrService {

    private final PaymentDraftCache paymentDraftCache;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceService invoiceService;
    private final SimpMessagingTemplate messagingTemplate;
    private final BranchRepository branchRepository;

    @Value("${app.clinic.bank-id:MB}")
    private String bankId;

    @Value("${app.clinic.account-no:038391001}")
    private String accountNo;

    @Value("${app.clinic.account-name:NHA KHOA SMILE CARE}")
    private String accountName;

    @Value("${app.clinic.qr-template:compact2}")
    private String qrTemplate;

    @Override
    @Transactional(readOnly = true)
    public InitiateQrResponse initiateQrPayment(InitiateQrRequest request) {
        if (request == null || request.getInvoiceId() == null) {
            throw new IllegalArgumentException("Hóa đơn không hợp lệ để tạo mã QR thanh toán");
        }

        UUID invoiceId = request.getInvoiceId();
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn với ID: " + invoiceId));

        BigDecimal amount = request.getAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Số tiền thanh toán phải lớn hơn 0");
        }

        BigDecimal serviceAmount = request.getServiceAmount() != null ? request.getServiceAmount() : amount;
        BigDecimal finalAmount = invoice.getFinalAmount() != null ? invoice.getFinalAmount() : BigDecimal.ZERO;
        BigDecimal paidAmount = invoice.getPaidAmount() != null ? invoice.getPaidAmount() : BigDecimal.ZERO;
        if (finalAmount.subtract(paidAmount).subtract(serviceAmount).signum() > 0
                && request.getNextPaymentDate() == null) {
            throw new IllegalArgumentException("Vui lòng chọn ngày thanh toán tiếp theo khi hóa đơn còn nợ");
        }

        String branchId = request.getBranchId();
        if (branchId != null && !branchId.isBlank()) {
            branchId = branchRepository.findById(branchId.trim())
                    .orElseThrow(
                            () -> new IllegalArgumentException("Không tìm thấy chi nhánh: " + request.getBranchId()))
                    .getBranchId();
        } else {
            branchId = null;
        }

        // Xoá bản nháp cũ của hóa đơn này nếu thu ngân đổi ý thay đổi số tiền
        paymentDraftCache.removeByInvoiceId(invoiceId);

        // Tạo mã giao dịch duy nhất dựa trên Mã hóa đơn (VD: THANHTOAN
        // HDINV20261006095258)
        String cleanCode = invoice.getInvoiceCode().replaceAll("[^a-zA-Z0-9]", "");
        String transactionCode = "THANHTOAN HD" + cleanCode;

        // Lưu bản nháp vào RAM Cache mà KHÔNG ghi xuống DB SQL
        PaymentDraft draft = PaymentDraft.builder()
                .branchId(branchId)
                .transactionCode(transactionCode)
                .invoiceId(invoiceId)
                .amount(amount)
                .serviceAmount(request.getServiceAmount() != null ? request.getServiceAmount() : amount)
                .medicineAmount(request.getMedicineAmount() != null ? request.getMedicineAmount() : BigDecimal.ZERO)
                .paymentMethod(
                        request.getPaymentMethod() != null ? request.getPaymentMethod() : PaymentMethod.BANK_TRANSFER)
                .employeeId(request.getEmployeeId())
                .note(request.getNote())
                .nextPaymentDate(request.getNextPaymentDate())
                .build();

        paymentDraftCache.put(transactionCode, draft);

        // Tạo VietQR URL Động theo chuẩn Open API VietQR
        String encodedAddInfo = URLEncoder.encode(transactionCode, StandardCharsets.UTF_8);
        String encodedAccName = URLEncoder.encode(accountName, StandardCharsets.UTF_8);

        String qrUrl = String.format("https://img.vietqr.io/image/%s-%s-%s.png?amount=%s&addInfo=%s&accountName=%s",
                bankId,
                accountNo,
                qrTemplate,
                amount.toPlainString(),
                encodedAddInfo,
                encodedAccName);

        log.info("Khởi tạo mã QR chuyển khoản thành công: invoiceId={}, code={}, qrUrl={}", invoiceId, transactionCode,
                qrUrl);

        return InitiateQrResponse.builder()
                .transactionCode(transactionCode)
                .qrUrl(qrUrl)
                .invoiceId(invoiceId)
                .amount(amount)
                .bankName(bankId)
                .accountNo(accountNo)
                .accountName(accountName)
                .build();
    }

    @Override
    @Transactional
    public void processCassoWebhook(CassoWebhookPayload payload) {
        if (payload == null || payload.getData() == null || payload.getData().isEmpty()) {
            log.warn("Nhận Casso Webhook payload rỗng hoặc không có dữ liệu giao dịch");
            return;
        }

        log.info("Nhận Casso Webhook thông báo chuyển khoản thành công: {} giao dịch", payload.getData().size());

        for (CassoWebhookPayload.CassoTransaction cassotx : payload.getData()) {
            String description = cassotx.getDescription();
            BigDecimal amountPaid = cassotx.getAmount();

            if (description == null || amountPaid == null)
                continue;

            log.info("Xử lý giao dịch Casso Webhook: desc='{}', amount={}đ", description, amountPaid);

            // Tìm nháp trong RAM Cache dựa vào nội dung chuyển khoản
            PaymentDraft matchedDraft = findMatchedDraft(description);

            if (matchedDraft == null) {
                log.warn("Không tìm thấy bản nháp thanh toán trong RAM cho nội dung: '{}'", description);
                continue;
            }

            // Kiểm tra số tiền chuyển có khớp với số tiền cần thanh toán không
            if (amountPaid.compareTo(matchedDraft.getAmount()) < 0) {
                log.error("Số tiền chuyển khoản ({}đ) NHỎ HƠN số tiền yêu cầu trong nháp ({}đ) cho mã '{}'",
                        amountPaid, matchedDraft.getAmount(), matchedDraft.getTransactionCode());
                continue;
            }

            // Gọi InvoiceService để chính thức ghi nhận thanh toán vào DB SQL và gạch nợ
            // hóa đơn
            PaymentRequest paymentRequest = PaymentRequest.builder()
                    .branchId(matchedDraft.getBranchId())
                    .amount(matchedDraft.getAmount())
                    .serviceAmount(matchedDraft.getServiceAmount())
                    .medicineAmount(matchedDraft.getMedicineAmount())
                    .amountReceived(amountPaid)
                    .paymentMethod(matchedDraft.getPaymentMethod())
                    .employeeId(matchedDraft.getEmployeeId())
                    .nextPaymentDate(matchedDraft.getNextPaymentDate())
                    .note((matchedDraft.getNote() != null ? matchedDraft.getNote() + " | " : "") + "Casso TID: "
                            + cassotx.getTid())
                    .build();

            try {
                invoiceService.processPayment(matchedDraft.getInvoiceId(), paymentRequest);
                log.info("Xác nhận thanh toán SQL thành công từ Casso Webhook cho invoiceId={}",
                        matchedDraft.getInvoiceId());

                // Gửi thông báo WebSocket Real-time riêng cho Nhân viên tạo yêu cầu thanh toán
                UUID employeeId = matchedDraft.getEmployeeId();
                var paymentWsPayload = java.util.Map.of(
                        "invoiceId", matchedDraft.getInvoiceId().toString(),
                        "employeeId", employeeId != null ? employeeId.toString() : "",
                        "status", "SUCCESS",
                        "transactionCode", matchedDraft.getTransactionCode(),
                        "amount", matchedDraft.getAmount(),
                        "message", "Thanh toán chuyển khoản qua ngân hàng thành công!");

                if (employeeId != null) {
                    messagingTemplate.convertAndSendToUser(employeeId.toString(), "/queue/payments", paymentWsPayload);
                    messagingTemplate.convertAndSend("/topic/payments/" + employeeId, paymentWsPayload);
                } else {
                    messagingTemplate.convertAndSend("/topic/payments", paymentWsPayload);
                }

                // Đổi trạng thái và xóa bản nháp khỏi RAM
                paymentDraftCache.remove(matchedDraft.getTransactionCode());
            } catch (Exception ex) {
                log.error("Lỗi khi xử lý lưu DB thanh toán cho Casso Webhook: {}", ex.getMessage(), ex);
            }
        }
    }

    @Override
    public void cancelQrDraft(UUID invoiceId) {
        paymentDraftCache.removeByInvoiceId(invoiceId);
        log.info("Đã hủy bản nháp thanh toán QR cho invoiceId={}", invoiceId);
    }

    /**
     * Tìm nháp trong Cache dựa trên chuỗi nội dung chuyển khoản từ ngân hàng
     */
    private PaymentDraft findMatchedDraft(String description) {
        return paymentDraftCache.findByDescription(description).orElse(null);
    }
}

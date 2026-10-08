package iuh.fit.backend.billing.service;

import iuh.fit.backend.billing.dto.CassoWebhookPayload;
import iuh.fit.backend.billing.dto.InitiateQrRequest;
import iuh.fit.backend.billing.dto.InitiateQrResponse;

import java.util.UUID;

public interface PaymentQrService {
    InitiateQrResponse initiateQrPayment(InitiateQrRequest request);
    void processCassoWebhook(CassoWebhookPayload payload);
    void cancelQrDraft(UUID invoiceId);
}

package iuh.fit.backend.billing.service;

import iuh.fit.backend.billing.dto.PaymentTransactionDTO;

import java.util.List;
import java.util.UUID;

public interface PaymentTransactionService {
    List<PaymentTransactionDTO> getPaymentTransactionsByInvoiceId(UUID invoiceId);
}

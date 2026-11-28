package iuh.fit.backend.billing.service;

import iuh.fit.backend.billing.dto.CreateInvoiceRequest;
import iuh.fit.backend.billing.dto.InvoiceListResponse;
import iuh.fit.backend.billing.dto.InvoiceResponse;
import iuh.fit.backend.billing.dto.PaymentRequest;
import iuh.fit.backend.billing.enums.PaymentStatus;

import java.util.UUID;
import java.util.List;

public interface InvoiceService {

    long countOutstandingInvoices();
    InvoiceListResponse getAllInvoiceDateDesc(Integer year, Integer month, PaymentStatus status, String search, String branchId);
    default InvoiceListResponse getAllInvoiceDateDesc(Integer year, Integer month, PaymentStatus status, String search) {
        return getAllInvoiceDateDesc(year, month, status, search, null);
    }
    InvoiceResponse getInvoiceById(UUID id);
    List<InvoiceResponse> getInvoicesByPatientId(UUID patientId);
    InvoiceResponse createInvoice(CreateInvoiceRequest request);
    InvoiceResponse processPayment(UUID id, PaymentRequest request);
    InvoiceResponse cancelInvoice(UUID id, String reason);
}

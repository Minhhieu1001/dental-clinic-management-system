package iuh.fit.backend.billing.service;

import iuh.fit.backend.billing.cache.PaymentDraftCache;
import iuh.fit.backend.billing.dto.InvoiceResponse;
import iuh.fit.backend.billing.dto.PaymentRequest;
import iuh.fit.backend.billing.entity.Invoice;
import iuh.fit.backend.billing.enums.PaymentStatus;
import iuh.fit.backend.billing.repository.InvoiceRepository;
import iuh.fit.backend.billing.repository.PaymentTransactionRepository;
import iuh.fit.backend.billing.service.impl.InvoiceServiceImpl;
import iuh.fit.backend.inforclinic.repository.BranchRepository;
import iuh.fit.backend.patient.repository.PatientRepository;
import iuh.fit.backend.promotion.repository.PromotionRepository;
import iuh.fit.backend.treatment.repository.TreatmentPlanRepository;
import iuh.fit.backend.user.repository.EmployeeRepository;
import iuh.fit.backend.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InvoiceCancellationTest {
    @Mock InvoiceRepository invoiceRepository;
    @Mock PaymentTransactionRepository paymentTransactionRepository;
    @Mock PatientRepository patientRepository;
    @Mock EmployeeRepository employeeRepository;
    @Mock TreatmentPlanRepository treatmentPlanRepository;
    @Mock UserRepository userRepository;
    @Mock PromotionRepository promotionRepository;
    @Mock BranchRepository branchRepository;
    @Mock PaymentDraftCache paymentDraftCache;
    @InjectMocks InvoiceServiceImpl invoiceService;

    @Test
    void cancelPartiallyPaidInvoicePreservesPaidAndRemainingAmounts() {
        UUID id = UUID.randomUUID();
        Invoice invoice = Invoice.builder()
                .id(id)
                .invoiceCode("INV-001")
                .paymentStatus(PaymentStatus.PARTIALLY_PAID)
                .finalAmount(new BigDecimal("1000000"))
                .paidAmount(new BigDecimal("300000"))
                .remainingAmount(new BigDecimal("700000"))
                .build();
        when(invoiceRepository.findByIdForUpdate(id)).thenReturn(Optional.of(invoice));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InvoiceResponse result = invoiceService.cancelInvoice(id, "  Khách dừng điều trị  ");

        assertEquals(PaymentStatus.CANCELLED, result.getPaymentStatus());
        assertEquals("Khách dừng điều trị", result.getCancelReason());
        assertEquals(0, result.getRemainingAmount().compareTo(new BigDecimal("700000")));
        assertEquals(0, result.getPaidAmount().compareTo(new BigDecimal("300000")));
        assertNotNull(result.getCancelledAt());
        verify(paymentDraftCache).removeByInvoiceId(id);
    }

    @Test
    void cancelledInvoiceCannotBePaidAgain() {
        UUID id = UUID.randomUUID();
        Invoice invoice = Invoice.builder().id(id).paymentStatus(PaymentStatus.CANCELLED).build();
        when(invoiceRepository.findByIdForUpdate(id)).thenReturn(Optional.of(invoice));

        assertThrows(IllegalArgumentException.class,
                () -> invoiceService.processPayment(id, new PaymentRequest()));
        verify(paymentTransactionRepository, never()).save(any());
    }

    @Test
    void paidInvoiceCannotBeCancelled() {
        UUID id = UUID.randomUUID();
        Invoice invoice = Invoice.builder().id(id).paymentStatus(PaymentStatus.PAID).build();
        when(invoiceRepository.findByIdForUpdate(id)).thenReturn(Optional.of(invoice));

        assertThrows(IllegalArgumentException.class,
                () -> invoiceService.cancelInvoice(id, "Khách yêu cầu hủy"));
        verify(invoiceRepository, never()).save(any());
    }
}

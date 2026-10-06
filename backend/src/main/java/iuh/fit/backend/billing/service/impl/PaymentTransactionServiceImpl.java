package iuh.fit.backend.billing.service.impl;

import iuh.fit.backend.billing.dto.PaymentTransactionDTO;
import iuh.fit.backend.billing.entity.PaymentTransactions;
import iuh.fit.backend.billing.repository.PaymentTransactionRepository;
import iuh.fit.backend.billing.service.PaymentTransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentTransactionServiceImpl implements PaymentTransactionService {

    private final PaymentTransactionRepository paymentTransactionRepository;

    @Override
    @Transactional(readOnly = true)
    public List<PaymentTransactionDTO> getPaymentTransactionsByInvoiceId(UUID invoiceId) {
        List<PaymentTransactions> transactions = paymentTransactionRepository.findByInvoiceIdWithDetails(invoiceId);
        return transactions.stream().map(tx -> PaymentTransactionDTO.builder()
                .id(tx.getId())
                .invoiceId(tx.getInvoice() != null ? tx.getInvoice().getId() : null)
                .paymentTransactionsName(tx.getPaymentTransactionsName())
                .patientId(tx.getInvoice() != null && tx.getInvoice().getPatient() != null
                        ? tx.getInvoice().getPatient().getId() : null)
                .patientCode(tx.getInvoice() != null && tx.getInvoice().getPatient() != null
                        ? tx.getInvoice().getPatient().getPatientCode() : null)
                .patientName(tx.getInvoice() != null && tx.getInvoice().getPatient() != null
                        ? tx.getInvoice().getPatient().getFullName() : null)
                .patientPhone(tx.getInvoice() != null && tx.getInvoice().getPatient() != null
                        ? tx.getInvoice().getPatient().getPhoneNumber() : null)
                .employeeId(tx.getEmployee() != null ? tx.getEmployee().getId() : null)
                .employeeCode(tx.getEmployee() != null && tx.getEmployee().getUser() != null
                        ? tx.getEmployee().getUser().getUsername() : null)
                .serviceAmount(tx.getServiceAmount())
                .medicineAmount(tx.getMedicineAmount())
                .totalAmount(tx.getTotalAmount())
                .amountReceived(tx.getAmountReceived())
                .changeAmount(tx.getChangeAmount())
                .paymentMethod(tx.getPaymentMethod() != null ? tx.getPaymentMethod().name() : null)
                .transactionCode(tx.getTransactionCode())
                .paymentTime(tx.getPaymentTime())
                .status(tx.getStatus() != null ? tx.getStatus().name() : null)
                .note(tx.getNote())
                .employeeName(tx.getEmployee() != null ? tx.getEmployee().getFullName() : null)
                .prescriptionId(tx.getPrescriptionId())
                .build()
        ).collect(Collectors.toList());
    }
}

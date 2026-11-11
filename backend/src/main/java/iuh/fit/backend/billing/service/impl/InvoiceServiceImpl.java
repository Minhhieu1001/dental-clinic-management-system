package iuh.fit.backend.billing.service.impl;

import iuh.fit.backend.billing.dto.*;
import iuh.fit.backend.billing.entity.Invoice;
import iuh.fit.backend.billing.entity.InvoiceDetail;
import iuh.fit.backend.billing.entity.PaymentTransactions;
import iuh.fit.backend.billing.enums.PaymentMethod;
import iuh.fit.backend.billing.enums.PaymentStatus;
import iuh.fit.backend.billing.enums.TransactionStatus;
import iuh.fit.backend.billing.repository.InvoiceRepository;
import iuh.fit.backend.billing.repository.PaymentTransactionRepository;
import iuh.fit.backend.billing.service.InvoiceService;
import iuh.fit.backend.common.security.CustomUserDetails;
import iuh.fit.backend.inforclinic.entity.Branch;
import iuh.fit.backend.inforclinic.repository.BranchRepository;
import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.patient.repository.PatientRepository;
import iuh.fit.backend.treatment.entity.TreatmentPlan;
import iuh.fit.backend.treatment.repository.TreatmentPlanRepository;
import iuh.fit.backend.promotion.entity.Promotion;
import iuh.fit.backend.promotion.repository.PromotionRepository;
import iuh.fit.backend.user.entity.Employee;
import iuh.fit.backend.user.entity.User;
import iuh.fit.backend.user.repository.EmployeeRepository;
import iuh.fit.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final PatientRepository patientRepository;
    private final EmployeeRepository employeeRepository;
    private final TreatmentPlanRepository treatmentPlanRepository;
    private final UserRepository userRepository;
    private final PromotionRepository promotionRepository;
    private final BranchRepository branchRepository;

    @Override
    @Transactional(readOnly = true)
    public InvoiceListResponse getAllInvoiceDateDesc(Integer year, Integer month, PaymentStatus status, String search) {
        String keyword = search != null ? search.trim() : "";

        List<InvoiceResponse> invoices = invoiceRepository
                .findAllByFilterOrderByInvoiceDateDesc(year, month, status, keyword)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return InvoiceListResponse.builder()
                .invoices(invoices)
                .summary(invoiceRepository.summarizeByYearAndMonth(year, month))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(UUID id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn với ID: " + id));
        return mapToResponse(invoice);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceResponse> getInvoicesByPatientId(UUID patientId) {
        return invoiceRepository.findByPatientIdOrderByInvoiceDateDesc(patientId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public InvoiceResponse createInvoice(CreateInvoiceRequest request) {
        Patient patient = null;
        if (request.getPatientId() != null) {
            patient = patientRepository.findById(request.getPatientId()).orElse(null);
        }

        TreatmentPlan treatmentPlan = null;
        if (request.getTreatmentPlanId() != null) {
            if (invoiceRepository.existsByTreatmentPlanId(request.getTreatmentPlanId())) {
                throw new IllegalArgumentException("Kế hoạch điều trị này đã được lập hóa đơn trước đó!");
            }
            treatmentPlan = treatmentPlanRepository.findById(request.getTreatmentPlanId()).orElse(null);
        }

        Employee employee = resolveCurrentEmployee(request.getEmployeeId());

        Promotion promotion = null;
        if (request.getPromotionId() != null) {
            promotion = promotionRepository.findById(request.getPromotionId()).orElse(null);
        }

        String code = "INV-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));

        BigDecimal calculatedTotal = BigDecimal.ZERO;
        List<InvoiceDetail> details = new ArrayList<>();

        Invoice invoice = Invoice.builder()
                .branch(resolveBranch(request.getBranchId(), employee != null ? employee.getBranch() : null))
                .invoiceCode(code)
                .invoiceDate(LocalDateTime.now())
                .isSave(true)
                .patient(patient)
                .treatmentPlan(treatmentPlan)
                .employee(employee)
                .promotion(promotion)
                .discountAmount(request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO)
                .paidAmount(BigDecimal.ZERO)
                .paymentStatus(PaymentStatus.UNPAID)
                .updateAt(LocalDateTime.now())
                .build();

        if (request.getDetails() != null && !request.getDetails().isEmpty()) {
            for (CreateInvoiceRequest.InvoiceDetailRequest item : request.getDetails()) {
                BigDecimal unitPrice = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
                int qty = item.getQuantity() != null ? item.getQuantity() : 1;
                BigDecimal subtotal = item.getSubtotal() != null
                        ? item.getSubtotal()
                        : unitPrice.multiply(BigDecimal.valueOf(qty));
                calculatedTotal = calculatedTotal.add(subtotal);

                InvoiceDetail detail = InvoiceDetail.builder()
                        .invoice(invoice)
                        .treatmentServiceId(item.getTreatmentServiceId())
                        .itemName(item.getItemName())
                        .quantity(qty)
                        .unitPrice(unitPrice)
                        .subtotal(subtotal)
                        .status(true)
                        .build();

                details.add(detail);
            }
        }

        BigDecimal totalAmount = request.getTotalAmount() != null
                && request.getTotalAmount().compareTo(BigDecimal.ZERO) > 0
                        ? request.getTotalAmount()
                        : calculatedTotal;
        BigDecimal discount = invoice.getDiscountAmount();
        BigDecimal finalAmt = request.getFinalAmount() != null
                ? request.getFinalAmount()
                : totalAmount.subtract(discount).max(BigDecimal.ZERO);

        invoice.setTotalAmount(totalAmount);
        invoice.setFinalAmount(finalAmt);
        invoice.setRemainingAmount(finalAmt);
        invoice.setInvoiceDetails(details);

        Invoice saved = invoiceRepository.save(invoice);

        if (promotion != null) {
            promotion.setUsedCount((promotion.getUsedCount() != null ? promotion.getUsedCount() : 0) + 1);
            promotionRepository.save(promotion);
        }

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public InvoiceResponse processPayment(UUID id, PaymentRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Thông tin thanh toán không được để trống");
        }

        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn với ID: " + id));

        BigDecimal serviceAmount = request.getServiceAmount();
        BigDecimal medicineAmount = request.getMedicineAmount();

        if (serviceAmount == null && medicineAmount == null) {
            serviceAmount = defaultAmount(request.getAmount());
            medicineAmount = BigDecimal.ZERO;
        } else {
            serviceAmount = defaultAmount(serviceAmount);
            medicineAmount = defaultAmount(medicineAmount);
        }

        BigDecimal payAmount = request.getAmount() != null && request.getAmount().compareTo(BigDecimal.ZERO) > 0
                ? request.getAmount()
                : serviceAmount.add(medicineAmount);

        if (payAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Số tiền thanh toán phải lớn hơn 0");
        }

        BigDecimal finalAmount = defaultAmount(invoice.getFinalAmount());
        BigDecimal currentPaid = defaultAmount(invoice.getPaidAmount());
        BigDecimal remainingBeforePayment = finalAmount.subtract(currentPaid).max(BigDecimal.ZERO);

        if (serviceAmount.compareTo(remainingBeforePayment) > 0) {
            throw new IllegalArgumentException("Số tiền thanh toán nợ hóa đơn (" + serviceAmount
                    + " đ) không được vượt quá số tiền còn nợ (" + remainingBeforePayment + " đ)");
        }

        BigDecimal amountReceived = request.getAmountReceived() != null
                ? request.getAmountReceived()
                : payAmount;
        if (amountReceived.compareTo(payAmount) < 0) {
            throw new IllegalArgumentException("Số tiền khách đưa không được nhỏ hơn số tiền thanh toán");
        }

        validateNonNegative(serviceAmount, "Tiền dịch vụ");
        validateNonNegative(medicineAmount, "Tiền thuốc");

        Employee employee = resolveCurrentEmployee(request.getEmployeeId());
        if (employee == null && invoice.getEmployee() != null) {
            employee = invoice.getEmployee();
        }

        LocalDateTime paymentTime = LocalDateTime.now();
        Branch branch = resolveBranch(
                request.getBranchId(),
                invoice.getBranch() != null ? invoice.getBranch() : (employee != null ? employee.getBranch() : null)
        );

        PaymentTransactions tx = PaymentTransactions.builder()
                .branch(branch)
                .invoice(invoice)
                .employee(employee)
                .paymentTransactionsName("Thanh toán hóa đơn " + invoice.getInvoiceCode())
                .serviceAmount(serviceAmount)
                .medicineAmount(medicineAmount)
                .totalAmount(payAmount)
                .amountReceived(amountReceived)
                .changeAmount(amountReceived.subtract(payAmount))
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : PaymentMethod.CASH)
                .transactionCode("GD" + System.currentTimeMillis() + String.format("%04d", new Random().nextInt(10000)))
                .paymentTime(paymentTime)
                .status(TransactionStatus.SUCCESS)
                .note(request.getNote())
                .prescriptionId("")
                .build();

        invoice.getPaymentTransactions().add(tx);
        paymentTransactionRepository.save(tx);

        BigDecimal newPaid = currentPaid.add(serviceAmount);
        BigDecimal newRemaining = finalAmount.subtract(newPaid).max(BigDecimal.ZERO);

        invoice.setPaidAmount(newPaid);
        invoice.setRemainingAmount(newRemaining);
        invoice.setUpdateAt(paymentTime);

        invoice.setPaymentStatus(newRemaining.signum() == 0
                ? PaymentStatus.PAID
                : PaymentStatus.PARTIALLY_PAID);

        Invoice updated = invoiceRepository.save(invoice);
        return mapToResponse(updated);
    }

    private Employee resolveCurrentEmployee(UUID requestedEmployeeId) {
        if (requestedEmployeeId != null) {
            return employeeRepository.findById(requestedEmployeeId).orElse(null);
        }
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !auth.getName().equalsIgnoreCase("anonymousUser")) {
                User currentUser = null;
                if (auth.getPrincipal() instanceof CustomUserDetails cud) {
                    currentUser = cud.getUser();
                } else {
                    String principal = auth.getName();
                    currentUser = userRepository.findByEmail(principal)
                            .or(() -> userRepository.findByUsername(principal))
                            .orElse(null);
                }
                if (currentUser != null) {
                    return employeeRepository.findByUserId(currentUser.getId()).orElse(null);
                }
            }
        } catch (Exception ex) {
            log.warn("Không thể xác định nhân viên từ session đăng nhập: {}", ex.getMessage());
        }
        return null;
    }

    private Branch resolveBranch(String branchId, Branch fallback) {
        if (branchId == null || branchId.isBlank()) {
            return fallback;
        }
        return branchRepository.findById(branchId.trim())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chi nhánh: " + branchId));
    }

    private BigDecimal defaultAmount(BigDecimal amount) {
        return amount != null ? amount : BigDecimal.ZERO;
    }

    private void validateNonNegative(BigDecimal amount, String fieldName) {
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(fieldName + " không được âm");
        }
    }

    private InvoiceResponse mapToResponse(Invoice inv) {
        List<InvoiceDetailDTO> detailDTOs = new ArrayList<>();
        if (inv.getInvoiceDetails() != null) {
            detailDTOs = inv.getInvoiceDetails().stream().map(d -> InvoiceDetailDTO.builder()
                    .id(d.getId())
                    .treatmentServiceId(d.getTreatmentServiceId())
                    .itemName(d.getItemName())
                    .quantity(d.getQuantity())
                    .unitPrice(d.getUnitPrice())
                    .subtotal(d.getSubtotal())
                    .status(d.getStatus())
                    .build()).collect(Collectors.toList());
        }

        List<PaymentTransactionDTO> txDTOs = new ArrayList<>();
        if (inv.getPaymentTransactions() != null) {
            txDTOs = inv.getPaymentTransactions().stream().map(tx -> PaymentTransactionDTO.builder()
                    .id(tx.getId())
                    .invoiceId(inv.getId())
                    .paymentTransactionsName(tx.getPaymentTransactionsName())
                    .patientId(inv.getPatient() != null ? inv.getPatient().getId() : null)
                    .patientCode(inv.getPatient() != null ? inv.getPatient().getPatientCode() : null)
                    .patientName(inv.getPatient() != null ? inv.getPatient().getFullName() : null)
                    .patientPhone(inv.getPatient() != null ? inv.getPatient().getPhoneNumber() : null)
                    .employeeId(tx.getEmployee() != null ? tx.getEmployee().getId() : null)
                    .employeeCode(tx.getEmployee() != null && tx.getEmployee().getUser() != null
                            ? tx.getEmployee().getUser().getUsername()
                            : null)
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
                    .build()).collect(Collectors.toList());
        }

        String empName = null;
        if (inv.getEmployee() != null) {
            empName = inv.getEmployee().getFullName();
            if (empName == null && inv.getEmployee().getUser() != null) {
                empName = inv.getEmployee().getUser().getUsername();
            }
        }

        return InvoiceResponse.builder()
                .branchId(inv.getBranch() != null ? inv.getBranch().getBranchId() : null)
                .branchName(inv.getBranch() != null ? inv.getBranch().getBranchName() : null)
                .branchAddress(inv.getBranch() != null ? inv.getBranch().getAddress() : null)
                .branchPhone(inv.getBranch() != null ? inv.getBranch().getPhoneNumber() : null)
                .id(inv.getId())
                .invoiceCode(inv.getInvoiceCode())
                .invoiceDate(inv.getInvoiceDate())
                .isSave(Boolean.TRUE.equals(inv.getIsSave()))
                .patientId(inv.getPatient() != null ? inv.getPatient().getId() : null)
                .treatmentPlanId(inv.getTreatmentPlan() != null ? inv.getTreatmentPlan().getId() : null)
                .patientName(inv.getPatient() != null ? inv.getPatient().getFullName() : null)
                .patientPhone(inv.getPatient() != null ? inv.getPatient().getPhoneNumber() : null)
                .patientCccd(inv.getPatient() != null ? inv.getPatient().getCccd() : null)
                .patientCode(inv.getPatient() != null ? inv.getPatient().getPatientCode() : null)
                .employeeId(inv.getEmployee() != null ? inv.getEmployee().getId() : null)
                .employeeName(empName)
                .promotionId(inv.getPromotion() != null ? inv.getPromotion().getId() : null)
                .couponCode(inv.getPromotion() != null ? inv.getPromotion().getCouponCode() : null)
                .promotionTitle(inv.getPromotion() != null ? inv.getPromotion().getTitle() : null)
                .totalAmount(inv.getTotalAmount())
                .discountAmount(inv.getDiscountAmount())
                .finalAmount(inv.getFinalAmount())
                .paidAmount(inv.getPaidAmount())
                .remainingAmount(inv.getRemainingAmount())
                .paymentStatus(inv.getPaymentStatus())
                .updateAt(inv.getUpdateAt())
                .invoiceDetails(detailDTOs)
                .paymentTransactions(txDTOs)
                .build();
    }
}

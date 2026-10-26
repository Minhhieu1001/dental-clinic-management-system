package iuh.fit.backend.shift.service.impl;

import iuh.fit.backend.billing.entity.Invoice;
import iuh.fit.backend.billing.entity.PaymentTransactions;
import iuh.fit.backend.billing.enums.PaymentMethod;
import iuh.fit.backend.billing.enums.TransactionStatus;
import iuh.fit.backend.billing.repository.PaymentTransactionRepository;
import iuh.fit.backend.inforclinic.entity.Branch;
import iuh.fit.backend.inforclinic.repository.BranchRepository;
import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.shift.dto.ShiftCalculationResponse;
import iuh.fit.backend.shift.dto.ShiftClosingRequest;
import iuh.fit.backend.shift.dto.ShiftClosingResponse;
import iuh.fit.backend.shift.dto.ShiftTransactionItemDTO;
import iuh.fit.backend.shift.entity.ShiftClosing;
import iuh.fit.backend.shift.enums.ShiftClosingStatus;
import iuh.fit.backend.shift.enums.ShiftType;
import iuh.fit.backend.shift.repository.ShiftClosingRepository;
import iuh.fit.backend.shift.service.ShiftClosingService;
import iuh.fit.backend.user.entity.Employee;
import iuh.fit.backend.user.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ShiftClosingServiceImpl implements ShiftClosingService {

    private final ShiftClosingRepository shiftClosingRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final EmployeeRepository employeeRepository;
    private final BranchRepository branchRepository;

    @Override
    @Transactional(readOnly = true)
    public ShiftCalculationResponse calculateShiftSettlement(
            UUID employeeId,
            ShiftType shiftType,
            LocalDateTime startTime,
            LocalDateTime endTime,
            BigDecimal initialCash
    ) {
        if (shiftType == null) {
            shiftType = ShiftType.MORNING;
        }

        LocalDate today = LocalDate.now();
        if (startTime == null || endTime == null) {
            switch (shiftType) {
                case MORNING -> {
                    startTime = LocalDateTime.of(today, LocalTime.of(7, 0));
                    endTime = LocalDateTime.of(today, LocalTime.of(12, 30));
                }
                case AFTERNOON -> {
                    startTime = LocalDateTime.of(today, LocalTime.of(12, 0));
                    endTime = LocalDateTime.of(today, LocalTime.of(18, 0));
                }
                case EVENING -> {
                    startTime = LocalDateTime.of(today, LocalTime.of(17, 30));
                    endTime = LocalDateTime.of(today, LocalTime.of(22, 0));
                }
                case FULL_DAY -> {
                    startTime = LocalDateTime.of(today, LocalTime.MIN);
                    endTime = LocalDateTime.of(today, LocalTime.MAX);
                }
                default -> {
                    startTime = LocalDateTime.of(today, LocalTime.MIN);
                    endTime = LocalDateTime.now();
                }
            }
        }

        BigDecimal initCash = initialCash != null ? initialCash : BigDecimal.ZERO;

        Employee employee = null;
        if (employeeId != null) {
            employee = employeeRepository.findById(employeeId).orElse(null);
        }

        // Truy vấn các giao dịch trong khoảng thời gian
        List<PaymentTransactions> transactions = paymentTransactionRepository.findTransactionsForShift(
                startTime,
                endTime,
                employeeId
        );

        // Nếu lọc theo employeeId cụ thể không có giao dịch, lấy tất cả giao dịch trong khung giờ ca đó để đối soát
        if (transactions.isEmpty() && employeeId != null) {
            transactions = paymentTransactionRepository.findTransactionsForShift(
                    startTime,
                    endTime,
                    null
            );
        }

        BigDecimal cashRevenue = BigDecimal.ZERO;
        BigDecimal bankTransferRevenue = BigDecimal.ZERO;
        BigDecimal cardRevenue = BigDecimal.ZERO;
        BigDecimal eWalletRevenue = BigDecimal.ZERO;

        List<ShiftTransactionItemDTO> itemDTOList = new ArrayList<>();

        for (PaymentTransactions pt : transactions) {
            boolean isSuccess = pt.getStatus() == null || pt.getStatus() == TransactionStatus.SUCCESS;
            BigDecimal amount = pt.getTotalAmount() != null ? pt.getTotalAmount() : BigDecimal.ZERO;

            if (isSuccess) {
                PaymentMethod method = pt.getPaymentMethod();
                if (method == PaymentMethod.CASH) {
                    cashRevenue = cashRevenue.add(amount);
                } else if (method == PaymentMethod.BANK_TRANSFER) {
                    bankTransferRevenue = bankTransferRevenue.add(amount);
                } else if (method == PaymentMethod.CREDIT_CARD) {
                    cardRevenue = cardRevenue.add(amount);
                } else if (method == PaymentMethod.VNPAY || method == PaymentMethod.MOMO) {
                    eWalletRevenue = eWalletRevenue.add(amount);
                } else {
                    bankTransferRevenue = bankTransferRevenue.add(amount);
                }
            }

            Invoice invoice = pt.getInvoice();
            Patient patient = invoice != null ? invoice.getPatient() : null;

            itemDTOList.add(ShiftTransactionItemDTO.builder()
                    .id(pt.getId())
                    .transactionCode(pt.getTransactionCode() != null ? pt.getTransactionCode() : (pt.getId() != null ? pt.getId().toString().substring(0, 8).toUpperCase() : ""))
                    .invoiceId(invoice != null ? invoice.getId() : null)
                    .invoiceCode(invoice != null ? invoice.getInvoiceCode() : null)
                    .patientName(patient != null ? patient.getFullName() : (invoice != null && invoice.getPatient() != null ? invoice.getPatient().getFullName() : "Khách lẻ"))
                    .patientPhone(patient != null ? patient.getPhoneNumber() : "")
                    .paymentMethod(pt.getPaymentMethod())
                    .totalAmount(amount)
                    .amountReceived(pt.getAmountReceived())
                    .changeAmount(pt.getChangeAmount())
                    .paymentTime(pt.getPaymentTime())
                    .status(pt.getStatus())
                    .employeeName(pt.getEmployee() != null ? pt.getEmployee().getFullName() : "")
                    .build());
        }

        BigDecimal totalSystemRevenue = cashRevenue
                .add(bankTransferRevenue)
                .add(cardRevenue)
                .add(eWalletRevenue);

        BigDecimal totalCashExpected = initCash.add(cashRevenue);

        String branchId = null;
        String branchName = null;
        if (employee != null && employee.getBranch() != null) {
            branchId = employee.getBranch().getBranchId();
            branchName = employee.getBranch().getBranchName();
        }

        return ShiftCalculationResponse.builder()
                .employeeId(employee != null ? employee.getId() : employeeId)
                .employeeName(employee != null ? employee.getFullName() : "Nhân viên thu ngân")
                .branchId(branchId)
                .branchName(branchName != null ? branchName : "Nha Khoa Crown Dental")
                .shiftType(shiftType)
                .startTime(startTime)
                .endTime(endTime)
                .initialCash(initCash)
                .cashRevenue(cashRevenue)
                .bankTransferRevenue(bankTransferRevenue)
                .cardRevenue(cardRevenue)
                .eWalletRevenue(eWalletRevenue)
                .totalSystemRevenue(totalSystemRevenue)
                .totalCashExpected(totalCashExpected)
                .totalTransactions(itemDTOList.size())
                .transactions(itemDTOList)
                .build();
    }

    @Override
    @Transactional
    public ShiftClosingResponse createShiftClosing(ShiftClosingRequest request) {
        if (request.getEmployeeId() == null) {
            throw new IllegalArgumentException("Employee ID không được để trống khi kết ca");
        }

        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhân viên với ID: " + request.getEmployeeId()));

        Employee handoverEmployee = null;
        if (request.getHandoverEmployeeId() != null) {
            handoverEmployee = employeeRepository.findById(request.getHandoverEmployeeId()).orElse(null);
        }

        Branch branch = null;
        if (request.getBranchId() != null && !request.getBranchId().isBlank()) {
            branch = branchRepository.findById(request.getBranchId()).orElse(null);
        } else if (employee.getBranch() != null) {
            branch = employee.getBranch();
        }

        String shiftCode = generateShiftCode();

        BigDecimal initialCash = request.getInitialCash() != null ? request.getInitialCash() : BigDecimal.ZERO;
        BigDecimal cashRevenue = request.getCashRevenue() != null ? request.getCashRevenue() : BigDecimal.ZERO;
        BigDecimal bankTransferRevenue = request.getBankTransferRevenue() != null ? request.getBankTransferRevenue() : BigDecimal.ZERO;
        BigDecimal cardRevenue = request.getCardRevenue() != null ? request.getCardRevenue() : BigDecimal.ZERO;
        BigDecimal eWalletRevenue = request.getEWalletRevenue() != null ? request.getEWalletRevenue() : BigDecimal.ZERO;
        BigDecimal totalSystemRevenue = request.getTotalSystemRevenue() != null ? request.getTotalSystemRevenue() :
                cashRevenue.add(bankTransferRevenue).add(cardRevenue).add(eWalletRevenue);

        BigDecimal totalCashExpected = request.getTotalCashExpected() != null ? request.getTotalCashExpected() :
                initialCash.add(cashRevenue);
        BigDecimal totalCashActual = request.getTotalCashActual() != null ? request.getTotalCashActual() : totalCashExpected;
        BigDecimal differenceAmount = totalCashActual.subtract(totalCashExpected);

        ShiftClosing shiftClosing = ShiftClosing.builder()
                .shiftCode(shiftCode)
                .employee(employee)
                .handoverEmployee(handoverEmployee)
                .branch(branch)
                .shiftType(request.getShiftType() != null ? request.getShiftType() : ShiftType.MORNING)
                .startTime(request.getStartTime() != null ? request.getStartTime() : LocalDateTime.now().minusHours(4))
                .endTime(request.getEndTime() != null ? request.getEndTime() : LocalDateTime.now())
                .initialCash(initialCash)
                .cashRevenue(cashRevenue)
                .bankTransferRevenue(bankTransferRevenue)
                .cardRevenue(cardRevenue)
                .eWalletRevenue(eWalletRevenue)
                .totalSystemRevenue(totalSystemRevenue)
                .totalCashExpected(totalCashExpected)
                .totalCashActual(totalCashActual)
                .differenceAmount(differenceAmount)
                .differenceReason(request.getDifferenceReason())
                .totalTransactions(request.getTotalTransactions() != null ? request.getTotalTransactions() : 0)
                .status(ShiftClosingStatus.CLOSED)
                .note(request.getNote())
                .denominationsJson(request.getDenominationsJson())
                .build();

        ShiftClosing saved = shiftClosingRepository.save(shiftClosing);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShiftClosingResponse> getShiftClosings(
            UUID employeeId,
            LocalDateTime startDate,
            LocalDateTime endDate
    ) {
        List<ShiftClosing> shifts;
        if (employeeId != null) {
            shifts = shiftClosingRepository.findByEmployeeIdWithDetails(employeeId);
        } else {
            shifts = shiftClosingRepository.findAllWithDetails();
        }

        if (startDate != null) {
            shifts = shifts.stream().filter(s -> !s.getStartTime().isBefore(startDate)).collect(Collectors.toList());
        }
        if (endDate != null) {
            shifts = shifts.stream().filter(s -> !s.getEndTime().isAfter(endDate)).collect(Collectors.toList());
        }
        return shifts.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ShiftClosingResponse getShiftClosingById(UUID id) {
        ShiftClosing shift = shiftClosingRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phiên kết ca với ID: " + id));
        return mapToResponse(shift);
    }

    private String generateShiftCode() {
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomSuffix = String.format("%03d", (int) (Math.random() * 900) + 100);
        return "KC-" + dateStr + "-" + randomSuffix;
    }

    private ShiftClosingResponse mapToResponse(ShiftClosing s) {
        return ShiftClosingResponse.builder()
                .id(s.getId())
                .shiftCode(s.getShiftCode())
                .employeeId(s.getEmployee() != null ? s.getEmployee().getId() : null)
                .employeeName(s.getEmployee() != null ? s.getEmployee().getFullName() : null)
                .handoverEmployeeId(s.getHandoverEmployee() != null ? s.getHandoverEmployee().getId() : null)
                .handoverEmployeeName(s.getHandoverEmployee() != null ? s.getHandoverEmployee().getFullName() : null)
                .branchId(s.getBranch() != null ? s.getBranch().getBranchId() : null)
                .branchName(s.getBranch() != null ? s.getBranch().getBranchName() : null)
                .shiftType(s.getShiftType())
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .initialCash(s.getInitialCash())
                .cashRevenue(s.getCashRevenue())
                .bankTransferRevenue(s.getBankTransferRevenue())
                .cardRevenue(s.getCardRevenue())
                .eWalletRevenue(s.getEWalletRevenue())
                .totalSystemRevenue(s.getTotalSystemRevenue())
                .totalCashExpected(s.getTotalCashExpected())
                .totalCashActual(s.getTotalCashActual())
                .differenceAmount(s.getDifferenceAmount())
                .differenceReason(s.getDifferenceReason())
                .totalTransactions(s.getTotalTransactions())
                .status(s.getStatus())
                .note(s.getNote())
                .denominationsJson(s.getDenominationsJson())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<iuh.fit.backend.shift.dto.HandoverEmployeeDTO> getHandoverEmployees() {
        List<Employee> allEmployees = employeeRepository.findAll();
        return allEmployees.stream().map(e -> {
            String fullName = e.getFullName() != null && !e.getFullName().isBlank()
                    ? e.getFullName()
                    : (e.getUser() != null ? e.getUser().getUsername() : "Nhân viên");

            String posLabel = "Nhân viên phòng khám";
            if (e.getPosition() != null) {
                switch (e.getPosition()) {
                    case RECEPTIONIST -> posLabel = "Nhân viên Lễ tân / Thu ngân";
                    case WAREHOUSE -> posLabel = "Nhân viên Quản lý kho";
                }
            }

            String branchName = e.getBranch() != null ? e.getBranch().getBranchName() : "Toàn hệ thống";
            String username = e.getUser() != null ? e.getUser().getUsername() : "";

            return iuh.fit.backend.shift.dto.HandoverEmployeeDTO.builder()
                    .id(e.getId())
                    .fullName(fullName)
                    .position(e.getPosition())
                    .positionLabel(posLabel)
                    .branchName(branchName)
                    .username(username)
                    .build();
        }).collect(Collectors.toList());
    }
}

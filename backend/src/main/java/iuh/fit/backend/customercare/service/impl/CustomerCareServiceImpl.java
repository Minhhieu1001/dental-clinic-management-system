package iuh.fit.backend.customercare.service.impl;

import iuh.fit.backend.appointment.entity.FollowUpAppointment;
import iuh.fit.backend.appointment.repository.FollowUpAppointmentRepository;
import iuh.fit.backend.billing.entity.Invoice;
import iuh.fit.backend.billing.enums.PaymentStatus;
import iuh.fit.backend.billing.repository.InvoiceRepository;
import iuh.fit.backend.billing.service.InvoiceService;
import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.exception.ErrorCode;
import iuh.fit.backend.customercare.dto.CustomerCareResponse;
import iuh.fit.backend.customercare.dto.BulkCareMessageDTO;
import iuh.fit.backend.customercare.dto.BulkCareResponse;
import iuh.fit.backend.customercare.enums.ContactChannel;
import iuh.fit.backend.customercare.producer.CustomerCareProducer;
import iuh.fit.backend.promotion.entity.Promotion;
import iuh.fit.backend.promotion.repository.PromotionRepository;
import iuh.fit.backend.user.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import java.time.format.DateTimeFormatter;
import iuh.fit.backend.customercare.dto.CustomerCareRequest;
import iuh.fit.backend.customercare.entity.CareStrategy;
import iuh.fit.backend.user.repository.EmployeeRepository;
import iuh.fit.backend.customercare.dto.CustomerCareSuggestionResponse;
import iuh.fit.backend.customercare.dto.CustomerCareSummaryResponse;
import iuh.fit.backend.customercare.enums.CareSuggestionType;
import iuh.fit.backend.customercare.repository.CareStrategyRepository;
import iuh.fit.backend.customercare.service.CustomerCareService;
import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.patient.repository.PatientRepository;
import iuh.fit.backend.patient.service.PatientService;
import iuh.fit.backend.promotion.service.PromotionService;
import iuh.fit.backend.treatment.entity.TreatmentPhase;
import iuh.fit.backend.treatment.entity.TreatmentPlan;
import iuh.fit.backend.treatment.enums.StatusPhase;
import iuh.fit.backend.treatment.repository.TreatmentPlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerCareServiceImpl implements CustomerCareService {
    private final InvoiceService invoiceService;
    private final PatientService patientService;
    private final PromotionService promotionService;
    private final CareStrategyRepository careStrategyRepository;
    private final PatientRepository patientRepository;
    private final InvoiceRepository invoiceRepository;
    private final FollowUpAppointmentRepository followUpRepository;
    private final TreatmentPlanRepository treatmentPlanRepository;
    private final EmployeeRepository employeeRepository;
    private final PromotionRepository promotionRepository;
    private final UserRepository userRepository;
    private final CustomerCareProducer producer;

    @Override
    @Transactional(readOnly = true)
    public List<CustomerCareResponse> getAll() {
        return careStrategyRepository.findAllWithPatientAndEmployee().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerCareResponse getById(UUID id) {
        return toResponse(findCare(id));
    }

    @Override
    @Transactional
    public CustomerCareResponse create(CustomerCareRequest request) {
        CareStrategy care = new CareStrategy();
        applyRequest(care, request);
        if (care.getContactChannel() != iuh.fit.backend.customercare.enums.ContactChannel.EMAIL) {
            throw new IllegalArgumentException("Hiện chỉ hỗ trợ gửi chăm sóc qua email");
        }
        String email = care.getPatient().getEmail();
        if ((email == null || email.isBlank()) && care.getPatient().getUser() != null) {
            email = care.getPatient().getUser().getEmail();
        }
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Bệnh nhân chưa có email. Vui lòng cập nhật trước khi gửi chăm sóc");
        }
        care.setStatus("QUEUED");
        CareStrategy saved = careStrategyRepository.saveAndFlush(care);
        producer.sendAfterCommit(List.of(saved.getCareTaskId()));

        return toResponse(saved);
    }

    @Override
    @Transactional
    public CustomerCareResponse update(UUID id, CustomerCareRequest request) {
        CareStrategy care = findMutableCare(id);
        String deliveryStatus = care.getStatus();
        if (!care.getPatient().getId().equals(request.patientId())) {
            throw new IllegalArgumentException("Không thể đổi bệnh nhân của bản ghi chăm sóc");
        }
        if (request.contactChannel() != care.getContactChannel()) {
            throw new IllegalArgumentException("Không thể đổi kênh gửi của bản ghi chăm sóc");
        }
        applyRequest(care, request);
        care.setStatus(deliveryStatus);
        return toResponse(careStrategyRepository.saveAndFlush(care));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        careStrategyRepository.delete(findMutableCare(id));
    }

    private CareStrategy findMutableCare(UUID id) {
        CareStrategy care = careStrategyRepository.findForUpdate(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy bản ghi chăm sóc khách hàng"));
        if ("SENDING".equals(care.getStatus()) || "QUEUED".equals(care.getStatus())) {
            throw new IllegalArgumentException("Bản ghi đang chờ gửi hoặc đang gửi email, vui lòng đợi hoàn tất trước khi sửa hoặc xóa");
        }
        return care;
    }

    private CareStrategy findCare(UUID id) {
        return careStrategyRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy bản ghi chăm sóc khách hàng"));
    }

    private void applyRequest(CareStrategy care, CustomerCareRequest request) {
        var patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy bệnh nhân"));
        var employee = employeeRepository.findById(request.employeeId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy nhân viên"));
        care.setPatient(patient);
        care.setEmployee(employee);
        care.setCareCategory(request.careCategory().trim());
        care.setCareContent(request.careContent().trim());
        care.setContactChannel(request.contactChannel());
    }

    private CustomerCareResponse toResponse(CareStrategy care) {
        var patient = care.getPatient();
        var employee = care.getEmployee();
        return new CustomerCareResponse(
                care.getCareTaskId(),
                patient != null ? patient.getId() : null,
                patient != null ? patient.getPatientCode() : null,
                patient != null ? patient.getFullName() : null,
                patient != null ? patient.getPhoneNumber() : null,
                employee != null ? employee.getId() : null,
                employee != null ? employee.getFullName() : null,
                care.getCareCategory(), care.getCareContent(), care.getContactChannel(),
                care.getStatus(), care.getCreateAt());
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerCareSummaryResponse getSummary() {
        return new CustomerCareSummaryResponse(
                invoiceService.countOutstandingInvoices(),
                patientService.countBirthdaysInCurrentMonth(),
                promotionService.countApplicablePromotions());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerCareSuggestionResponse> getSuggestions(Integer month, Integer year, UUID patientId) {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        int selectedMonth = (month == null || month < 1 || month > 12) ? today.getMonthValue() : month;
        int selectedYear = (year == null || year < 1) ? today.getYear() : year;

        if (patientId != null && !patientRepository.existsById(patientId)) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy bệnh nhân");
        }

        YearMonth period = YearMonth.of(selectedYear, selectedMonth);
        LocalDateTime start = period.atDay(1).atStartOfDay();
        LocalDateTime end = period.plusMonths(1).atDay(1).atStartOfDay();
        List<CustomerCareSuggestionResponse> result = new ArrayList<>();

        // 1. Sinh nhật: chúc mừng sinh nhật và tặng voucher, suggestedDate lưu ngày sinh nhật trong tháng
        for (Patient patient : patientRepository.findBirthdayCarePatients(selectedMonth, patientId)) {
            if (patient.getDateOfBirth() == null) continue;
            int day = Math.min(patient.getDateOfBirth().getDayOfMonth(), period.lengthOfMonth());
            LocalDate birthdayThisYear = period.atDay(day);

            result.add(CustomerCareSuggestionResponse.builder()
                    .patientId(patient.getId())
                    .patientCode(patient.getPatientCode())
                    .patientName(patient.getFullName())
                    .phone(patient.getPhoneNumber())
                    .type(CareSuggestionType.BIRTHDAY)
                    .suggestedContent("Chúc mừng sinh nhật và tặng voucher")
                    .suggestedDate(birthdayThisYear)
                    .build());
        }

        // 2. Lịch tái khám: nhắc lịch tái khám + tên lịch tái khám đó, suggestedDate lưu ngày tái khám
        List<FollowUpAppointment> followUps = followUpRepository.findCareFollowUps(start, end, patientId);
        for (FollowUpAppointment f : followUps) {
            Patient patient = f.getExaminationResult().getMedicalRecord().getPatient();
            String reason = f.getReason();
            String content;
            if (reason == null || reason.isBlank()) {
                content = "Nhắc lịch tái khám";
            } else if (reason.trim().toLowerCase().startsWith("tái khám")) {
                content = "Nhắc lịch " + reason.trim();
            } else {
                content = "Nhắc lịch tái khám: " + reason.trim();
            }
            LocalDate suggestedDate = f.getFollowUpDate() != null ? f.getFollowUpDate().toLocalDate() : period.atDay(1);

            result.add(CustomerCareSuggestionResponse.builder()
                    .patientId(patient.getId())
                    .patientCode(patient.getPatientCode())
                    .patientName(patient.getFullName())
                    .phone(patient.getPhoneNumber())
                    .type(CareSuggestionType.FOLLOW_UP)
                    .suggestedContent(content)
                    .suggestedDate(suggestedDate)
                    .build());
        }

        // 3. Nhắc tiến trình điều trị: nếu tháng đó vẫn nằm trong thời gian của kế hoạch điều trị thì hiển thị
        // "Nhắc tiến trình [tên] (tháng [X]) lộ trình ([giai đoạn hoàn thành]/[tổng số giai đoạn])"
        List<TreatmentPlan> activePlans = treatmentPlanRepository.findActivePlansInPeriod(start, end, patientId, StatusPhase.IN_PROGRESS);
        for (TreatmentPlan plan : activePlans) {
            Patient patient = plan.getExaminationResult().getMedicalRecord().getPatient();
            List<TreatmentPhase> phases = plan.getTreatmentPhases() != null ? plan.getTreatmentPhases() : List.of();
            int totalPhases = phases.size();
            long completedPhases = phases.stream().filter(p -> p.getStatus() == StatusPhase.COMPLETED).count();

            String planName = (plan.getPlanName() != null && !plan.getPlanName().isBlank()) ? plan.getPlanName().trim() : "điều trị";
            String content = String.format("Nhắc tiến trình %s (tháng %d) lộ trình (%d/%d)", planName, selectedMonth, completedPhases, totalPhases);

            result.add(CustomerCareSuggestionResponse.builder()
                    .patientId(patient.getId())
                    .patientCode(patient.getPatientCode())
                    .patientName(patient.getFullName())
                    .phone(patient.getPhoneNumber())
                    .type(CareSuggestionType.TREATMENT_PROGRESS)
                    .suggestedContent(content)
                    .suggestedDate(null)
                    .build());
        }

        // 4. Nhắc công nợ theo ngày thanh toán tiếp theo đã hẹn (null nếu chưa hẹn).
        List<Invoice> outstandingInvoices = invoiceRepository.findOutstandingCareInvoices(patientId, PaymentStatus.CANCELLED);
        for (Invoice invoice : outstandingInvoices) {
            if (invoice.getRemainingAmount() != null && invoice.getRemainingAmount().compareTo(BigDecimal.ZERO) > 0) {
                Patient patient = invoice.getPatient();
                String debtStr = formatCurrency(invoice.getRemainingAmount());
                LocalDate suggestedDate = invoice.getNextPaymentDate();

                result.add(CustomerCareSuggestionResponse.builder()
                        .patientId(patient.getId())
                        .patientCode(patient.getPatientCode())
                        .patientName(patient.getFullName())
                        .phone(patient.getPhoneNumber())
                        .type(CareSuggestionType.DEBT)
                        .suggestedContent("Nhắc công nợ (" + debtStr + ")")
                        .suggestedDate(suggestedDate)
                        .build());
            }
        }

        return result.stream()
                .sorted(Comparator.comparing(CustomerCareSuggestionResponse::getSuggestedDate, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(CustomerCareSuggestionResponse::getPatientName, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(CustomerCareSuggestionResponse::getType))
                .toList();
    }

    @Transactional
    public BulkCareResponse createBulkPromotion(BulkCareMessageDTO request) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        var user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản đăng nhập"));
        var employee = employeeRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Tài khoản chưa có hồ sơ nhân viên"));
        var ids = request.patientIds().stream().distinct().sorted().toList();
        var promotion = promotionRepository.findById(request.promotionId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khuyến mãi"));
        if (!promotion.isValid()) throw new IllegalArgumentException("Khuyến mãi không còn áp dụng");
        var recipients = patientRepository.findAllById(ids);
        if (recipients.size() != ids.size()) throw new IllegalArgumentException("Có bệnh nhân không tồn tại");
        var records = new ArrayList<CareStrategy>();
        int queued = 0;
        for (var patient : recipients) {
            var care = new CareStrategy();
            care.setPatient(patient);
            care.setEmployee(employee);
            care.setCareCategory("PROMOTION");
            care.setContactChannel(ContactChannel.EMAIL);
            care.setCareContent(content(patient.getFullName(), promotion));
            String email = patient.getEmail();
            if ((email == null || email.isBlank()) && patient.getUser() != null) email = patient.getUser().getEmail();
            if (email == null || email.isBlank()) {
                care.setStatus("FAILED");
            } else {
                care.setStatus("QUEUED");
                queued++;
            }
            records.add(care);
        }
        careStrategyRepository.saveAllAndFlush(records);
        producer.sendAfterCommit(records.stream().filter(care -> "QUEUED".equals(care.getStatus()))
                .map(CareStrategy::getCareTaskId).toList());
        return new BulkCareResponse(records.size(), queued, records.size() - queued);
    }

    static String content(String name, Promotion p) {
        String discount = p.getDiscountPercent() != null && p.getDiscountPercent().signum() > 0
                ? p.getDiscountPercent().stripTrailingZeros().toPlainString() + "%" : money(p.getDiscountAmount());
        return "Ưu đãi từ Crown Dental\n\nKính gửi Anh/Chị " + text(name) + ",\n\n"
                + "Crown Dental trân trọng giới thiệu chương trình ưu đãi:\n"
                + "Chương trình: " + text(p.getTitle()) + "\nMã ưu đãi: " + text(p.getCouponCode())
                + "\nNội dung: " + text(p.getDescription()) + "\nMức giảm: " + discount
                + "\nGiảm tối đa: " + money(p.getMaxDiscountAmount())
                + "\nGiá trị hóa đơn tối thiểu: " + money(p.getMinOrderAmount())
                + "\nThời gian áp dụng: " + date(p.getStartDate()) + " - " + date(p.getEndDate())
                + "\n\nAnh/Chị vui lòng phản hồi email nếu cần hỗ trợ.\n\nTrân trọng,\nĐội ngũ Crown Dental";
    }
    private static String text(String value) { return value == null ? "" : value; }
    private static String money(java.math.BigDecimal value) {
        return value == null ? "" : java.text.NumberFormat.getNumberInstance(Locale.forLanguageTag("vi-VN")).format(value) + " đ";
    }
    private static String date(LocalDateTime value) {
        return value == null ? "" : value.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null) return "0 đ";
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(new Locale("vi", "VN"));
        symbols.setGroupingSeparator('.');
        DecimalFormat decimalFormat = new DecimalFormat("#,### đ", symbols);
        return decimalFormat.format(amount);
    }
}

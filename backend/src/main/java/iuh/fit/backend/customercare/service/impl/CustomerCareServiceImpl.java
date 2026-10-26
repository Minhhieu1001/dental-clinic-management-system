package iuh.fit.backend.customercare.service.impl;

import iuh.fit.backend.appointment.entity.Appointment;
import iuh.fit.backend.appointment.entity.FollowUpAppointment;
import iuh.fit.backend.appointment.enums.StatusAppointment;
import iuh.fit.backend.appointment.repository.AppointmentRepository;
import iuh.fit.backend.appointment.repository.FollowUpAppointmentRepository;
import iuh.fit.backend.billing.entity.Invoice;
import iuh.fit.backend.billing.entity.InvoiceDetail;
import iuh.fit.backend.billing.enums.PaymentStatus;
import iuh.fit.backend.billing.repository.InvoiceRepository;
import iuh.fit.backend.common.security.CustomUserDetails;
import iuh.fit.backend.customercare.dto.*;
import iuh.fit.backend.customercare.entity.CustomerCareRecord;
import iuh.fit.backend.customercare.enums.CareChannel;
import iuh.fit.backend.customercare.enums.CareStatus;
import iuh.fit.backend.customercare.enums.CareType;
import iuh.fit.backend.customercare.repository.CustomerCareRecordRepository;
import iuh.fit.backend.customercare.service.CustomerCareService;
import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.patient.repository.PatientRepository;
import iuh.fit.backend.treatment.repository.ServiceRepository;
import iuh.fit.backend.user.entity.Dentist;
import iuh.fit.backend.user.entity.Employee;
import iuh.fit.backend.user.entity.User;
import iuh.fit.backend.user.repository.DentistRepository;
import iuh.fit.backend.promotion.entity.Promotion;
import iuh.fit.backend.promotion.enums.PromotionStatus;
import iuh.fit.backend.promotion.enums.PromotionType;
import iuh.fit.backend.promotion.repository.PromotionRepository;
import iuh.fit.backend.user.repository.EmployeeRepository;
import iuh.fit.backend.user.repository.UserRepository;
import iuh.fit.backend.notification.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerCareServiceImpl implements CustomerCareService {

    private final CustomerCareRecordRepository careRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final FollowUpAppointmentRepository followUpAppointmentRepository;
    private final DentistRepository dentistRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final ServiceRepository serviceRepository;
    private final EmailService emailService;
    private final InvoiceRepository invoiceRepository;
    private final PromotionRepository promotionRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_TIME_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy, HH:mm");

    private Employee getCurrentLoggedInEmployee() {
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
            log.warn("Không thể xác định nhân viên đăng nhập từ session: {}", ex.getMessage());
        }
        return null;
    }

    private String getCurrentLoggedInStaffName() {
        Employee emp = getCurrentLoggedInEmployee();
        if (emp != null && emp.getFullName() != null && !emp.getFullName().isBlank()) {
            return emp.getFullName();
        }
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !auth.getName().equalsIgnoreCase("anonymousUser")) {
                if (auth.getPrincipal() instanceof CustomUserDetails cud && cud.getUser() != null) {
                    return cud.getUser().getUsername();
                }
                return auth.getName();
            }
        } catch (Exception ignored) {}
        return "Nhân viên CSKH";
    }

    private String getCurrentStaffName() {
        return getCurrentLoggedInStaffName();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FilterPatientItemDTO> getComprehensiveFilterPatients(
            String customerGroup,
            String customerSource,
            String startDate,
            String endDate,
            String appointmentStartDate,
            String appointmentEndDate,
            String treatmentStartDate,
            String treatmentEndDate,
            String dentistId,
            String treatmentStatus,
            String procedureGroup,
            String procedureName,
            String employeeId,
            String city,
            String district,
            String customerCard,
            Boolean careTreatment,
            String search
    ) {
        List<Patient> patients = patientRepository.findAll();
        List<FilterPatientItemDTO> result = new ArrayList<>();

        for (Patient p : patients) {
            // Filter by search query (Code, Name, Phone, CCCD, Email)
            if (search != null && !search.isBlank()) {
                String q = search.toLowerCase().trim();
                boolean match = (p.getFullName() != null && p.getFullName().toLowerCase().contains(q)) ||
                                (p.getPhoneNumber() != null && p.getPhoneNumber().contains(q)) ||
                                (p.getPatientCode() != null && p.getPatientCode().toLowerCase().contains(q)) ||
                                (p.getCccd() != null && p.getCccd().contains(q)) ||
                                (p.getEmail() != null && p.getEmail().toLowerCase().contains(q));
                if (!match) continue;
            }

            // Filter customerGroup
            if (customerGroup != null && !customerGroup.isBlank() && !"ALL".equalsIgnoreCase(customerGroup) && !"Tất cả".equalsIgnoreCase(customerGroup)) {
                if (p.getCustomerGroup() == null || !p.getCustomerGroup().equalsIgnoreCase(customerGroup.trim())) {
                    continue;
                }
            }

            // Filter customerSource
            if (customerSource != null && !customerSource.isBlank() && !"ALL".equalsIgnoreCase(customerSource) && !"Tất cả".equalsIgnoreCase(customerSource)) {
                if (p.getCustomerSource() == null || !p.getCustomerSource().equalsIgnoreCase(customerSource.trim())) {
                    continue;
                }
            }

            // Filter city & district from address
            if (city != null && !city.isBlank() && !"ALL".equalsIgnoreCase(city) && !"Tất cả".equalsIgnoreCase(city)) {
                if (p.getAddress() == null || !matchesCity(p.getAddress(), city.trim())) continue;
            }
            if (district != null && !district.isBlank() && !"ALL".equalsIgnoreCase(district) && !"Tất cả".equalsIgnoreCase(district)) {
                if (p.getAddress() == null || !matchesDistrict(p.getAddress(), district.trim())) continue;
            }

            // Filter customerCard
            if (customerCard != null && !customerCard.isBlank()) {
                if (p.getCustomerCard() == null || !p.getCustomerCard().toLowerCase().contains(customerCard.toLowerCase().trim())) {
                    continue;
                }
            }

            // Filter create date range
            if (startDate != null && !startDate.isBlank() && p.getCreatedAt() != null) {
                try {
                    LocalDate sDate = LocalDate.parse(startDate.trim());
                    if (p.getCreatedAt().toLocalDate().isBefore(sDate)) continue;
                } catch (Exception ignored) {}
            }
            if (endDate != null && !endDate.isBlank() && p.getCreatedAt() != null) {
                try {
                    LocalDate eDate = LocalDate.parse(endDate.trim());
                    if (p.getCreatedAt().toLocalDate().isAfter(eDate)) continue;
                } catch (Exception ignored) {}
            }

            // Fetch patient's real appointments
            List<Appointment> apts = appointmentRepository.findByPatientId(p.getId());

            // Check dentist filter if specified
            if (dentistId != null && !dentistId.isBlank() && !"ALL".equalsIgnoreCase(dentistId) && !"Tất cả".equalsIgnoreCase(dentistId)) {
                boolean hasDentist = apts.stream().anyMatch(a -> a.getDentist() != null && a.getDentist().getId().toString().equals(dentistId.trim()));
                if (!hasDentist) continue;
            }

            // Check appointment date range if specified
            if (appointmentStartDate != null && !appointmentStartDate.isBlank()) {
                try {
                    LocalDate aStart = LocalDate.parse(appointmentStartDate.trim());
                    boolean hasAfterStart = apts.stream().anyMatch(a -> {
                        LocalDateTime at = a.getAppointmentTime() != null ? a.getAppointmentTime() : a.getAppointmentDate();
                        return at != null && !at.toLocalDate().isBefore(aStart);
                    });
                    if (!hasAfterStart) continue;
                } catch (Exception ignored) {}
            }
            if (appointmentEndDate != null && !appointmentEndDate.isBlank()) {
                try {
                    LocalDate aEnd = LocalDate.parse(appointmentEndDate.trim());
                    boolean hasBeforeEnd = apts.stream().anyMatch(a -> {
                        LocalDateTime at = a.getAppointmentTime() != null ? a.getAppointmentTime() : a.getAppointmentDate();
                        return at != null && !at.toLocalDate().isAfter(aEnd);
                    });
                    if (!hasBeforeEnd) continue;
                } catch (Exception ignored) {}
            }

            // Determine latest appointment details
            String lastDentist = null;
            LocalDateTime lastAptDate = null;
            String calculatedStatus = "Chưa khám";

            if (!apts.isEmpty()) {
                // sort latest first
                apts.sort((a1, a2) -> {
                    LocalDateTime t1 = a1.getAppointmentTime() != null ? a1.getAppointmentTime() : a1.getAppointmentDate();
                    LocalDateTime t2 = a2.getAppointmentTime() != null ? a2.getAppointmentTime() : a2.getAppointmentDate();
                    if (t1 == null) return 1;
                    if (t2 == null) return -1;
                    return t2.compareTo(t1);
                });

                Appointment latestApt = apts.get(0);
                lastAptDate = latestApt.getAppointmentTime() != null ? latestApt.getAppointmentTime() : latestApt.getAppointmentDate();
                if (latestApt.getDentist() != null) {
                    lastDentist = latestApt.getDentist().getFullName();
                }

                boolean anyInProgress = apts.stream().anyMatch(a -> a.getStatus() != null &&
                        (a.getStatus().name().equals("IN_PROGRESS") || a.getStatus().name().equals("WAITING") || a.getStatus().name().equals("CALLED")));
                boolean anyUpcoming = apts.stream().anyMatch(a -> a.getStatus() != null &&
                        (a.getStatus().name().equals("CONFIRMED") || a.getStatus().name().equals("PENDING")));

                if (anyInProgress) {
                    calculatedStatus = "Đang điều trị";
                } else if (anyUpcoming) {
                    calculatedStatus = "Đã đặt hẹn";
                } else if (latestApt.getStatus() != null && latestApt.getStatus().name().equals("COMPLETED")) {
                    calculatedStatus = "Đã hoàn thành";
                } else {
                    calculatedStatus = "Đã khám";
                }
            }

            // Filter treatment status if specified
            if (treatmentStatus != null && !treatmentStatus.isBlank() && !"ALL".equalsIgnoreCase(treatmentStatus) && !"Tất cả".equalsIgnoreCase(treatmentStatus)) {
                if (!calculatedStatus.equalsIgnoreCase(treatmentStatus.trim())) continue;
            }

            // Determine procedure name and group
            String lastProc = "Khám răng định kỳ & Tư vấn";
            String lastProcGroup = "Nha khoa tổng quát";
            if (!apts.isEmpty()) {
                Appointment first = apts.get(0);
                if (first.getReason() != null && !first.getReason().isBlank()) {
                    lastProc = first.getReason();
                    lastProcGroup = determineProcedureGroup(lastProc);
                }
            }

            // Filter procedureGroup
            if (procedureGroup != null && !procedureGroup.isBlank() && !"ALL".equalsIgnoreCase(procedureGroup) && !"Tất cả".equalsIgnoreCase(procedureGroup)) {
                String pg = procedureGroup.toLowerCase().trim();
                boolean matchGroup = apts.stream().anyMatch(a -> {
                    String reason = (a.getReason() != null ? a.getReason() : "") + " " + (a.getAttribute() != null ? a.getAttribute() : "");
                    return matchesProcedureGroup(reason.toLowerCase(), pg);
                });
                if (!matchGroup) continue;
            }

            // Filter procedureName
            if (procedureName != null && !procedureName.isBlank() && !"ALL".equalsIgnoreCase(procedureName) && !"Tất cả".equalsIgnoreCase(procedureName)) {
                String pn = procedureName.toLowerCase().trim();
                boolean matchProc = apts.stream().anyMatch(a -> {
                    String reason = (a.getReason() != null ? a.getReason() : "").toLowerCase();
                    return reason.contains(pn) || pn.contains(reason);
                });
                if (!matchProc) continue;
            }

            // Filter careTreatment checkbox
            if (Boolean.TRUE.equals(careTreatment)) {
                boolean isCareUnderTreatment = "Đang điều trị".equalsIgnoreCase(calculatedStatus) ||
                                               "Đã đặt hẹn".equalsIgnoreCase(calculatedStatus) ||
                                               !apts.isEmpty();
                if (!isCareUnderTreatment) continue;
            }

            // Gender string
            String genderStr = "Khác";
            if (p.getGender() != null) {
                if ("MALE".equalsIgnoreCase(p.getGender().name())) genderStr = "Nam";
                else if ("FEMALE".equalsIgnoreCase(p.getGender().name())) genderStr = "Nữ";
            }

            Integer birthYear = p.getDateOfBirth() != null ? p.getDateOfBirth().getYear() : null;
            String dobFormatted = p.getDateOfBirth() != null ? p.getDateOfBirth().format(DATE_FMT) : "";

            // Care record count
            List<CustomerCareRecord> cares = careRepository.findByPatientIdOrderByCareTimeDesc(p.getId());

            result.add(FilterPatientItemDTO.builder()
                    .patientId(p.getId())
                    .patientCode(p.getPatientCode() != null ? p.getPatientCode() : "")
                    .fullName(p.getFullName() != null ? p.getFullName() : "")
                    .gender(genderStr)
                    .birthYear(birthYear)
                    .dateOfBirth(dobFormatted)
                    .phoneNumber(p.getPhoneNumber() != null ? p.getPhoneNumber() : "")
                    .email(p.getEmail() != null ? p.getEmail() : "")
                    .cccd(p.getCccd() != null ? p.getCccd() : "")
                    .customerGroup(p.getCustomerGroup() != null ? p.getCustomerGroup() : "Khách thường")
                    .customerSource(p.getCustomerSource() != null ? p.getCustomerSource() : "Trực tiếp")
                    .customerCard(p.getCustomerCard() != null ? p.getCustomerCard() : "STD-MEMBER")
                    .createdAt(p.getCreatedAt())
                    .address(p.getAddress() != null ? p.getAddress() : "")
                    .city(extractCityFromAddress(p.getAddress()))
                    .district(extractDistrictFromAddress(p.getAddress()))
                    .notes(p.getNotes() != null ? p.getNotes() : "")
                    .lastDentist(lastDentist != null ? lastDentist : "Chưa chỉ định")
                    .lastAppointmentDate(lastAptDate)
                    .treatmentStatus(calculatedStatus)
                    .procedureName(lastProc)
                    .procedureGroup(lastProcGroup)
                    .totalAppointments((long) apts.size())
                    .totalCareRecords((long) cares.size())
                    .build());
        }

        // Sort newly created patients first
        result.sort((a, b) -> {
            if (a.getCreatedAt() == null) return 1;
            if (b.getCreatedAt() == null) return -1;
            return b.getCreatedAt().compareTo(a.getCreatedAt());
        });

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentCareItemDTO> getAppointmentCareList(
            String search,
            String startDate,
            String endDate,
            String careStatus,
            String scheduleStatus,
            String dentistId,
            String employeeId
    ) {
        List<Appointment> appointments = appointmentRepository.findAll();
        List<AppointmentCareItemDTO> result = new ArrayList<>();

        for (Appointment apt : appointments) {
            String patientName = apt.getPatientName();
            String patientCode = "";
            String phone = apt.getPhone();
            UUID patientId = null;

            if (apt.getPatient() != null) {
                Patient p = apt.getPatient();
                patientId = p.getId();
                patientName = (p.getFullName() != null && !p.getFullName().isBlank()) ? p.getFullName() : apt.getPatientName();
                phone = (p.getPhoneNumber() != null && !p.getPhoneNumber().isBlank()) ? p.getPhoneNumber() : apt.getPhone();
                patientCode = p.getPatientCode() != null ? p.getPatientCode() : "";
            } else if (apt.getMedicalRecord() != null && apt.getMedicalRecord().getPatient() != null) {
                Patient p = apt.getMedicalRecord().getPatient();
                patientId = p.getId();
                patientName = (p.getFullName() != null && !p.getFullName().isBlank()) ? p.getFullName() : apt.getPatientName();
                phone = (p.getPhoneNumber() != null && !p.getPhoneNumber().isBlank()) ? p.getPhoneNumber() : apt.getPhone();
                patientCode = p.getPatientCode() != null ? p.getPatientCode() : "";
            }

            // Match dentist name
            String dentistName = "";
            if (apt.getDentist() != null) {
                dentistName = apt.getDentist().getFullName();
                if (dentistName == null || dentistName.isBlank()) {
                    if (apt.getDentist().getUser() != null) {
                        dentistName = apt.getDentist().getUser().getUsername();
                    }
                }
            }

            // Schedule status mapping
            String schedStatus = "Chưa đến";
            if (apt.getStatus() != null) {
                switch (apt.getStatus()) {
                    case COMPLETED:
                        schedStatus = "Đã đến";
                        break;
                    case CANCELLED:
                        schedStatus = "Không đến";
                        break;
                    case WAITING:
                    case CALLED:
                        schedStatus = "Đã đến";
                        break;
                    case IN_PROGRESS:
                        schedStatus = "Đang điều trị";
                        break;
                    case CONFIRMED:
                    case PENDING:
                    default:
                        schedStatus = "Chưa đến";
                        break;
                }
            }

            // Query latest care record
            List<CustomerCareRecord> cares = careRepository.findLatestByAppointmentId(apt.getId());
            String cStatus = "Chưa chăm sóc";
            String cChannel = null;
            LocalDateTime cTime = null;
            String cNotes = null;
            String cOutcome = null;
            LocalDateTime cNextCare = null;
            UUID lastCareId = null;

            if (!cares.isEmpty()) {
                CustomerCareRecord latest = cares.get(0);
                lastCareId = latest.getId();
                if (latest.getStatus() != null) {
                    cStatus = latest.getStatus().getLabel();
                }
                if (latest.getChannel() != null) {
                    cChannel = latest.getChannel().getLabel();
                }
                cTime = latest.getCareTime();
                cNotes = latest.getNotes();
                cOutcome = latest.getOutcome();
                cNextCare = latest.getNextCareDate();
            }

            // Apply filters
            if (search != null && !search.isBlank()) {
                String q = search.toLowerCase().trim();
                boolean match = (patientName != null && patientName.toLowerCase().contains(q)) ||
                                (phone != null && phone.contains(q)) ||
                                (patientCode != null && patientCode.toLowerCase().contains(q));
                if (!match) continue;
            }

            if (careStatus != null && !careStatus.isBlank() && !"ALL".equalsIgnoreCase(careStatus) && !"Tất cả".equalsIgnoreCase(careStatus)) {
                if (!cStatus.equalsIgnoreCase(careStatus.trim()) && !CareStatus.fromString(careStatus).getLabel().equalsIgnoreCase(cStatus)) continue;
            }

            if (scheduleStatus != null && !scheduleStatus.isBlank() && !"ALL".equalsIgnoreCase(scheduleStatus) && !"Tất cả".equalsIgnoreCase(scheduleStatus)) {
                if (!schedStatus.equalsIgnoreCase(scheduleStatus.trim())) continue;
            }

            if (dentistId != null && !dentistId.isBlank() && !"ALL".equalsIgnoreCase(dentistId) && !"Tất cả".equalsIgnoreCase(dentistId)) {
                if (apt.getDentist() == null || !apt.getDentist().getId().toString().equals(dentistId.trim())) {
                    continue;
                }
            }

            LocalDateTime aptDateTime = apt.getAppointmentTime() != null ? apt.getAppointmentTime() : apt.getAppointmentDate();

            if (startDate != null && !startDate.isBlank() && aptDateTime != null) {
                try {
                    LocalDate start = LocalDate.parse(startDate.trim());
                    if (aptDateTime.toLocalDate().isBefore(start)) continue;
                } catch (Exception ignored) {}
            }
            if (endDate != null && !endDate.isBlank() && aptDateTime != null) {
                try {
                    LocalDate end = LocalDate.parse(endDate.trim());
                    if (aptDateTime.toLocalDate().isAfter(end)) continue;
                } catch (Exception ignored) {}
            }

            LocalDate today = LocalDate.now();
            boolean isToday = aptDateTime != null && aptDateTime.toLocalDate().isEqual(today);
            boolean isTomorrow = aptDateTime != null && aptDateTime.toLocalDate().isEqual(today.plusDays(1));
            int daysUntil = aptDateTime != null ? (int) java.time.temporal.ChronoUnit.DAYS.between(today, aptDateTime.toLocalDate()) : 999;

            String custGroup = "Khách mới";
            if (apt.getPatient() != null && apt.getPatient().getCustomerGroup() != null) {
                custGroup = apt.getPatient().getCustomerGroup();
            }

            // If patient is null, attempt to resolve by phone
            if (patientId == null && phone != null && !phone.isBlank()) {
                List<Patient> byPhone = patientRepository.findAll();
                for (Patient pCandidate : byPhone) {
                    if (phone.equals(pCandidate.getPhoneNumber())) {
                        patientId = pCandidate.getId();
                        if (patientCode.isBlank()) patientCode = pCandidate.getPatientCode() != null ? pCandidate.getPatientCode() : "";
                        if ("Khách mới".equals(custGroup) && pCandidate.getCustomerGroup() != null) custGroup = pCandidate.getCustomerGroup();
                        break;
                    }
                }
            }

            String serviceName = (apt.getReason() != null && !apt.getReason().isBlank()) ? apt.getReason() : "Khám răng định kỳ & Tư vấn";

            String aptType = "Đặt trước";
            if (apt.getAttribute() != null && !apt.getAttribute().isBlank()) {
                String raw = apt.getAttribute().trim();
                if (!raw.matches("^[0-9a-fA-F-]{20,}$")) {
                    aptType = raw;
                }
            }

            result.add(AppointmentCareItemDTO.builder()
                    .appointmentId(apt.getId())
                    .patientId(patientId)
                    .patientCode(patientCode)
                    .patientName(patientName)
                    .phone(phone)
                    .appointmentTime(aptDateTime)
                    .dentistName(dentistName)
                    .scheduleStatus(schedStatus)
                    .careStatus(cStatus)
                    .careChannel(cChannel)
                    .careTime(cTime)
                    .careNotes(cNotes)
                    .outcome(cOutcome)
                    .nextCareDate(cNextCare)
                    .reminded1Day(Boolean.TRUE.equals(apt.getReminded1Day()))
                    .reminded1Hour(Boolean.TRUE.equals(apt.getReminded1Hour()))
                    .assignedEmployeeName(apt.getEmployee() != null ? apt.getEmployee().getFullName() : null)
                    .lastCareId(lastCareId)
                    .serviceName(serviceName)
                    .customerGroup(custGroup)
                    .isToday(isToday)
                    .isTomorrow(isTomorrow)
                    .daysUntil(daysUntil)
                    .appointmentType(aptType)
                    .isFollowUp(false)
                    .build());
        }

        // 2. Fetch follow-up appointments (Lịch tái khám)
        List<FollowUpAppointment> followUps = followUpAppointmentRepository.findAll();
        for (FollowUpAppointment f : followUps) {
            Patient p = null;
            if (f.getExaminationResult() != null && f.getExaminationResult().getMedicalRecord() != null) {
                p = f.getExaminationResult().getMedicalRecord().getPatient();
            }

            UUID patientId = p != null ? p.getId() : null;
            String patientCode = p != null && p.getPatientCode() != null ? p.getPatientCode() : "";
            String patientName = p != null && p.getFullName() != null ? p.getFullName() : "—";
            String phone = p != null && p.getPhoneNumber() != null ? p.getPhoneNumber() : "—";

            String dentistName = "";
            if (f.getDentist() != null) {
                dentistName = f.getDentist().getFullName();
                if (dentistName == null || dentistName.isBlank()) {
                    if (f.getDentist().getUser() != null) {
                        dentistName = f.getDentist().getUser().getUsername();
                    }
                }
            }

            LocalDateTime aptDateTime = f.getFollowUpDate();
            if (aptDateTime == null) continue;

            // Schedule status mapping
            String schedStatus = "Chưa đến";
            if (Boolean.FALSE.equals(f.getStatus())) {
                schedStatus = "Không đến";
            } else if (aptDateTime.isBefore(LocalDateTime.now())) {
                schedStatus = "Đã xong";
            } else {
                schedStatus = "Chưa đến";
            }

            // Latest care record for follow-up appointment (MAP ĐÚNG THEO follow_up_appointment_id)
            List<CustomerCareRecord> cares = careRepository.findLatestByFollowUpAppointmentId(f.getId());

            String cStatus = "Chưa chăm sóc";
            String cChannel = null;
            LocalDateTime cTime = null;
            String cNotes = null;
            String cOutcome = null;
            LocalDateTime cNextCare = null;
            UUID lastCareId = null;

            if (!cares.isEmpty()) {
                CustomerCareRecord latest = cares.get(0);
                lastCareId = latest.getId();
                if (latest.getStatus() != null) {
                    cStatus = latest.getStatus().getLabel();
                }
                if (latest.getChannel() != null) {
                    cChannel = latest.getChannel().getLabel();
                }
                cTime = latest.getCareTime();
                cNotes = latest.getNotes();
                cOutcome = latest.getOutcome();
                cNextCare = latest.getNextCareDate();
            }

            // Apply filters
            if (search != null && !search.isBlank()) {
                String q = search.toLowerCase().trim();
                boolean match = (patientName != null && patientName.toLowerCase().contains(q)) ||
                                (phone != null && phone.contains(q)) ||
                                (patientCode != null && patientCode.toLowerCase().contains(q));
                if (!match) continue;
            }

            if (careStatus != null && !careStatus.isBlank() && !"ALL".equalsIgnoreCase(careStatus) && !"Tất cả".equalsIgnoreCase(careStatus)) {
                if (!cStatus.equalsIgnoreCase(careStatus.trim()) && !CareStatus.fromString(careStatus).getLabel().equalsIgnoreCase(cStatus)) continue;
            }

            if (scheduleStatus != null && !scheduleStatus.isBlank() && !"ALL".equalsIgnoreCase(scheduleStatus) && !"Tất cả".equalsIgnoreCase(scheduleStatus)) {
                if (!schedStatus.equalsIgnoreCase(scheduleStatus.trim())) continue;
            }

            if (dentistId != null && !dentistId.isBlank() && !"ALL".equalsIgnoreCase(dentistId) && !"Tất cả".equalsIgnoreCase(dentistId)) {
                if (f.getDentist() == null || !f.getDentist().getId().toString().equals(dentistId.trim())) {
                    continue;
                }
            }

            if (startDate != null && !startDate.isBlank()) {
                try {
                    LocalDate start = LocalDate.parse(startDate.trim());
                    if (aptDateTime.toLocalDate().isBefore(start)) continue;
                } catch (Exception ignored) {}
            }
            if (endDate != null && !endDate.isBlank()) {
                try {
                    LocalDate end = LocalDate.parse(endDate.trim());
                    if (aptDateTime.toLocalDate().isAfter(end)) continue;
                } catch (Exception ignored) {}
            }

            LocalDate today = LocalDate.now();
            boolean isToday = aptDateTime.toLocalDate().isEqual(today);
            boolean isTomorrow = aptDateTime.toLocalDate().isEqual(today.plusDays(1));
            int daysUntil = (int) java.time.temporal.ChronoUnit.DAYS.between(today, aptDateTime.toLocalDate());

            String custGroup = (p != null && p.getCustomerGroup() != null && !p.getCustomerGroup().isBlank())
                    ? p.getCustomerGroup() : "Khách mới";

            String serviceName = (f.getReason() != null && !f.getReason().isBlank())
                    ? f.getReason() : "Tái khám theo hẹn";

            result.add(AppointmentCareItemDTO.builder()
                    .appointmentId(f.getId())
                    .patientId(patientId)
                    .patientCode(patientCode)
                    .patientName(patientName)
                    .phone(phone)
                    .appointmentTime(aptDateTime)
                    .dentistName(dentistName)
                    .scheduleStatus(schedStatus)
                    .careStatus(cStatus)
                    .careChannel(cChannel)
                    .careTime(cTime)
                    .careNotes(cNotes)
                    .outcome(cOutcome)
                    .nextCareDate(cNextCare)
                    .reminded1Day(Boolean.TRUE.equals(f.getReminded1Day()))
                    .reminded1Hour(Boolean.TRUE.equals(f.getReminded1Hour()))
                    .assignedEmployeeName(null)
                    .lastCareId(lastCareId)
                    .serviceName(serviceName)
                    .customerGroup(custGroup)
                    .isToday(isToday)
                    .isTomorrow(isTomorrow)
                    .daysUntil(daysUntil)
                    .appointmentType("Tái khám")
                    .isFollowUp(true)
                    .build());
        }

        // Clinical sorting: Upcoming appointments first (today, tomorrow, next days ascending), then past appointments
        LocalDate today = LocalDate.now();
        result.sort((a, b) -> {
            if (a.getAppointmentTime() == null) return 1;
            if (b.getAppointmentTime() == null) return -1;
            boolean aUpcoming = !a.getAppointmentTime().toLocalDate().isBefore(today);
            boolean bUpcoming = !b.getAppointmentTime().toLocalDate().isBefore(today);
            if (aUpcoming && !bUpcoming) return -1;
            if (!aUpcoming && bUpcoming) return 1;
            if (aUpcoming) {
                return a.getAppointmentTime().compareTo(b.getAppointmentTime());
            } else {
                return b.getAppointmentTime().compareTo(a.getAppointmentTime());
            }
        });

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PostTreatmentCareItemDTO> getPostTreatmentCareList(
            String search,
            String startDate,
            String endDate,
            String careStatus,
            String dentistId,
            String employeeId
    ) {
        List<Appointment> completedAppointments = appointmentRepository.findAll().stream()
                .filter(a -> a.getStatus() == StatusAppointment.COMPLETED)
                .toList();
        List<PostTreatmentCareItemDTO> result = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (Appointment apt : completedAppointments) {
            LocalDateTime compTime = apt.getAppointmentTime() != null ? apt.getAppointmentTime() : apt.getAppointmentDate();
            if (compTime == null) continue;

            Patient p = apt.getPatient();
            UUID patientId = p != null ? p.getId() : null;
            String patientCode = p != null && p.getPatientCode() != null ? p.getPatientCode() : "";
            String patientName = p != null && p.getFullName() != null ? p.getFullName() : (apt.getPatientName() != null ? apt.getPatientName() : "—");
            String phone = p != null && p.getPhoneNumber() != null ? p.getPhoneNumber() : (apt.getPhone() != null ? apt.getPhone() : "—");
            String email = p != null && p.getEmail() != null ? p.getEmail() : "";
            String custGroup = p != null && p.getCustomerGroup() != null ? p.getCustomerGroup() : "Khách mới";

            String dentistName = "";
            if (apt.getDentist() != null) {
                dentistName = apt.getDentist().getFullName();
                if (dentistName == null || dentistName.isBlank()) {
                    if (apt.getDentist().getUser() != null) {
                        dentistName = apt.getDentist().getUser().getUsername();
                    }
                }
            }

            // Date filtering on completed time
            if (startDate != null && !startDate.isBlank()) {
                try {
                    LocalDate s = LocalDate.parse(startDate.trim());
                    if (compTime.toLocalDate().isBefore(s)) continue;
                } catch (Exception ignored) {}
            }
            if (endDate != null && !endDate.isBlank()) {
                try {
                    LocalDate e = LocalDate.parse(endDate.trim());
                    if (compTime.toLocalDate().isAfter(e)) continue;
                } catch (Exception ignored) {}
            }

            // Dentist filter
            if (dentistId != null && !dentistId.isBlank() && !"ALL".equalsIgnoreCase(dentistId) && !"Tất cả".equalsIgnoreCase(dentistId)) {
                if (apt.getDentist() == null || !apt.getDentist().getId().toString().equals(dentistId.trim())) {
                    continue;
                }
            }

            // Search filter
            if (search != null && !search.isBlank()) {
                String q = search.toLowerCase().trim();
                boolean match = patientName.toLowerCase().contains(q) ||
                                phone.contains(q) ||
                                patientCode.toLowerCase().contains(q) ||
                                (apt.getReason() != null && apt.getReason().toLowerCase().contains(q));
                if (!match) continue;
            }

            // Care record for post-treatment
            List<CustomerCareRecord> cares = careRepository.findByAppointmentIdOrderByCareTimeDesc(apt.getId()).stream()
                    .filter(c -> c.getCareType() == CareType.POST_TREATMENT)
                    .toList();

            String cStatus = "Chưa chăm sóc";
            String cChannel = null;
            LocalDateTime cTime = null;
            String cNotes = null;
            String cOutcome = null;
            LocalDateTime cNextCare = null;
            String assignedStaff = null;
            UUID lastCareId = null;

            if (!cares.isEmpty()) {
                CustomerCareRecord latest = cares.get(0);
                lastCareId = latest.getId();
                if (latest.getStatus() != null) cStatus = latest.getStatus().getLabel();
                if (latest.getChannel() != null) cChannel = latest.getChannel().getLabel();
                cTime = latest.getCareTime();
                cNotes = latest.getNotes();
                cOutcome = latest.getOutcome();
                cNextCare = latest.getNextCareDate();
                assignedStaff = latest.getCreatedByName();
            }

            if (careStatus != null && !careStatus.isBlank() && !"ALL".equalsIgnoreCase(careStatus) && !"Tất cả".equalsIgnoreCase(careStatus)) {
                if (!cStatus.equalsIgnoreCase(careStatus.trim()) && !CareStatus.fromString(careStatus).getLabel().equalsIgnoreCase(cStatus)) {
                    continue;
                }
            }

            int daysSince = (int) java.time.temporal.ChronoUnit.DAYS.between(compTime.toLocalDate(), today);

            result.add(PostTreatmentCareItemDTO.builder()
                    .appointmentId(apt.getId())
                    .patientId(patientId)
                    .patientCode(patientCode)
                    .patientName(patientName)
                    .phone(phone)
                    .email(email)
                    .completedTime(compTime)
                    .dentistName(dentistName)
                    .serviceName(apt.getReason() != null && !apt.getReason().isBlank() ? apt.getReason() : "Điều trị nha khoa")
                    .customerGroup(custGroup)
                    .careStatus(cStatus)
                    .careChannel(cChannel)
                    .careTime(cTime)
                    .careNotes(cNotes)
                    .outcome(cOutcome)
                    .nextCareDate(cNextCare)
                    .assignedEmployeeName(assignedStaff)
                    .lastCareId(lastCareId)
                    .daysSinceTreatment(daysSince)
                    .build());
        }

        // Sort: Most recently completed treatments first
        result.sort((a, b) -> {
            if (a.getCompletedTime() == null) return 1;
            if (b.getCompletedTime() == null) return -1;
            return b.getCompletedTime().compareTo(a.getCompletedTime());
        });

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BirthdayCareItemDTO> getBirthdayCareList(
            String search,
            String startDate,
            String endDate,
            String careStatus,
            String employeeId
    ) {
        List<Patient> patients = patientRepository.findAll();
        List<BirthdayCareItemDTO> result = new ArrayList<>();

        for (Patient p : patients) {
            if (p.getDateOfBirth() == null) continue;

            LocalDateTime dob = p.getDateOfBirth();
            int day = dob.getDayOfMonth();
            int month = dob.getMonthValue();
            int year = dob.getYear();

            String bdayFormatted = String.format("%02d/%02d", day, month);
            String fullDobFormatted = String.format("%02d/%02d/%04d", day, month, year);

            LocalDate today = LocalDate.now();
            boolean isThisMonth = (month == today.getMonthValue());
            boolean isToday = (month == today.getMonthValue() && day == today.getDayOfMonth());

            LocalDate nextBday = LocalDate.of(today.getYear(), month, day);
            if (nextBday.isBefore(today)) {
                nextBday = nextBday.plusYears(1);
            }
            int daysUntil = (int) java.time.temporal.ChronoUnit.DAYS.between(today, nextBday);

            // Latest birthday care record
            List<CustomerCareRecord> cares = careRepository.findLatestBirthdayCareByPatientId(p.getId());
            String cStatus = "Chưa chăm sóc";
            String cChannel = null;
            LocalDateTime cTime = null;
            String cNotes = null;
            UUID lastCareId = null;

            String assignedEmployeeName = null;

            String cOutcome = null;
            LocalDateTime cNextCare = null;

            if (!cares.isEmpty()) {
                CustomerCareRecord latest = cares.get(0);
                LocalDate careDate = latest.getCareTime() != null ? latest.getCareTime().toLocalDate() : null;
                boolean isCurrentCycle = careDate != null && careDate.getYear() == today.getYear();

                if (isCurrentCycle) {
                    lastCareId = latest.getId();
                    if (latest.getStatus() != null) cStatus = latest.getStatus().getLabel();
                    if (latest.getChannel() != null) cChannel = latest.getChannel().getLabel();
                    cTime = latest.getCareTime();
                    cNotes = latest.getNotes();
                    cOutcome = latest.getOutcome();
                    cNextCare = latest.getNextCareDate();
                    if (latest.getEmployee() != null) {
                        assignedEmployeeName = latest.getEmployee().getFullName();
                    } else if (latest.getCreatedByName() != null) {
                        assignedEmployeeName = latest.getCreatedByName();
                    }
                }
            }

            // Filters
            if (search != null && !search.isBlank()) {
                String q = search.toLowerCase().trim();
                boolean match = (p.getFullName() != null && p.getFullName().toLowerCase().contains(q)) ||
                                (p.getPhoneNumber() != null && p.getPhoneNumber().contains(q)) ||
                                (p.getPatientCode() != null && p.getPatientCode().toLowerCase().contains(q));
                if (!match) continue;
            }

            if (careStatus != null && !careStatus.isBlank() && !"ALL".equalsIgnoreCase(careStatus) && !"Tất cả".equalsIgnoreCase(careStatus)) {
                if (!cStatus.equalsIgnoreCase(careStatus.trim()) && !CareStatus.fromString(careStatus).getLabel().equalsIgnoreCase(cStatus)) continue;
            }

            // Date filter for birthday: compare day-of-month and month if startDate/endDate specified
            if (startDate != null && !startDate.isBlank()) {
                try {
                    LocalDate s = LocalDate.parse(startDate.trim());
                    if (month < s.getMonthValue() || (month == s.getMonthValue() && day < s.getDayOfMonth())) {
                        continue;
                    }
                } catch (Exception ignored) {}
            }
            if (endDate != null && !endDate.isBlank()) {
                try {
                    LocalDate e = LocalDate.parse(endDate.trim());
                    if (month > e.getMonthValue() || (month == e.getMonthValue() && day > e.getDayOfMonth())) {
                        continue;
                    }
                } catch (Exception ignored) {}
            }

            int age = today.getYear() - year;
            String custGroup = (p.getCustomerGroup() != null && !p.getCustomerGroup().isBlank()) ? p.getCustomerGroup() : "Khách mới";

            result.add(BirthdayCareItemDTO.builder()
                    .patientId(p.getId())
                    .patientCode(p.getPatientCode() != null ? p.getPatientCode() : "")
                    .patientName(p.getFullName() != null ? p.getFullName() : "")
                    .phone(p.getPhoneNumber() != null ? p.getPhoneNumber() : "")
                    .email(p.getEmail() != null ? p.getEmail() : "")
                    .dateOfBirth(dob)
                    .birthdayFormatted(bdayFormatted)
                    .fullDobFormatted(fullDobFormatted)
                    .birthYear(year)
                    .careStatus(cStatus)
                    .careChannel(cChannel)
                    .careTime(cTime)
                    .careNotes(cNotes)
                    .outcome(cOutcome)
                    .nextCareDate(cNextCare)
                    .assignedEmployeeName(assignedEmployeeName)
                    .lastCareId(lastCareId)
                    .isToday(isToday)
                    .isThisMonth(isThisMonth)
                    .daysUntil(daysUntil)
                    .age(age)
                    .customerGroup(custGroup)
                    .build());
        }

        // Sort by upcoming birthday (daysUntil ascending: today first, then upcoming days)
        result.sort((a, b) -> {
            if (a.getDaysUntil() == null) return 1;
            if (b.getDaysUntil() == null) return -1;
            return Integer.compare(a.getDaysUntil(), b.getDaysUntil());
        });

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentCareItemDTO> getPaymentCareList(
            String search,
            String startDate,
            String endDate,
            String paymentStatus,
            String careStatus,
            String employeeId
    ) {
        List<Invoice> invoices = invoiceRepository.findAll();
        List<PaymentCareItemDTO> result = new ArrayList<>();

        for (Invoice inv : invoices) {
            Patient p = inv.getPatient();
            String patientName = p != null ? p.getFullName() : "";
            String patientCode = p != null ? p.getPatientCode() : "";
            String phone = p != null ? p.getPhoneNumber() : "";
            String email = p != null ? p.getEmail() : "";
            String custGroup = (p != null && p.getCustomerGroup() != null) ? p.getCustomerGroup() : "Khách mới";
            String invCode = (inv.getInvoiceCode() != null && !inv.getInvoiceCode().isBlank()) 
                    ? inv.getInvoiceCode() 
                    : ("HD-" + inv.getId().toString().substring(0, 8).toUpperCase());

            // Search filter
            if (search != null && !search.isBlank()) {
                String q = search.toLowerCase().trim();
                boolean match = (patientName != null && patientName.toLowerCase().contains(q)) ||
                                (phone != null && phone.contains(q)) ||
                                (patientCode != null && patientCode.toLowerCase().contains(q)) ||
                                (invCode != null && invCode.toLowerCase().contains(q));
                if (!match) continue;
            }

            // PaymentStatus filter
            if (paymentStatus != null && !paymentStatus.isBlank() && !"ALL".equalsIgnoreCase(paymentStatus) && !"Tất cả".equalsIgnoreCase(paymentStatus)) {
                if (inv.getPaymentStatus() == null || !inv.getPaymentStatus().name().equalsIgnoreCase(paymentStatus.trim())) {
                    continue;
                }
            }

            // Date filter on invoiceDate
            LocalDateTime invDate = inv.getInvoiceDate() != null ? inv.getInvoiceDate() : inv.getUpdateAt();
            if (startDate != null && !startDate.isBlank() && invDate != null) {
                try {
                    LocalDate start = LocalDate.parse(startDate.trim());
                    if (invDate.toLocalDate().isBefore(start)) continue;
                } catch (Exception ignored) {}
            }
            if (endDate != null && !endDate.isBlank() && invDate != null) {
                try {
                    LocalDate end = LocalDate.parse(endDate.trim());
                    if (invDate.toLocalDate().isAfter(end)) continue;
                } catch (Exception ignored) {}
            }

            // Employee filter if invoice has assigned staff
            if (employeeId != null && !employeeId.isBlank() && !"ALL".equalsIgnoreCase(employeeId) && !"Tất cả".equalsIgnoreCase(employeeId)) {
                boolean matchEmp = (inv.getEmployee() != null && inv.getEmployee().getId().toString().equalsIgnoreCase(employeeId.trim()));
                if (!matchEmp) continue;
            }

            // Financials
            BigDecimal totalAmount = inv.getTotalAmount() != null ? inv.getTotalAmount() : BigDecimal.ZERO;
            BigDecimal discountAmount = inv.getDiscountAmount() != null ? inv.getDiscountAmount() : BigDecimal.ZERO;
            BigDecimal finalAmount = inv.getFinalAmount() != null ? inv.getFinalAmount() : totalAmount.subtract(discountAmount);
            BigDecimal paidAmount = inv.getPaidAmount() != null ? inv.getPaidAmount() : BigDecimal.ZERO;
            BigDecimal remainingAmount = inv.getRemainingAmount() != null ? inv.getRemainingAmount() : finalAmount.subtract(paidAmount);
            if (remainingAmount.compareTo(BigDecimal.ZERO) < 0) remainingAmount = BigDecimal.ZERO;

            // Payment Status Label
            String pStatus = inv.getPaymentStatus() != null ? inv.getPaymentStatus().name() : "UNPAID";
            String pStatusLabel = "Chưa thanh toán";
            if ("PAID".equalsIgnoreCase(pStatus)) {
                pStatusLabel = "Đã thanh toán";
            } else if ("PARTIALLY_PAID".equalsIgnoreCase(pStatus)) {
                pStatusLabel = "Còn nợ";
            } else if ("CANCELLED".equalsIgnoreCase(pStatus)) {
                pStatusLabel = "Đã hủy";
            }

            // Care record for this invoice (chỉ lấy đúng bản ghi của hóa đơn này, không fallback sang hóa đơn khác)
            List<CustomerCareRecord> cares = careRepository.findLatestByInvoiceId(inv.getId());
            CustomerCareRecord latestCare = (cares != null && !cares.isEmpty()) ? cares.get(0) : null;

            String cStatus = "Chưa chăm sóc";
            String cChannel = null;
            LocalDateTime cTime = null;
            String cNotes = null;
            String cOutcome = null;
            LocalDateTime cNextCare = null;
            String staff = null;
            UUID lastCareId = null;

            if (latestCare != null) {
                lastCareId = latestCare.getId();
                cStatus = latestCare.getStatus() != null ? latestCare.getStatus().getLabel() : "Liên hệ thành công";
                cChannel = latestCare.getChannel() != null ? latestCare.getChannel().getLabel() : "Gọi điện";
                cTime = latestCare.getCareTime();
                cNotes = latestCare.getNotes();
                cOutcome = latestCare.getOutcome();
                cNextCare = latestCare.getNextCareDate();
                staff = latestCare.getCreatedByName();
            }

            // Filter careStatus
            if (careStatus != null && !careStatus.isBlank() && !"ALL".equalsIgnoreCase(careStatus) && !"Tất cả".equalsIgnoreCase(careStatus)) {
                if (!cStatus.equalsIgnoreCase(careStatus.trim()) && !CareStatus.fromString(careStatus).getLabel().equalsIgnoreCase(cStatus)) {
                    continue;
                }
            }

            String formattedFinal = formatVnd(finalAmount);
            String formattedPaid = formatVnd(paidAmount);
            String formattedDebt = formatVnd(remainingAmount);

            String suggestedTemplate;
            if ("PAID".equalsIgnoreCase(pStatus)) {
                suggestedTemplate = String.format(
                    "Nha khoa Crown Dental xin chân thành cảm ơn Quý khách %s đã tin tưởng và sử dụng dịch vụ tại phòng khám. Hóa đơn %s với tổng chi phí %s đ đã được thanh toán hoàn tất. Kính chúc Quý khách nhiều sức khỏe và một nụ cười rạng rỡ!",
                    patientName != null && !patientName.isBlank() ? patientName : "Quý khách",
                    invCode,
                    formattedFinal
                );
            } else if ("PARTIALLY_PAID".equalsIgnoreCase(pStatus)) {
                suggestedTemplate = String.format(
                    "Nha khoa Crown Dental xin thông báo tới Quý khách %s: Hóa đơn dịch vụ %s có tổng chi phí %s đ, Quý khách đã thanh toán %s đ và số tiền còn lại cần thanh toán là %s đ. Quý khách vui lòng sắp xếp hoàn tất thanh toán trong đợt tái khám tiếp theo hoặc liên hệ hotline phòng khám để được hỗ trợ. Trân trọng cảm ơn!",
                    patientName != null && !patientName.isBlank() ? patientName : "Quý khách",
                    invCode,
                    formattedFinal,
                    formattedPaid,
                    formattedDebt
                );
            } else {
                suggestedTemplate = String.format(
                    "Nha khoa Crown Dental xin thông báo tới Quý khách %s: Hóa đơn dịch vụ %s với tổng chi phí %s đ hiện chưa được thanh toán. Quý khách vui lòng liên hệ phòng khám hoặc thực hiện thanh toán để hoàn tất thủ tục hồ sơ điều trị. Trân trọng cảm ơn!",
                    patientName != null && !patientName.isBlank() ? patientName : "Quý khách",
                    invCode,
                    formattedFinal
                );
            }

            result.add(PaymentCareItemDTO.builder()
                    .invoiceId(inv.getId())
                    .invoiceCode(invCode)
                    .invoiceDate(invDate)
                    .patientId(p != null ? p.getId() : null)
                    .patientCode(patientCode)
                    .patientName(patientName)
                    .phone(phone)
                    .email(email)
                    .customerGroup(custGroup)
                    .totalAmount(totalAmount)
                    .discountAmount(discountAmount)
                    .finalAmount(finalAmount)
                    .paidAmount(paidAmount)
                    .remainingAmount(remainingAmount)
                    .paymentStatus(pStatus)
                    .paymentStatusLabel(pStatusLabel)
                    .careStatus(cStatus)
                    .careChannel(cChannel)
                    .careTime(cTime)
                    .careNotes(cNotes)
                    .outcome(cOutcome)
                    .nextCareDate(cNextCare)
                    .assignedEmployeeName(staff != null && !staff.isBlank() ? staff : (inv.getEmployee() != null && inv.getEmployee().getFullName() != null ? inv.getEmployee().getFullName() : null))
                    .lastCareId(lastCareId)
                    .suggestedTemplate(suggestedTemplate)
                    .build());
        }

        // Sort by invoiceDate descending
        result.sort((a, b) -> {
            if (a.getInvoiceDate() == null) return 1;
            if (b.getInvoiceDate() == null) return -1;
            return b.getInvoiceDate().compareTo(a.getInvoiceDate());
        });

        return result;
    }

    private String formatVnd(BigDecimal amount) {
        if (amount == null) return "0";
        return String.format("%,d", amount.longValue()).replace(',', '.');
    }

    @Override
    @Transactional(readOnly = true)
    public List<PromotionCareItemDTO> getPromotionCareList(
            String search,
            String promotionId,
            String category,
            String careStatus,
            String customerGroup,
            String employeeId
    ) {
        List<Patient> allPatients = patientRepository.findAll();
        List<Promotion> allPromotions = promotionRepository.findAll().stream()
                .filter(p -> p.getStatus() == PromotionStatus.ACTIVE && p.getCouponCode() != null && !p.getCouponCode().isBlank())
                .toList();

        List<CustomerCareRecord> allCareRecords = careRepository.findAll().stream()
                .filter(c -> c.getCareType() == CareType.PROMOTION || c.getPromotion() != null || (c.getNotes() != null && c.getNotes().contains("voucher")))
                .toList();

        List<Invoice> allInvoices = invoiceRepository.findAll();
        List<Appointment> allAppointments = appointmentRepository.findAll();

        List<PromotionCareItemDTO> rawItems = new ArrayList<>();

        for (int i = 0; i < allPatients.size(); i++) {
            Patient p = allPatients.get(i);

            // Calculate total spent & visit history
            List<Invoice> patientInvoices = allInvoices.stream()
                    .filter(inv -> inv.getPatient() != null && inv.getPatient().getId().equals(p.getId()))
                    .toList();
            BigDecimal totalSpent = patientInvoices.stream()
                    .map(inv -> inv.getPaidAmount() != null ? inv.getPaidAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            // Last visit date
            LocalDateTime lastVisit = patientInvoices.stream()
                    .map(Invoice::getInvoiceDate)
                    .filter(Objects::nonNull)
                    .max(LocalDateTime::compareTo)
                    .orElse(null);

            // Customer group lấy chuẩn theo dữ liệu thật của hồ sơ bệnh nhân
            String grp = (p.getCustomerGroup() != null && !p.getCustomerGroup().isBlank()) ? p.getCustomerGroup() : "Khách mới";

            // Determine preferred / treating doctor from appointments & invoices
            List<Appointment> pAppointments = allAppointments.stream()
                    .filter(a -> a.getPatient() != null && a.getPatient().getId().equals(p.getId()))
                    .toList();
            String preferredDoctor = null;
            if (!pAppointments.isEmpty()) {
                Appointment latestApt = pAppointments.stream()
                        .filter(a -> a.getDentist() != null)
                        .max(Comparator.comparing(a -> a.getAppointmentTime() != null ? a.getAppointmentTime() : a.getAppointmentDate(), Comparator.nullsLast(Comparator.naturalOrder())))
                        .orElse(null);
                if (latestApt != null && latestApt.getDentist() != null && latestApt.getDentist().getFullName() != null) {
                    preferredDoctor = latestApt.getDentist().getFullName();
                }
            }
            if (preferredDoctor == null || preferredDoctor.isBlank()) {
                preferredDoctor = patientInvoices.stream()
                        .filter(inv -> inv.getTreatmentPlan() != null && inv.getTreatmentPlan().getDentist() != null)
                        .map(inv -> inv.getTreatmentPlan().getDentist().getFullName())
                        .findFirst()
                        .orElse(null);
            }
            if (preferredDoctor == null || preferredDoctor.isBlank()) {
                preferredDoctor = "Bác sĩ phụ trách";
            }
            if (!preferredDoctor.startsWith("BS")) {
                preferredDoctor = "BS. " + preferredDoctor;
            }

            List<PromotionCareItemDTO> patientItems = new ArrayList<>();
            Set<UUID> addedPromotionIds = new HashSet<>();

            // 1. NGHIỆP VỤ: VOUCHER ĐÃ ÁP DỤNG TRONG HÓA ĐƠN
            List<Invoice> promoInvoices = patientInvoices.stream()
                    .filter(inv -> inv.getPromotion() != null)
                    .toList();
            for (Invoice inv : promoInvoices) {
                Promotion promo = inv.getPromotion();
                addedPromotionIds.add(promo.getId());

                String promoName = promo.getTitle() != null ? promo.getTitle() : "Chương trình ưu đãi";
                String code = promo.getCouponCode() != null ? promo.getCouponCode() : "VOUCHER";
                String discountStr = (promo.getDiscountPercent() != null && promo.getDiscountPercent().compareTo(BigDecimal.ZERO) > 0)
                        ? promo.getDiscountPercent().stripTrailingZeros().toPlainString() + "%"
                        : (promo.getDiscountAmount() != null ? formatVnd(promo.getDiscountAmount()) + " đ" : "Ưu đãi");

                String fastTpl = String.format("Kính gửi Quý khách %s,\nNha Khoa Quốc Tế Crown Dental cảm ơn Quý khách đã sử dụng mã voucher [%s] giảm %s cho dịch vụ nha khoa. Kính chúc Quý khách luôn có nụ cười rạng rỡ và tự tin!\nHotline hỗ trợ: 0343632524",
                        p.getFullName(), code, discountStr);

                String empName = (inv.getEmployee() != null && inv.getEmployee().getFullName() != null)
                        ? inv.getEmployee().getFullName()
                        : "Thu ngân";

                PromotionCareItemDTO item = PromotionCareItemDTO.builder()
                        .patientId(p.getId())
                        .patientCode(p.getPatientCode() != null ? p.getPatientCode() : "BN-" + p.getId().toString().substring(0, 6))
                        .patientName(p.getFullName())
                        .phone(p.getPhoneNumber())
                        .email(p.getEmail())
                        .customerGroup(grp)
                        .lastVisitDate(lastVisit)
                        .totalSpent(totalSpent)
                        .preferredDoctor(preferredDoctor)
                        .promotionId(promo.getId())
                        .promotionTitle(promoName)
                        .couponCode(code)
                        .category(promo.getCategory() != null ? promo.getCategory() : "Khám & Điều trị")
                        .discountPercent(promo.getDiscountPercent())
                        .discountAmount(promo.getDiscountAmount())
                        .discountType(promo.getPromotionType() == PromotionType.DISCOUNT_PERCENT ? "PERCENTAGE" : "FIXED_AMOUNT")
                        .discountValue(inv.getDiscountAmount() != null && inv.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0 ? inv.getDiscountAmount() : promo.getDiscountAmount())
                        .startDate(promo.getStartDate())
                        .endDate(promo.getEndDate())
                        .promotionStatus(promo.getStatus() != null ? promo.getStatus().name() : "ACTIVE")
                        .careStatus("Đã sử dụng")
                        .careChannel("Tại quầy")
                        .careTime(inv.getInvoiceDate())
                        .lastCareTime(inv.getInvoiceDate())
                        .careNotes(String.format("Đã áp dụng voucher %s cho hóa đơn %s (Giảm: %s đ)", code, inv.getInvoiceCode() != null ? inv.getInvoiceCode() : "", formatVnd(inv.getDiscountAmount())))
                        .outcome("Đã áp dụng vào hóa đơn")
                        .assignedEmployeeName(empName)
                        .lastCareStaff(empName)
                        .suggestedTemplate(fastTpl)
                        .suggestedMessage(fastTpl)
                        .build();

                patientItems.add(item);
            }

            // 2. NGHIỆP VỤ: VOUCHER ĐÃ ĐƯỢC GỬI / CHĂM SÓC TRONG LỊCH SỬ CSKH
            List<CustomerCareRecord> patientCareRecords = allCareRecords.stream()
                    .filter(c -> c.getPatient() != null && c.getPatient().getId().equals(p.getId()))
                    .sorted(Comparator.comparing(CustomerCareRecord::getCareTime, Comparator.nullsLast(Comparator.reverseOrder())))
                    .toList();

            for (CustomerCareRecord c : patientCareRecords) {
                Promotion promo = c.getPromotion();
                if (promo == null && c.getNotes() != null) {
                    for (Promotion pr : allPromotions) {
                        if (pr.getCouponCode() != null && c.getNotes().contains(pr.getCouponCode())) {
                            promo = pr;
                            break;
                        }
                    }
                }
                if (promo == null) continue;

                if (addedPromotionIds.contains(promo.getId())) {
                    continue; // Skip duplicate if already listed via invoice
                }
                addedPromotionIds.add(promo.getId());

                String statusLabel = c.getStatus() != null ? c.getStatus().getLabel() : "Liên hệ thành công";

                String promoName = promo.getTitle() != null ? promo.getTitle() : "Chương trình ưu đãi";
                String code = promo.getCouponCode() != null ? promo.getCouponCode() : "VOUCHER";
                String discountStr = (promo.getDiscountPercent() != null && promo.getDiscountPercent().compareTo(BigDecimal.ZERO) > 0)
                        ? promo.getDiscountPercent().stripTrailingZeros().toPlainString() + "%"
                        : (promo.getDiscountAmount() != null ? formatVnd(promo.getDiscountAmount()) + " đ" : "Ưu đãi");

                String fastTpl = String.format("Kính gửi Quý khách %s,\nNha Khoa Quốc Tế Crown Dental trân trọng gửi tặng Quý khách mã ưu đãi đặc biệt [%s] giảm %s nhân dịp %s. Kính chúc Quý khách luôn có nụ cười rạng rỡ và tự tin!\nHotline đặt lịch: 0343632524",
                        p.getFullName(), code, discountStr, promoName);

                String staff = c.getCreatedByName() != null ? c.getCreatedByName() : (c.getEmployee() != null ? c.getEmployee().getFullName() : null);

                PromotionCareItemDTO item = PromotionCareItemDTO.builder()
                        .patientId(p.getId())
                        .patientCode(p.getPatientCode() != null ? p.getPatientCode() : "BN-" + p.getId().toString().substring(0, 6))
                        .patientName(p.getFullName())
                        .phone(p.getPhoneNumber())
                        .email(p.getEmail())
                        .customerGroup(grp)
                        .lastVisitDate(lastVisit)
                        .totalSpent(totalSpent)
                        .preferredDoctor(preferredDoctor)
                        .promotionId(promo.getId())
                        .promotionTitle(promoName)
                        .couponCode(code)
                        .category(promo.getCategory() != null ? promo.getCategory() : "Sự kiện ngày lễ")
                        .discountPercent(promo.getDiscountPercent())
                        .discountAmount(promo.getDiscountAmount())
                        .discountType(promo.getPromotionType() == PromotionType.DISCOUNT_PERCENT ? "PERCENTAGE" : "FIXED_AMOUNT")
                        .discountValue(promo.getDiscountAmount() != null ? promo.getDiscountAmount() : promo.getDiscountPercent())
                        .startDate(promo.getStartDate())
                        .endDate(promo.getEndDate())
                        .promotionStatus(promo.getStatus() != null ? promo.getStatus().name() : "ACTIVE")
                        .careStatus(statusLabel)
                        .careChannel(c.getChannel() != null ? c.getChannel().getLabel() : "Gmail")
                        .careTime(c.getCareTime())
                        .lastCareTime(c.getCareTime())
                        .careNotes(c.getNotes())
                        .outcome(c.getOutcome())
                        .nextCareDate(c.getNextCareDate())
                        .assignedEmployeeName(staff)
                        .lastCareStaff(staff)
                        .lastCareId(c.getId())
                        .suggestedTemplate(c.getNotes() != null && c.getNotes().length() > 30 ? c.getNotes() : fastTpl)
                        .suggestedMessage(c.getNotes() != null && c.getNotes().length() > 30 ? c.getNotes() : fastTpl)
                        .build();

                patientItems.add(item);
            }

            // 3. NGHIỆP VỤ: ĐƯỢC CHĂM SÓC THEO CHIẾN DỊCH VOUCHER ĐANG CHẠY
            if (promotionId != null && !promotionId.isBlank() && !"ALL".equalsIgnoreCase(promotionId)) {
                try {
                    UUID pUUID = UUID.fromString(promotionId);
                    if (!addedPromotionIds.contains(pUUID)) {
                        Promotion promo = allPromotions.stream().filter(pr -> pr.getId().equals(pUUID)).findFirst().orElse(null);
                        if (promo != null) {
                            patientItems.add(buildUnsentPromoItem(p, promo, grp, lastVisit, totalSpent, preferredDoctor));
                        }
                    }
                } catch (Exception ignored) {}
            } else {
                // Khi xem "Tất cả": nếu bệnh nhân chưa có bất kỳ voucher nào thì gợi ý voucher phù hợp nhất theo phân khúc
                if (patientItems.isEmpty()) {
                    Promotion promo = null;
                    if ("Khách hàng VIP".equals(grp)) {
                        promo = findPromoByCode(allPromotions, "SINHNHAT");
                    } else if ("Nữ".equalsIgnoreCase(p.getGender() != null ? p.getGender().name() : "")) {
                        promo = findPromoByCode(allPromotions, "PHUNU2010");
                    } else if ("Khách hàng Thân thiết".equals(grp)) {
                        promo = findPromoByCode(allPromotions, "TET2026");
                    } else if (i % 2 == 0) {
                        promo = findPromoByCode(allPromotions, "LE304");
                    } else {
                        promo = findPromoByCode(allPromotions, "QUOCKHANH29");
                    }
                    if (promo == null && !allPromotions.isEmpty()) promo = allPromotions.get(0);
                    if (promo != null) {
                        patientItems.add(buildUnsentPromoItem(p, promo, grp, lastVisit, totalSpent, preferredDoctor));
                    }
                }
            }

            rawItems.addAll(patientItems);
        }

        // 4. BỘ LỌC ĐA TIÊU CHÍ (Search, Category, CustomerGroup, CareStatus)
        List<PromotionCareItemDTO> filtered = new ArrayList<>();
        for (PromotionCareItemDTO item : rawItems) {
            if (search != null && !search.isBlank()) {
                String q = search.toLowerCase().trim();
                boolean m = (item.getPatientName() != null && item.getPatientName().toLowerCase().contains(q))
                        || (item.getPatientCode() != null && item.getPatientCode().toLowerCase().contains(q))
                        || (item.getPhone() != null && item.getPhone().contains(q))
                        || (item.getCouponCode() != null && item.getCouponCode().toLowerCase().contains(q))
                        || (item.getPromotionTitle() != null && item.getPromotionTitle().toLowerCase().contains(q))
                        || (item.getCareNotes() != null && item.getCareNotes().toLowerCase().contains(q));
                if (!m) continue;
            }

            if (category != null && !category.isBlank() && !"ALL".equalsIgnoreCase(category)) {
                boolean matchCat = false;
                if ("HOLIDAY".equalsIgnoreCase(category)) {
                    matchCat = List.of("LE304", "QUOCKHANH29", "TET2026").contains(item.getCouponCode())
                            || "Sự kiện ngày lễ".equalsIgnoreCase(item.getCategory())
                            || "Tết Nguyên Đán".equalsIgnoreCase(item.getCategory());
                } else if ("ANNIVERSARY".equalsIgnoreCase(category)) {
                    matchCat = "SINHNHAT".equalsIgnoreCase(item.getCouponCode()) || "Sinh nhật nha khoa".equalsIgnoreCase(item.getCategory());
                } else if ("WOMEN".equalsIgnoreCase(category)) {
                    matchCat = "PHUNU2010".equalsIgnoreCase(item.getCouponCode()) || "Ngày lễ phụ nữ".equalsIgnoreCase(item.getCategory());
                } else if ("STUDENT".equalsIgnoreCase(category)) {
                    matchCat = "SUMMERSMILE".equalsIgnoreCase(item.getCouponCode()) || "Mùa hè & Tựu trường".equalsIgnoreCase(item.getCategory());
                } else {
                    matchCat = category.equalsIgnoreCase(item.getCategory());
                }
                if (!matchCat) continue;
            }

            if (customerGroup != null && !customerGroup.isBlank() && !"ALL".equalsIgnoreCase(customerGroup)) {
                if (!customerGroup.equalsIgnoreCase(item.getCustomerGroup())) continue;
            }

            if (careStatus != null && !careStatus.isBlank() && !"ALL".equalsIgnoreCase(careStatus)) {
                boolean matchStatus = false;
                if ("NOT_SENT".equalsIgnoreCase(careStatus)) {
                    matchStatus = "Chưa gửi ưu đãi".equalsIgnoreCase(item.getCareStatus());
                } else if ("SENT".equalsIgnoreCase(careStatus)) {
                    matchStatus = "Đã gửi ưu đãi".equalsIgnoreCase(item.getCareStatus());
                } else if ("INTERESTED".equalsIgnoreCase(careStatus)) {
                    matchStatus = "Khách quan tâm".equalsIgnoreCase(item.getCareStatus());
                } else if ("BOOKED".equalsIgnoreCase(careStatus)) {
                    matchStatus = "Đã đặt lịch hẹn".equalsIgnoreCase(item.getCareStatus());
                } else if ("USED".equalsIgnoreCase(careStatus)) {
                    matchStatus = item.getCareStatus() != null && item.getCareStatus().contains("Đã sử dụng");
                } else {
                    matchStatus = careStatus.equalsIgnoreCase(item.getCareStatus());
                }
                if (!matchStatus) continue;
            }

            filtered.add(item);
        }

        // Sắp xếp: Ưu tiên bản ghi có lịch sử chăm sóc hoặc sử dụng gần nhất lên đầu
        filtered.sort((a, b) -> {
            if (a.getLastCareTime() != null && b.getLastCareTime() != null) {
                return b.getLastCareTime().compareTo(a.getLastCareTime());
            }
            if (a.getLastCareTime() != null) return -1;
            if (b.getLastCareTime() != null) return 1;
            return a.getPatientName().compareTo(b.getPatientName());
        });

        return filtered;
    }

    private PromotionCareItemDTO buildUnsentPromoItem(
            Patient p, Promotion promo, String grp,
            LocalDateTime lastVisit, BigDecimal totalSpent, String preferredDoctor
    ) {
        String promoName = promo.getTitle() != null ? promo.getTitle() : "Chương trình ưu đãi";
        String code = promo.getCouponCode() != null ? promo.getCouponCode() : "VOUCHER";
        String discountStr = (promo.getDiscountPercent() != null && promo.getDiscountPercent().compareTo(BigDecimal.ZERO) > 0)
                ? promo.getDiscountPercent().stripTrailingZeros().toPlainString() + "%"
                : (promo.getDiscountAmount() != null ? formatVnd(promo.getDiscountAmount()) + " đ" : "Ưu đãi");

        String fastTpl = String.format("Kính gửi Quý khách %s,\nNha Khoa Quốc Tế Crown Dental trân trọng gửi tặng Quý khách mã ưu đãi đặc biệt [%s] giảm %s nhân dịp %s. Kính chúc Quý khách luôn có nụ cười rạng rỡ và tự tin!\nHotline đặt lịch: 0343632524",
                p.getFullName(), code, discountStr, promoName);

        return PromotionCareItemDTO.builder()
                .patientId(p.getId())
                .patientCode(p.getPatientCode() != null ? p.getPatientCode() : "BN-" + p.getId().toString().substring(0, 6))
                .patientName(p.getFullName())
                .phone(p.getPhoneNumber())
                .email(p.getEmail())
                .customerGroup(grp)
                .lastVisitDate(lastVisit)
                .totalSpent(totalSpent)
                .preferredDoctor(preferredDoctor)
                .promotionId(promo.getId())
                .promotionTitle(promoName)
                .couponCode(code)
                .category(promo.getCategory() != null ? promo.getCategory() : "Sự kiện ngày lễ")
                .discountPercent(promo.getDiscountPercent())
                .discountAmount(promo.getDiscountAmount())
                .discountType(promo.getPromotionType() == PromotionType.DISCOUNT_PERCENT ? "PERCENTAGE" : "FIXED_AMOUNT")
                .discountValue(promo.getDiscountAmount() != null ? promo.getDiscountAmount() : promo.getDiscountPercent())
                .startDate(promo.getStartDate())
                .endDate(promo.getEndDate())
                .promotionStatus(promo.getStatus() != null ? promo.getStatus().name() : "ACTIVE")
                .careStatus("Chưa gửi ưu đãi")
                .careChannel(null)
                .careTime(null)
                .lastCareTime(null)
                .careNotes(null)
                .assignedEmployeeName("Nguyệt Nguyễn")
                .lastCareStaff(null)
                .lastCareId(null)
                .suggestedTemplate(fastTpl)
                .suggestedMessage(fastTpl)
                .build();
    }

    @Override
    @Transactional
    public List<PromotionCampaignDTO> getPromotionCampaigns() {
        ensureHolidayPromotionsExist();
        List<Promotion> promotions = promotionRepository.findAll();
        List<CustomerCareRecord> promoRecords = careRepository.findAll().stream()
                .filter(c -> c.getCareType() == CareType.PROMOTION || c.getPromotion() != null)
                .toList();
        List<Invoice> allInvoices = invoiceRepository.findAll();
        List<Patient> allPatients = patientRepository.findAll();

        return promotions.stream()
                .filter(p -> p.getCouponCode() != null && !p.getCouponCode().isBlank())
                .sorted((a, b) -> {
                    List<String> priorityCodes = List.of("LE304", "QUOCKHANH29", "TET2026", "SINHNHAT", "PHUNU2010", "SUMMERSMILE", "SUMMER200K", "DENTAL10");
                    int idxA = priorityCodes.indexOf(a.getCouponCode().toUpperCase());
                    int idxB = priorityCodes.indexOf(b.getCouponCode().toUpperCase());
                    if (idxA != -1 && idxB != -1) return Integer.compare(idxA, idxB);
                    if (idxA != -1) return -1;
                    if (idxB != -1) return 1;
                    if (a.getStatus() == PromotionStatus.ACTIVE && b.getStatus() != PromotionStatus.ACTIVE) return -1;
                    if (a.getStatus() != PromotionStatus.ACTIVE && b.getStatus() == PromotionStatus.ACTIVE) return 1;
                    return b.getCreatedAt() != null && a.getCreatedAt() != null ? b.getCreatedAt().compareTo(a.getCreatedAt()) : 0;
                })
                .map(p -> {
                    long sent = promoRecords.stream()
                            .filter(c -> c.getPromotion() != null && c.getPromotion().getId().equals(p.getId()))
                            .count();
                    long interested = promoRecords.stream()
                            .filter(c -> c.getPromotion() != null && c.getPromotion().getId().equals(p.getId()) && c.getStatus() == CareStatus.COMPLETED)
                            .count();
                    long booked = promoRecords.stream()
                            .filter(c -> c.getPromotion() != null && c.getPromotion().getId().equals(p.getId()) && c.getNotes() != null && (c.getNotes().contains("đặt lịch") || c.getNotes().contains("đặt hẹn")))
                            .count();
                    long usedInInvoices = allInvoices.stream()
                            .filter(inv -> inv.getPromotion() != null && inv.getPromotion().getId().equals(p.getId()))
                            .count();

                    String audience = "Tất cả khách hàng";
                    long targetCount = allPatients.size();

                    if ("SINHNHAT".equalsIgnoreCase(p.getCouponCode())) {
                        audience = "Khách hàng VIP & Thân thiết";
                        targetCount = allPatients.stream().filter(pt -> {
                            String grp = pt.getCustomerGroup() != null ? pt.getCustomerGroup() : "";
                            return grp.contains("VIP") || grp.contains("thân thiết");
                        }).count();
                    } else if ("PHUNU2010".equalsIgnoreCase(p.getCouponCode())) {
                        audience = "Khách hàng Nữ & Gia đình";
                        targetCount = allPatients.stream().filter(pt -> pt.getGender() != null && "FEMALE".equalsIgnoreCase(pt.getGender().name())).count();
                    } else if ("SUMMERSMILE".equalsIgnoreCase(p.getCouponCode())) {
                        audience = "Học sinh, Sinh viên & Niềng răng";
                        targetCount = 12;
                    } else if ("TET2026".equalsIgnoreCase(p.getCouponCode())) {
                        audience = "Khách hàng thân thiết & Toàn nha khoa";
                    } else if ("QUOCKHANH29".equalsIgnoreCase(p.getCouponCode())) {
                        audience = "Khách hàng Chỉnh nha & Implant";
                    } else if ("LE304".equalsIgnoreCase(p.getCouponCode())) {
                        audience = "Khách hàng Răng sứ & Tẩy trắng";
                    } else if ("SUMMER200K".equalsIgnoreCase(p.getCouponCode())) {
                        audience = "Khách hàng Khám & Điều trị tổng quát";
                    }

                    if (targetCount <= 0) targetCount = allPatients.size();

                    return PromotionCampaignDTO.builder()
                            .id(p.getId())
                            .title(p.getTitle())
                            .couponCode(p.getCouponCode())
                            .category(p.getCategory())
                            .description(p.getDescription())
                            .imageUrl(p.getImageUrl())
                            .promotionType(p.getPromotionType() != null ? p.getPromotionType().name() : "DISCOUNT_PERCENT")
                            .discountPercent(p.getDiscountPercent())
                            .discountAmount(p.getDiscountAmount())
                            .maxDiscountAmount(p.getMaxDiscountAmount())
                            .startDate(p.getStartDate())
                            .endDate(p.getEndDate())
                            .usageLimit(p.getUsageLimit())
                            .usedCount(p.getUsedCount() != null ? p.getUsedCount() : (int) usedInInvoices)
                            .status(p.getStatus() != null ? p.getStatus().name() : "ACTIVE")
                            .targetAudience(audience)
                            .totalTargetPatients(targetCount)
                            .sentCount(sent + usedInInvoices)
                            .interestedCount(interested)
                            .bookedCount(booked + usedInInvoices)
                            .build();
                })
                .toList();
    }

    private Promotion findPromoByCode(List<Promotion> list, String code) {
        return list.stream()
                .filter(p -> p.getCouponCode() != null && p.getCouponCode().equalsIgnoreCase(code))
                .findFirst()
                .orElse(null);
    }

    @Transactional
    public void ensureHolidayPromotionsExist() {
        boolean hasHoliday = promotionRepository.findAll().stream()
                .anyMatch(p -> "LE304".equalsIgnoreCase(p.getCouponCode()) || "TET2026".equalsIgnoreCase(p.getCouponCode()));
        if (hasHoliday) {
            return;
        }
        log.info("Seeding realistic holiday, anniversary and seasonal promotions for dental clinic CRM...");
        List<Promotion> list = new ArrayList<>();

        list.add(Promotion.builder()
                .title("Ưu đãi mừng Đại lễ 30/4 - 1/5: Tự hào nụ cười Việt")
                .couponCode("LE304")
                .category("Sự kiện ngày lễ")
                .description("Mừng ngày Giải phóng miền Nam 30/4 và Quốc tế Lao động 1/5. Nha Khoa Crown Dental tri ân ưu đãi giảm 25% các dịch vụ dán sứ Veneer, bọc răng sứ Cercon, cạo vôi đánh bóng và tẩy trắng răng công nghệ cao Laser White Pro.")
                .imageUrl("https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80")
                .promotionType(PromotionType.DISCOUNT_PERCENT)
                .discountPercent(new BigDecimal("25.00"))
                .maxDiscountAmount(new BigDecimal("3000000.00"))
                .usageLimit(200)
                .usedCount(38)
                .status(PromotionStatus.ACTIVE)
                .startDate(LocalDateTime.of(2026, 4, 15, 0, 0))
                .endDate(LocalDateTime.of(2026, 5, 15, 23, 59))
                .createdAt(LocalDateTime.now())
                .build());

        list.add(Promotion.builder()
                .title("Đại lễ Quốc khánh 2/9: Nụ cười rạng rỡ non sông")
                .couponCode("QUOCKHANH29")
                .category("Sự kiện ngày lễ")
                .description("Hòa chung niềm tự hào Tết Độc Lập 2/9. Crown Dental gửi tặng voucher giảm 20% các dịch vụ chỉnh nha niềng răng trong suốt, trồng răng Implant Thụy Sĩ và bọc răng sứ thẩm mỹ. Tặng miễn phí gói chụp phim CT Cone Beam 3D.")
                .imageUrl("https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80")
                .promotionType(PromotionType.DISCOUNT_PERCENT)
                .discountPercent(new BigDecimal("20.00"))
                .maxDiscountAmount(new BigDecimal("5000000.00"))
                .usageLimit(150)
                .usedCount(24)
                .status(PromotionStatus.ACTIVE)
                .startDate(LocalDateTime.of(2026, 8, 15, 0, 0))
                .endDate(LocalDateTime.of(2026, 9, 15, 23, 59))
                .createdAt(LocalDateTime.now())
                .build());

        list.add(Promotion.builder()
                .title("Xuân Rạng Ngời - Tết Sum Vầy 2026: Lì xì nụ cười tài lộc")
                .couponCode("TET2026")
                .category("Tết Nguyên Đán")
                .description("Đón Tết với hàm răng trắng sáng đón tài lộc! Crown Dental lì xì ngay voucher 1.500.000đ cho khách hàng thân thiết đặt lịch thăm khám, làm sạch mảng bám, trám răng thẩm mỹ và tân trang nụ cười đón Tết. Áp dụng hóa đơn từ 5.000.000đ.")
                .imageUrl("https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80")
                .promotionType(PromotionType.VOUCHER)
                .discountAmount(new BigDecimal("1500000.00"))
                .usageLimit(300)
                .usedCount(75)
                .status(PromotionStatus.ACTIVE)
                .startDate(LocalDateTime.of(2026, 1, 5, 0, 0))
                .endDate(LocalDateTime.of(2026, 2, 28, 23, 59))
                .createdAt(LocalDateTime.now())
                .build());

        list.add(Promotion.builder()
                .title("Đại tiệc tri ân - Mừng Sinh Nhật Nha Khoa Crown Dental")
                .couponCode("SINHNHAT")
                .category("Sinh nhật nha khoa")
                .description("Mừng sinh nhật Nha Khoa Quốc Tế Crown Dental! Tri ân khách hàng giảm sốc 30% toàn bộ dịch vụ nha khoa tổng quát và thẩm mỹ cao cấp. Miễn phí gói khám chuyên sâu cùng Bác sĩ Chuyên khoa II và nhận quà tặng đặc biệt.")
                .imageUrl("https://images.unsplash.com/photo-1513415277900-a62401e5084d?auto=format&fit=crop&w=800&q=80")
                .promotionType(PromotionType.DISCOUNT_PERCENT)
                .discountPercent(new BigDecimal("30.00"))
                .maxDiscountAmount(new BigDecimal("10000000.00"))
                .usageLimit(500)
                .usedCount(112)
                .status(PromotionStatus.ACTIVE)
                .startDate(LocalDateTime.of(2026, 9, 1, 0, 0))
                .endDate(LocalDateTime.of(2026, 10, 31, 23, 59))
                .createdAt(LocalDateTime.now())
                .build());

        list.add(Promotion.builder()
                .title("Tôn vinh nụ cười phái đẹp - Mừng ngày Phụ nữ Việt Nam 20/10")
                .couponCode("PHUNU2010")
                .category("Ngày lễ phụ nữ")
                .description("Tháng tôn vinh nụ cười phái đẹp. Tặng voucher 500.000đ và gói spa răng miệng cao cấp độc quyền cho tất cả khách hàng nữ khi trải nghiệm dịch vụ tại Crown Dental.")
                .imageUrl("https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=800&q=80")
                .promotionType(PromotionType.VOUCHER)
                .discountAmount(new BigDecimal("500000.00"))
                .usageLimit(250)
                .usedCount(68)
                .status(PromotionStatus.ACTIVE)
                .startDate(LocalDateTime.of(2026, 10, 1, 0, 0))
                .endDate(LocalDateTime.of(2026, 10, 31, 23, 59))
                .createdAt(LocalDateTime.now())
                .build());

        list.add(Promotion.builder()
                .title("Mùa hè nụ cười mới - Ưu đãi niềng răng Học sinh & Sinh viên")
                .couponCode("SUMMERSMILE")
                .category("Mùa hè & Tựu trường")
                .description("Hành trình kiến tạo nụ cười tự tin. Giảm 15% gói niềng răng trong suốt hoặc mắc cài kim loại, hỗ trợ trả góp 0% lãi suất, tặng kèm máy tăm nước cao cấp trị giá 1.500.000đ.")
                .imageUrl("https://images.unsplash.com/photo-1571772996211-2f02c9727629?auto=format&fit=crop&w=800&q=80")
                .promotionType(PromotionType.DISCOUNT_PERCENT)
                .discountPercent(new BigDecimal("15.00"))
                .maxDiscountAmount(new BigDecimal("4000000.00"))
                .usageLimit(180)
                .usedCount(45)
                .status(PromotionStatus.ACTIVE)
                .startDate(LocalDateTime.of(2026, 5, 15, 0, 0))
                .endDate(LocalDateTime.of(2026, 8, 31, 23, 59))
                .createdAt(LocalDateTime.now())
                .build());

        promotionRepository.saveAll(list);
        log.info("Saved 6 holiday and anniversary promotions successfully.");
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerCareRecordResponseDTO> getAllCareRecords(
            String search,
            String startDate,
            String endDate,
            String careType,
            String careStatus,
            String channel,
            String employeeId
    ) {
        List<CustomerCareRecord> list = careRepository.findAll();
        List<CustomerCareRecordResponseDTO> result = new ArrayList<>();

        for (CustomerCareRecord c : list) {
            String pName = c.getPatient() != null ? c.getPatient().getFullName() : "";
            String pCode = c.getPatient() != null ? c.getPatient().getPatientCode() : "";
            String phone = c.getPatient() != null ? c.getPatient().getPhoneNumber() : "";

            if (search != null && !search.isBlank()) {
                String q = search.toLowerCase().trim();
                boolean match = (pName != null && pName.toLowerCase().contains(q)) ||
                                (phone != null && phone.contains(q)) ||
                                (pCode != null && pCode.toLowerCase().contains(q)) ||
                                (c.getNotes() != null && c.getNotes().toLowerCase().contains(q)) ||
                                (c.getOutcome() != null && c.getOutcome().toLowerCase().contains(q));
                if (!match) continue;
            }

            if (careType != null && !careType.isBlank() && !"ALL".equalsIgnoreCase(careType) && !"Tất cả".equalsIgnoreCase(careType)) {
                CareType ct = CareType.fromString(careType);
                if (c.getCareType() != ct && (c.getCareType() == null || !c.getCareType().name().equalsIgnoreCase(careType.trim()))) {
                    continue;
                }
            }

            if (careStatus != null && !careStatus.isBlank() && !"ALL".equalsIgnoreCase(careStatus) && !"Tất cả".equalsIgnoreCase(careStatus)) {
                CareStatus cs = CareStatus.fromString(careStatus);
                if (c.getStatus() != cs && (c.getStatus() == null || !c.getStatus().name().equalsIgnoreCase(careStatus.trim()))) {
                    continue;
                }
            }

            if (channel != null && !channel.isBlank() && !"ALL".equalsIgnoreCase(channel) && !"Tất cả".equalsIgnoreCase(channel)) {
                CareChannel cc = CareChannel.fromString(channel);
                if (c.getChannel() != cc && (c.getChannel() == null || !c.getChannel().name().equalsIgnoreCase(channel.trim()))) {
                    continue;
                }
            }

            if (startDate != null && !startDate.isBlank() && c.getCareTime() != null) {
                try {
                    LocalDate s = LocalDate.parse(startDate.trim());
                    if (c.getCareTime().toLocalDate().isBefore(s)) continue;
                } catch (Exception ignored) {}
            }
            if (endDate != null && !endDate.isBlank() && c.getCareTime() != null) {
                try {
                    LocalDate e = LocalDate.parse(endDate.trim());
                    if (c.getCareTime().toLocalDate().isAfter(e)) continue;
                } catch (Exception ignored) {}
            }

            result.add(mapToResponseDTO(c));
        }

        result.sort((a, b) -> {
            if (a.getCareTime() == null) return 1;
            if (b.getCareTime() == null) return -1;
            return b.getCareTime().compareTo(a.getCareTime());
        });

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerCareRecordResponseDTO> getPatientCareHistory(UUID patientId) {
        return careRepository.findByPatientIdOrderByCareTimeDesc(patientId).stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CustomerCareRecordResponseDTO createCareRecord(CustomerCareRecordRequestDTO request) {
        log.info("Creating customer care record: {}", request);

        Patient patient = null;
        if (request.getPatientId() != null) {
            patient = patientRepository.findById(request.getPatientId()).orElse(null);
        }

        Appointment apt = null;
        if (request.getAppointmentId() != null) {
            apt = appointmentRepository.findById(request.getAppointmentId()).orElse(null);
            if (patient == null && apt != null && apt.getPatient() != null) {
                patient = apt.getPatient();
            }
        }

        FollowUpAppointment followUp = null;
        if (request.getFollowUpAppointmentId() != null) {
            followUp = followUpAppointmentRepository.findById(request.getFollowUpAppointmentId()).orElse(null);
            if (patient == null && followUp != null && followUp.getExaminationResult() != null &&
                    followUp.getExaminationResult().getMedicalRecord() != null) {
                patient = followUp.getExaminationResult().getMedicalRecord().getPatient();
            }
        }

        Invoice invoice = null;
        if (request.getInvoiceId() != null) {
            invoice = invoiceRepository.findById(request.getInvoiceId()).orElse(null);
            if (patient == null && invoice != null && invoice.getPatient() != null) {
                patient = invoice.getPatient();
            }
        }
        if (invoice == null && patient != null && CareType.fromString(request.getCareType()) == CareType.PAYMENT) {
            List<Invoice> patientInvoices = invoiceRepository.findByPatientIdOrderByInvoiceDateDesc(patient.getId());
            invoice = patientInvoices.stream()
                    .filter(inv -> inv.getRemainingAmount() != null && inv.getRemainingAmount().compareTo(BigDecimal.ZERO) > 0)
                    .findFirst()
                    .orElse(patientInvoices.isEmpty() ? null : patientInvoices.get(0));
        }

        CareType type = CareType.fromString(request.getCareType());
        CareChannel channel = CareChannel.fromString(request.getChannel());
        CareStatus status = CareStatus.fromString(request.getStatus());

        LocalDateTime careTime = request.getCareTime() != null ? request.getCareTime() : LocalDateTime.now();

        Promotion promotion = null;
        if (request.getPromotionId() != null) {
            promotion = promotionRepository.findById(request.getPromotionId()).orElse(null);
        }

        // Get currently authenticated staff name and employee
        Employee currentEmployee = getCurrentLoggedInEmployee();
        String currentStaffName = getCurrentStaffName();
        String staffNameToRecord = (request.getCreatedByName() != null && !request.getCreatedByName().isBlank())
                ? request.getCreatedByName()
                : currentStaffName;

        CustomerCareRecord record = CustomerCareRecord.builder()
                .patient(patient)
                .appointment(apt)
                .followUpAppointment(followUp)
                .invoice(invoice)
                .promotion(promotion)
                .employee(currentEmployee)
                .careType(type)
                .channel(channel)
                .status(status)
                .careTime(careTime)
                .notes(request.getNotes())
                .outcome(request.getOutcome())
                .nextCareDate(request.getNextCareDate())
                .isAuto(false)
                .createdByName(staffNameToRecord)
                .build();

        record = careRepository.save(record);
        log.info("Saved customer care record ID={}", record.getId());

        // Synchronize Appointment / FollowUpAppointment status based on customer outcome
        syncAppointmentStatusWithOutcome(apt, followUp, status, request.getOutcome());

        // If channel is GMAIL or EMAIL, send real email directly to patient
        if ((channel == CareChannel.GMAIL || channel == CareChannel.EMAIL) && patient != null && patient.getEmail() != null && !patient.getEmail().isBlank()) {
            try {
                sendCareEmailHtml(patient.getEmail(), patient.getFullName(), request.getNotes(), type, invoice, promotion);
            } catch (Exception ex) {
                log.error("Failed to send care email: {}", ex.getMessage());
                record.setStatus(CareStatus.FAILED);
                record = careRepository.save(record);
            }
        }

        return mapToResponseDTO(record);
    }

    private void syncAppointmentStatusWithOutcome(Appointment apt, FollowUpAppointment followUp, CareStatus careStatus, String outcome) {
        if (outcome == null) {
            outcome = "";
        }
        String outcomeLower = outcome.toLowerCase();

        // 1. Sync standard Appointment
        if (apt != null) {
            if (outcomeLower.contains("xác nhận đến") || outcomeLower.contains("đồng ý đến") || outcomeLower.contains("sẽ đến") || outcomeLower.contains("đúng giờ")) {
                apt.setStatus(StatusAppointment.CONFIRMED);
                appointmentRepository.save(apt);
                log.info("[CSKH-SYNC] Đã tự động cập nhật lịch hẹn {} sang CONFIRMED dựa trên phản hồi: {}", apt.getId(), outcome);
            } else if (outcomeLower.contains("hủy") || outcomeLower.contains("bận") || outcomeLower.contains("không đến") || careStatus == CareStatus.REJECTED) {
                apt.setStatus(StatusAppointment.CANCELLED);
                appointmentRepository.save(apt);
                log.info("[CSKH-SYNC] Đã tự động cập nhật lịch hẹn {} sang CANCELLED dựa trên phản hồi: {}", apt.getId(), outcome);
            } else if (outcomeLower.contains("dời") || outcomeLower.contains("đổi giờ") || outcomeLower.contains("đổi ngày")) {
                apt.setStatus(StatusAppointment.WAITING);
                appointmentRepository.save(apt);
                log.info("[CSKH-SYNC] Đã tự động cập nhật lịch hẹn {} sang WAITING dựa trên phản hồi: {}", apt.getId(), outcome);
            }
        }

        // 2. Sync FollowUpAppointment
        if (followUp != null) {
            if (outcomeLower.contains("xác nhận đến") || outcomeLower.contains("đồng ý đến") || outcomeLower.contains("sẽ đến") || outcomeLower.contains("đúng giờ")) {
                followUp.setStatus(true);
                followUpAppointmentRepository.save(followUp);
                log.info("[CSKH-SYNC] Đã tự động cập nhật lịch tái khám {} sang Active (true) dựa trên phản hồi: {}", followUp.getId(), outcome);
            } else if (outcomeLower.contains("hủy") || outcomeLower.contains("bận") || outcomeLower.contains("không đến") || careStatus == CareStatus.REJECTED) {
                followUp.setStatus(false);
                followUpAppointmentRepository.save(followUp);
                log.info("[CSKH-SYNC] Đã tự động cập nhật lịch tái khám {} sang Inactive/Hủy (false) dựa trên phản hồi: {}", followUp.getId(), outcome);
            }
        }
    }

    @Override
    @Transactional
    public CustomerCareRecordResponseDTO sendDirectCareEmail(SendDirectCareEmailRequestDTO request) {
        log.info("Sending direct care email: {}", request);
        Patient patient = null;
        if (request.getPatientId() != null) {
            patient = patientRepository.findById(request.getPatientId()).orElse(null);
        }

        String recipientEmail = request.getEmail();
        if ((recipientEmail == null || recipientEmail.isBlank()) && patient != null) {
            recipientEmail = patient.getEmail();
        }

        if (recipientEmail == null || recipientEmail.isBlank()) {
            throw new IllegalArgumentException("Bệnh nhân chưa có địa chỉ Email để gửi thông tin trực tiếp.");
        }

        CareType type = request.getCareType() != null ? CareType.fromString(request.getCareType()) : CareType.GENERAL_CARE;
        String notes = (request.getMessage() != null && !request.getMessage().isBlank())
                ? request.getMessage()
                : "Gửi thông tin chăm sóc khách hàng qua Gmail";

        Invoice invoice = null;
        if (request.getInvoiceId() != null) {
            invoice = invoiceRepository.findById(request.getInvoiceId()).orElse(null);
            if (patient == null && invoice != null && invoice.getPatient() != null) {
                patient = invoice.getPatient();
            }
        }
        if (invoice == null && patient != null && type == CareType.PAYMENT) {
            List<Invoice> patientInvoices = invoiceRepository.findByPatientIdOrderByInvoiceDateDesc(patient.getId());
            invoice = patientInvoices.stream()
                    .filter(inv -> inv.getRemainingAmount() != null && inv.getRemainingAmount().compareTo(BigDecimal.ZERO) > 0)
                    .findFirst()
                    .orElse(patientInvoices.isEmpty() ? null : patientInvoices.get(0));
        }

        Promotion promotion = null;
        if (request.getPromotionId() != null) {
            promotion = promotionRepository.findById(request.getPromotionId()).orElse(null);
        }
        if (promotion == null && request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            promotion = promotionRepository.findAll().stream()
                    .filter(pr -> pr.getCouponCode() != null && pr.getCouponCode().equalsIgnoreCase(request.getCouponCode().trim()))
                    .findFirst()
                    .orElse(null);
        }
        if (promotion == null && type == CareType.PROMOTION) {
            promotion = promotionRepository.findAll().stream()
                    .filter(pr -> pr.getStatus() == PromotionStatus.ACTIVE)
                    .findFirst()
                    .orElse(null);
        }

        CareStatus finalStatus = CareStatus.COMPLETED;
        try {
            sendCareEmailHtml(recipientEmail, patient != null ? patient.getFullName() : "Quý khách", notes, type, invoice, promotion);
        } catch (Exception ex) {
            log.error("Failed to send direct email: {}", ex.getMessage());
            finalStatus = CareStatus.FAILED;
        }

        Employee currentEmployee = getCurrentLoggedInEmployee();
        String currentStaffName = getCurrentStaffName();
        String staffNameToRecord = (request.getCreatedByName() != null && !request.getCreatedByName().isBlank())
                ? request.getCreatedByName()
                : currentStaffName;

        CustomerCareRecord record = CustomerCareRecord.builder()
                .patient(patient)
                .invoice(invoice)
                .promotion(promotion)
                .employee(currentEmployee)
                .careType(type)
                .channel(CareChannel.GMAIL)
                .status(finalStatus)
                .careTime(LocalDateTime.now())
                .notes(notes)
                .outcome(finalStatus == CareStatus.COMPLETED ? "Đã gửi Email" : "Gửi thất bại")
                .isAuto(false)
                .createdByName(staffNameToRecord)
                .build();

        record = careRepository.save(record);
        return mapToResponseDTO(record);
    }

    private void sendCareEmailHtml(String recipientEmail, String patientName, String notes, CareType careType, Invoice invoice) {
        sendCareEmailHtml(recipientEmail, patientName, notes, careType, invoice, null);
    }

    private void sendCareEmailHtml(String recipientEmail, String patientName, String notes, CareType careType, Invoice invoice, Promotion promotion) {
        try {
            String subject = "[Crown Dental] Thông tin chăm sóc khách hàng";
            if (careType == CareType.APPOINTMENT_REMINDER) {
                subject = "[Crown Dental] Nhắc lịch hẹn khám tại phòng khám";
            } else if (careType == CareType.POST_TREATMENT) {
                subject = "[Crown Dental] Thăm hỏi sức khỏe & Hướng dẫn sau điều trị";
            } else if (careType == CareType.BIRTHDAY) {
                subject = "[Crown Dental] Chúc mừng sinh nhật Quý khách!";
            } else if (careType == CareType.PAYMENT) {
                subject = "[Crown Dental] Thông báo thanh toán dịch vụ & Cảm ơn Quý khách";
            } else if (careType == CareType.PROMOTION) {
                String promoTitle = promotion != null ? promotion.getTitle() : "Món quà ưu đãi đặc biệt";
                subject = String.format("[Crown Dental] %s - Quý khách %s", promoTitle, patientName != null ? patientName : "");
            }

            String extraSectionHtml = "";
            if (careType == CareType.PAYMENT && invoice != null && invoice.getRemainingAmount() != null && invoice.getRemainingAmount().compareTo(BigDecimal.ZERO) > 0) {
                String invCode = invoice.getInvoiceCode() != null ? invoice.getInvoiceCode() : "HÓA ĐƠN";
                String addInfo = java.net.URLEncoder.encode(invCode + " " + (patientName != null ? patientName : ""), java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20");
                String qrUrl = String.format("https://img.vietqr.io/image/MB-0343632524-compact2.png?amount=%s&addInfo=%s&accountName=CROWN%%20DENTAL",
                        invoice.getRemainingAmount().toBigInteger().toString(), addInfo);
                String formattedDebt = java.text.NumberFormat.getInstance(new java.util.Locale("vi", "VN")).format(invoice.getRemainingAmount());

                extraSectionHtml = String.format("""
                    <div style="margin: 20px 0; padding: 18px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; text-align: center;">
                        <div style="display: inline-block; padding: 4px 12px; background-color: #132c68; color: #ffffff; font-size: 11px; font-weight: bold; border-radius: 4px; text-transform: uppercase; margin-bottom: 10px;">
                            VIETQR THANH TOÁN TIỆN LỢI - MB BANK
                        </div>
                        <h4 style="margin: 0 0 10px 0; font-size: 15px; color: #0f172a; font-weight: 700;">Quét mã VietQR để thanh toán nhanh</h4>
                        <div style="background: #ffffff; padding: 10px; border-radius: 8px; display: inline-block; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
                            <img src="%s" style="max-width: 240px; width: 100%%; height: auto; display: block; margin: 0 auto; border-radius: 6px;" alt="Mã VietQR thanh toán MB Bank" />
                        </div>
                        <table style="width: 100%%; max-width: 440px; margin: 14px auto 0 auto; border-collapse: collapse; font-size: 13px; text-align: left; background: #ffffff; border-radius: 6px; border: 1px dashed #94a3b8;">
                            <tr><td style="padding: 6px 10px; color: #64748b; font-size: 12px;">Ngân hàng thụ hưởng:</td><td style="padding: 6px 10px; font-weight: bold; color: #1e293b;">MB Bank (Ngân Hàng Quân Đội)</td></tr>
                            <tr style="background-color: #f8fafc;"><td style="padding: 6px 10px; color: #64748b; font-size: 12px;">Số tài khoản:</td><td style="padding: 6px 10px; font-family: monospace; font-size: 14px; font-weight: bold; color: #1d4ed8;">0343632524</td></tr>
                            <tr><td style="padding: 6px 10px; color: #64748b; font-size: 12px;">Chủ tài khoản:</td><td style="padding: 6px 10px; font-weight: bold; color: #1e293b;">CROWN DENTAL</td></tr>
                            <tr style="background-color: #f8fafc;"><td style="padding: 6px 10px; color: #64748b; font-size: 12px;">Số tiền cần thanh toán:</td><td style="padding: 6px 10px; font-weight: bold; color: #e11d48; font-size: 14px;">%s đ</td></tr>
                            <tr><td style="padding: 6px 10px; color: #64748b; font-size: 12px;">Cú pháp nội dung:</td><td style="padding: 6px 10px; font-family: monospace; font-weight: bold; color: #7e22ce;">%s - %s</td></tr>
                        </table>
                        <p style="margin: 10px 0 0 0; font-size: 12px; color: #64748b;">Quý khách mở ứng dụng Ngân hàng quét mã QR trên để thanh toán tự động không cần nhập lại thông tin.</p>
                    </div>
                """, qrUrl, formattedDebt, invCode, patientName != null ? patientName : "");
            } else if (careType == CareType.PROMOTION) {
                String promoTitle = promotion != null ? promotion.getTitle() : "Chương trình tri ân Crown Dental";
                String couponCode = promotion != null && promotion.getCouponCode() != null ? promotion.getCouponCode() : "TRIAN2026";
                String discountHighlight = "Ưu đãi đặc biệt";
                if (promotion != null) {
                    if (promotion.getDiscountPercent() != null && promotion.getDiscountPercent().compareTo(BigDecimal.ZERO) > 0) {
                        discountHighlight = "GIẢM NGAY " + promotion.getDiscountPercent().stripTrailingZeros().toPlainString() + "%";
                    } else if (promotion.getDiscountAmount() != null && promotion.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
                        discountHighlight = "TẶNG VOUCHER " + java.text.NumberFormat.getInstance(new java.util.Locale("vi", "VN")).format(promotion.getDiscountAmount()) + " đ";
                    }
                }
                String expDate = (promotion != null && promotion.getEndDate() != null)
                        ? promotion.getEndDate().format(DATE_FMT)
                        : "Áp dụng trong tháng";

                extraSectionHtml = String.format("""
                    <div style="margin: 22px 0; padding: 22px; background: linear-gradient(135deg, #fdf4ff 0%%, #fae8ff 50%%, #f3e8ff 100%%); border: 2px dashed #c084fc; border-radius: 14px; text-align: center; box-shadow: 0 4px 12px rgba(192, 132, 252, 0.12);">
                        <div style="display: inline-block; padding: 5px 14px; background: linear-gradient(135deg, #a855f7, #7c3aed); color: #ffffff; font-size: 11px; font-weight: bold; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px;">
                            VOUCHER TRI ÂN ĐẶC QUYỀN
                        </div>
                        <h3 style="margin: 0 0 8px 0; font-size: 17px; color: #581c87; font-weight: 800;">%s</h3>
                        <p style="margin: 0 0 16px 0; font-size: 13px; color: #7e22ce;">Crown Dental trân trọng gửi tặng Quý khách mã ưu đãi đặc biệt mừng sự kiện</p>

                        <div style="background: #ffffff; border: 2px solid #a855f7; border-radius: 10px; padding: 14px 24px; display: inline-block; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                            <span style="font-size: 11px; color: #64748b; display: block; text-transform: uppercase; letter-spacing: 0.5px;">MÃ VOUCHER ÁP DỤNG</span>
                            <span style="font-family: monospace; font-size: 26px; font-weight: 900; color: #7c3aed; letter-spacing: 3px; display: block; margin: 4px 0;">%s</span>
                            <span style="display: inline-block; padding: 3px 10px; background-color: #fef08a; color: #854d0e; font-weight: bold; font-size: 13px; border-radius: 4px;">%s</span>
                        </div>

                        <div style="margin-top: 14px; font-size: 12px; color: #6b21a8; line-height: 1.6;">
                            <p style="margin: 0;"><strong>Hạn dùng voucher:</strong> %s &bull; Quý khách đọc mã hoặc xuất trình email khi đặt lịch hẹn</p>
                        </div>
                    </div>
                """, promoTitle, couponCode, discountHighlight, expDate);
            }

            String body = """
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"></head>
                <body style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px; color: #374151;">
                    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                        <div style="background: linear-gradient(135deg, #7c3aed, #4f46e5); padding: 22px; text-align: center; color: #ffffff;">
                            <h2 style="margin: 0; font-size: 20px; font-weight: bold;">NHA KHOA QUỐC TẾ CROWN DENTAL</h2>
                            <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Chăm sóc tận tâm - Nụ cười trọn vẹn</p>
                        </div>
                        <div style="padding: 24px;">
                            <p style="font-size: 15px; margin-top: 0;">Kính gửi Quý khách <strong>%s</strong>,</p>
                            <p style="font-size: 14px; line-height: 1.6; color: #4b5563;">Crown Dental trân trọng gửi thông tin chăm sóc khách hàng đến Quý khách:</p>
                            <div style="background-color: #f8fafc; border-left: 4px solid #7c3aed; padding: 14px 16px; border-radius: 4px; margin: 18px 0;">
                                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1e293b;">%s</p>
                            </div>
                            %s
                            <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">Nếu Quý khách có bất kỳ thắc mắc hoặc cần hỗ trợ thêm, xin vui lòng phản hồi email này hoặc liên hệ Hotline: <strong>0343632524</strong>.</p>
                        </div>
                        <div style="background-color: #f8fafc; padding: 14px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
                            <p style="margin: 0;">Nha Khoa Quốc Tế Crown Dental &bull; 12 Nguyễn Văn Bảo, Phường 4, Gò Vấp, TP.HCM</p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(
                    patientName != null ? patientName : "Quý khách",
                    notes != null ? notes.replace("\n", "<br>") : "Thông tin chăm sóc từ phòng khám Crown Dental",
                    extraSectionHtml
                );

            emailService.send(recipientEmail.trim(), subject, body);
            log.info("Sent care email directly to {} ({})", patientName, recipientEmail);
        } catch (Exception e) {
            log.error("Failed to send care email to {}: {}", recipientEmail, e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerCareStatsDTO getStats() {
        List<CustomerCareRecord> allCares = careRepository.findAll();

        long completed = allCares.stream().filter(c -> c.getStatus() == CareStatus.COMPLETED).count();
        long recare = allCares.stream().filter(c -> c.getStatus() == CareStatus.RECARE).count();
        long failed = allCares.stream().filter(c -> c.getStatus() == CareStatus.FAILED || c.getStatus() == CareStatus.NO_ANSWER || c.getStatus() == CareStatus.REJECTED).count();
        long pending = allCares.stream().filter(c -> c.getStatus() == CareStatus.PENDING).count();

        long aptCount = appointmentRepository.count() + followUpAppointmentRepository.count();
        long bdayCount = patientRepository.findAll().stream().filter(p -> p.getDateOfBirth() != null).count();
        long postTreatmentCount = allCares.stream().filter(c -> c.getCareType() == CareType.POST_TREATMENT).count();
        long generalCareCount = allCares.stream().filter(c -> c.getCareType() == CareType.GENERAL_CARE).count();
        long paymentCareCount = allCares.stream().filter(c -> c.getCareType() == CareType.PAYMENT).count();
        long promoCareCount = allCares.stream().filter(c -> c.getCareType() == CareType.PROMOTION).count();
        long activePromos = promotionRepository.findAll().stream()
                .filter(p -> p.getStatus() == PromotionStatus.ACTIVE)
                .count();

        List<Invoice> allInvoices = invoiceRepository.findAll();
        long paidInvoices = allInvoices.stream().filter(i -> i.getPaymentStatus() == PaymentStatus.PAID).count();
        long debtInvoices = allInvoices.stream().filter(i -> i.getPaymentStatus() == PaymentStatus.PARTIALLY_PAID || i.getPaymentStatus() == PaymentStatus.UNPAID).count();

        double satRate = 98.5;
        if (!allCares.isEmpty()) {
            satRate = Math.round(((double) completed / allCares.size()) * 1000.0) / 10.0;
        }

        return CustomerCareStatsDTO.builder()
                .totalPending(pending)
                .totalCompleted(completed)
                .totalRecare(recare)
                .totalFailed(failed)
                .totalAppointments(aptCount)
                .totalBirthdays(bdayCount)
                .totalPostTreatmentCare(postTreatmentCount)
                .totalGeneralCare(generalCareCount)
                .totalPaymentCare(paymentCareCount)
                .totalPromotionCare(promoCareCount)
                .totalActivePromotions(activePromos)
                .totalPaidInvoices(paidInvoices)
                .totalDebtInvoices(debtInvoices)
                .satisfactionRate(satRate)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public FilterOptionsDTO getFilterOptions() {
        List<Dentist> dentists = dentistRepository.findAll();
        List<FilterOptionsDTO.NamedOptionDTO> dList = dentists.stream()
                .map(d -> new FilterOptionsDTO.NamedOptionDTO(d.getId().toString(), d.getFullName()))
                .filter(o -> o.getName() != null && !o.getName().isBlank())
                .collect(Collectors.toList());

        List<Employee> employees = employeeRepository.findAll();
        List<FilterOptionsDTO.NamedOptionDTO> eList = employees.stream()
                .map(e -> new FilterOptionsDTO.NamedOptionDTO(e.getId().toString(), e.getFullName()))
                .filter(o -> o.getName() != null && !o.getName().isBlank())
                .collect(Collectors.toList());

        List<String> procGroups = Arrays.asList(
                "Niềng răng - Chỉnh nha",
                "Cấy ghép Implant",
                "Răng sứ thẩm mỹ",
                "Nhổ răng & Tiểu phẫu",
                "Điều trị tủy",
                "Nha khoa tổng quát",
                "Tẩy trắng răng"
        );

        List<String> procs = serviceRepository.findAll().stream()
                .map(s -> s.getServiceName())
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        if (procs.isEmpty()) {
            procs = Arrays.asList(
                    "Nhổ răng khôn",
                    "Lấy cao răng",
                    "Trám răng FUJI",
                    "Cấy ghép Implant",
                    "Chỉnh nha cố định mắc cài kim loại",
                    "Tái khám chỉnh nha",
                    "Điều trị tủy",
                    "Tẩy trắng răng Laser"
            );
        }

        List<Patient> allPatients = patientRepository.findAll();
        List<String> cGroups = new ArrayList<>();
        cGroups.add("Tất cả");
        allPatients.stream()
                .map(Patient::getCustomerGroup)
                .filter(Objects::nonNull)
                .filter(s -> !s.isBlank())
                .distinct()
                .forEach(cGroups::add);
        if (cGroups.size() == 1) {
            cGroups.addAll(Arrays.asList("Khách VIP", "Khách thân thiết", "Khách mới", "Khách tiềm năng"));
        }

        List<String> cSources = new ArrayList<>();
        cSources.add("Tất cả");
        allPatients.stream()
                .map(Patient::getCustomerSource)
                .filter(Objects::nonNull)
                .filter(s -> !s.isBlank())
                .distinct()
                .forEach(cSources::add);
        if (cSources.size() == 1) {
            cSources.addAll(Arrays.asList("Facebook", "Website", "Người quen giới thiệu", "Trực tiếp", "Hotline", "Tiktok"));
        }

        List<String> cities = Arrays.asList("Tất cả", "TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Bình Dương", "Đồng Nai", "Cần Thơ");
        List<String> districts = Arrays.asList("Tất cả", "Quận 1", "Quận 3", "Quận 5", "Quận 10", "Bình Thạnh", "Gò Vấp", "TP. Thủ Đức", "Phú Nhuận", "Tân Bình");

        return FilterOptionsDTO.builder()
                .dentists(dList)
                .employees(eList)
                .procedureGroups(procGroups)
                .procedures(procs)
                .customerGroups(cGroups)
                .customerSources(cSources)
                .cities(cities)
                .districts(districts)
                .build();
    }

    private CustomerCareRecordResponseDTO mapToResponseDTO(CustomerCareRecord c) {
        String pName = c.getPatient() != null ? c.getPatient().getFullName() : "";
        String pCode = c.getPatient() != null ? c.getPatient().getPatientCode() : "";
        String phone = c.getPatient() != null ? c.getPatient().getPhoneNumber() : "";
        String email = c.getPatient() != null ? c.getPatient().getEmail() : "";
        UUID pId = c.getPatient() != null ? c.getPatient().getId() : null;

        String staff = c.getCreatedByName();
        if (staff == null || staff.isBlank()) {
            if (c.getEmployee() != null && c.getEmployee().getFullName() != null) {
                staff = c.getEmployee().getFullName();
            } else if (Boolean.TRUE.equals(c.getIsAuto()) || c.getChannel() == CareChannel.GMAIL || c.getChannel() == CareChannel.EMAIL || c.getChannel() == CareChannel.SMS || c.getChannel() == CareChannel.ZALO_SMS) {
                staff = "Hệ thống tự động";
            } else {
                staff = "Lễ tân phòng khám";
            }
        }

        UUID invId = c.getInvoice() != null ? c.getInvoice().getId() : null;
        String invCode = c.getInvoice() != null ? c.getInvoice().getInvoiceCode() : null;
        UUID promoId = c.getPromotion() != null ? c.getPromotion().getId() : null;
        String promoTitle = c.getPromotion() != null ? c.getPromotion().getTitle() : null;
        String couponCode = c.getPromotion() != null ? c.getPromotion().getCouponCode() : null;
        UUID aptId = c.getAppointment() != null ? c.getAppointment().getId() : null;
        UUID followUpId = c.getFollowUpAppointment() != null ? c.getFollowUpAppointment().getId() : null;

        return CustomerCareRecordResponseDTO.builder()
                .id(c.getId())
                .patientId(pId)
                .patientCode(pCode)
                .patientName(pName)
                .phone(phone)
                .email(email)
                .careType(c.getCareType() != null ? c.getCareType().name() : null)
                .careTypeLabel(c.getCareType() != null ? c.getCareType().getLabel() : "")
                .channel(c.getChannel() != null ? c.getChannel().name() : null)
                .channelLabel(c.getChannel() != null ? c.getChannel().getLabel() : "")
                .status(c.getStatus() != null ? c.getStatus().name() : null)
                .statusLabel(c.getStatus() != null ? c.getStatus().getLabel() : "")
                .careTime(c.getCareTime())
                .notes(c.getNotes())
                .outcome(c.getOutcome())
                .nextCareDate(c.getNextCareDate())
                .isAuto(Boolean.TRUE.equals(c.getIsAuto()))
                .appointmentId(aptId)
                .followUpAppointmentId(followUpId)
                .invoiceId(invId)
                .invoiceCode(invCode)
                .promotionId(promoId)
                .promotionTitle(promoTitle)
                .couponCode(couponCode)
                .createdByName(staff)
                .createdAt(c.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PatientCareDetailDTO getPatientCareDetail(UUID patientId, UUID contextAppointmentId, UUID contextInvoiceId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy bệnh nhân với ID: " + patientId));

        // 1. Patient info
        String dobFormatted = "";
        if (patient.getDateOfBirth() != null) {
            dobFormatted = patient.getDateOfBirth().format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));
        }

        // 2. Fetch all regular appointments of this patient
        List<Appointment> allApts = appointmentRepository.findByPatientId(patientId);

        List<PatientCareDetailDTO.PatientAppointmentDTO> appointmentDTOs = new ArrayList<>();

        // Map regular appointments
        for (Appointment a : allApts) {
            LocalDateTime aptTime = a.getAppointmentTime() != null ? a.getAppointmentTime() : a.getAppointmentDate();
            String timeFmt = aptTime != null ? aptTime.format(DATE_TIME_FMT) : "";
            String dentistName = a.getDentist() != null ? a.getDentist().getFullName() : "";

            // Clean type: If raw attribute is a UUID or blank, default to "Đặt trước"
            String type = "Đặt trước";
            if (a.getAttribute() != null && !a.getAttribute().isBlank()) {
                String raw = a.getAttribute().trim();
                if (!raw.matches("^[0-9a-fA-F-]{20,}$")) {
                    type = raw;
                }
            }
            String sLabel = mapAppointmentStatusToLabel(a.getStatus());
            appointmentDTOs.add(PatientCareDetailDTO.PatientAppointmentDTO.builder()
                    .id(a.getId())
                    .appointmentTime(aptTime)
                    .timeFormatted(timeFmt)
                    .appointmentType(type)
                    .dentistId(a.getDentist() != null ? a.getDentist().getId() : null)
                    .dentistName(dentistName)
                    .content(a.getReason() != null ? a.getReason() : "")
                    .notes(a.getNotes() != null ? a.getNotes() : "")
                    .status(a.getStatus() != null ? a.getStatus().name() : "PENDING")
                    .statusLabel(sLabel)
                    .build());
        }

        // 3. Fetch follow-up appointments of this patient (từ màn hình Lịch tái khám)
        List<FollowUpAppointment> followUps = followUpAppointmentRepository.findByPatientId(patientId);
        for (FollowUpAppointment f : followUps) {
            LocalDateTime fTime = f.getFollowUpDate();
            String timeFmt = fTime != null ? fTime.format(DATE_TIME_FMT) : "";
            String dentistName = f.getDentist() != null ? f.getDentist().getFullName() : "";
            String sLabel = Boolean.FALSE.equals(f.getStatus()) ? "Đã hủy" : (fTime != null && fTime.isBefore(LocalDateTime.now()) ? "Đã xong" : "Chưa đến");
            String sCode = Boolean.FALSE.equals(f.getStatus()) ? "CANCELLED" : "CONFIRMED";

            appointmentDTOs.add(PatientCareDetailDTO.PatientAppointmentDTO.builder()
                    .id(f.getId())
                    .appointmentTime(fTime)
                    .timeFormatted(timeFmt)
                    .appointmentType("Tái khám")
                    .dentistId(f.getDentist() != null ? f.getDentist().getId() : null)
                    .dentistName(dentistName)
                    .content(f.getReason() != null && !f.getReason().isBlank() ? f.getReason() : "Tái khám theo hẹn")
                    .notes(f.getNote() != null ? f.getNote() : "")
                    .status(sCode)
                    .statusLabel(sLabel)
                    .build());
        }

        // Sort all appointments descending by appointmentTime (newest first)
        appointmentDTOs.sort((a, b) -> {
            if (a.getAppointmentTime() == null) return 1;
            if (b.getAppointmentTime() == null) return -1;
            return b.getAppointmentTime().compareTo(a.getAppointmentTime());
        });

        // 4. Determine Reminder appointment info
        PatientCareDetailDTO.AppointmentReminderInfoDTO reminderInfo = null;

        if (contextAppointmentId != null) {
            // Find in regular appointments first
            Appointment found = allApts.stream().filter(a -> a.getId().equals(contextAppointmentId)).findFirst().orElse(null);
            if (found != null) {
                LocalDateTime rt = found.getAppointmentTime() != null ? found.getAppointmentTime() : found.getAppointmentDate();
                reminderInfo = PatientCareDetailDTO.AppointmentReminderInfoDTO.builder()
                        .appointmentId(found.getId())
                        .appointmentTime(rt)
                        .timeFormatted(rt != null ? rt.format(DateTimeFormatter.ofPattern("HH:mm dd-MM-yyyy")) : "")
                        .status(mapAppointmentStatusToLabel(found.getStatus()))
                        .statusCode(found.getStatus() != null ? found.getStatus().name() : "PENDING")
                        .dentistName(found.getDentist() != null ? found.getDentist().getFullName() : "")
                        .content(found.getReason() != null ? found.getReason() : "")
                        .build();
            } else {
                // Find in follow-up appointments
                FollowUpAppointment fFound = followUps.stream().filter(f -> f.getId().equals(contextAppointmentId)).findFirst().orElse(null);
                if (fFound != null) {
                    LocalDateTime rt = fFound.getFollowUpDate();
                    String sLabel = Boolean.FALSE.equals(fFound.getStatus()) ? "Đã hủy" : (rt != null && rt.isBefore(LocalDateTime.now()) ? "Đã xong" : "Chưa đến");
                    String sCode = Boolean.FALSE.equals(fFound.getStatus()) ? "CANCELLED" : "CONFIRMED";
                    String dName = fFound.getDentist() != null ? fFound.getDentist().getFullName() : "";
                    reminderInfo = PatientCareDetailDTO.AppointmentReminderInfoDTO.builder()
                            .appointmentId(fFound.getId())
                            .appointmentTime(rt)
                            .timeFormatted(rt != null ? rt.format(DateTimeFormatter.ofPattern("HH:mm dd-MM-yyyy")) : "")
                            .status(sLabel)
                            .statusCode(sCode)
                            .dentistName(dName)
                            .content(fFound.getReason() != null && !fFound.getReason().isBlank() ? fFound.getReason() : "Tái khám theo hẹn")
                            .build();
                }
            }
        }

        // If no context appointment, find upcoming or latest from combined list
        if (reminderInfo == null && !appointmentDTOs.isEmpty()) {
            LocalDate today = LocalDate.now();
            PatientCareDetailDTO.PatientAppointmentDTO bestApt = appointmentDTOs.stream()
                    .filter(a -> a.getAppointmentTime() != null && !a.getAppointmentTime().toLocalDate().isBefore(today))
                    .min(Comparator.comparing(PatientCareDetailDTO.PatientAppointmentDTO::getAppointmentTime))
                    .orElse(appointmentDTOs.get(0));

            LocalDateTime rt = bestApt.getAppointmentTime();
            reminderInfo = PatientCareDetailDTO.AppointmentReminderInfoDTO.builder()
                    .appointmentId(bestApt.getId())
                    .appointmentTime(rt)
                    .timeFormatted(rt != null ? rt.format(DateTimeFormatter.ofPattern("HH:mm dd-MM-yyyy")) : "")
                    .status(bestApt.getStatusLabel())
                    .statusCode(bestApt.getStatus())
                    .dentistName(bestApt.getDentistName())
                    .content(bestApt.getContent())
                    .build();
        }

        // 5. Care history
        List<CustomerCareRecordResponseDTO> careHistory = getPatientCareHistory(patientId);

        // 6. Invoices & Billing info of this patient
        List<Invoice> patientInvoices = invoiceRepository.findByPatientIdOrderByInvoiceDateDesc(patientId);
        List<PatientCareDetailDTO.PatientInvoiceDTO> invoiceDTOs = new ArrayList<>();
        BigDecimal totalPatientDebt = BigDecimal.ZERO;
        BigDecimal totalPatientPaid = BigDecimal.ZERO;
        BigDecimal totalPatientInvoiced = BigDecimal.ZERO;

        for (Invoice inv : patientInvoices) {
            BigDecimal fAmt = inv.getFinalAmount() != null ? inv.getFinalAmount() : BigDecimal.ZERO;
            BigDecimal pAmt = inv.getPaidAmount() != null ? inv.getPaidAmount() : BigDecimal.ZERO;
            BigDecimal rAmt = inv.getRemainingAmount() != null ? inv.getRemainingAmount() : fAmt.subtract(pAmt).max(BigDecimal.ZERO);
            totalPatientInvoiced = totalPatientInvoiced.add(fAmt);
            totalPatientPaid = totalPatientPaid.add(pAmt);
            totalPatientDebt = totalPatientDebt.add(rAmt);

            String statusLabel = "Chưa thanh toán";
            if (inv.getPaymentStatus() != null) {
                switch (inv.getPaymentStatus()) {
                    case PAID:
                        statusLabel = "Đã thanh toán";
                        break;
                    case PARTIALLY_PAID:
                        statusLabel = "Thanh toán 1 phần";
                        break;
                    case UNPAID:
                        statusLabel = "Chưa thanh toán";
                        break;
                    case CANCELLED:
                        statusLabel = "Đã hủy";
                        break;
                }
            }

            String invDateFmt = inv.getInvoiceDate() != null ? inv.getInvoiceDate().format(DATE_TIME_FMT) : "";
            String empName = inv.getEmployee() != null ? inv.getEmployee().getFullName() : "Nhân viên thu ngân";
            int itemsCount = inv.getInvoiceDetails() != null ? inv.getInvoiceDetails().size() : 0;

            invoiceDTOs.add(PatientCareDetailDTO.PatientInvoiceDTO.builder()
                    .id(inv.getId())
                    .invoiceCode(inv.getInvoiceCode() != null ? inv.getInvoiceCode() : "")
                    .invoiceDate(inv.getInvoiceDate())
                    .timeFormatted(invDateFmt)
                    .finalAmount(fAmt)
                    .paidAmount(pAmt)
                    .remainingAmount(rAmt)
                    .paymentStatus(inv.getPaymentStatus() != null ? inv.getPaymentStatus().name() : "UNPAID")
                    .paymentStatusLabel(statusLabel)
                    .employeeName(empName)
                    .itemsCount(itemsCount)
                    .build());
        }

        // 7. Context Invoice info
        PatientCareDetailDTO.InvoiceCareInfoDTO invoiceInfo = null;
        Invoice targetInvoice = null;
        if (contextInvoiceId != null) {
            targetInvoice = patientInvoices.stream().filter(i -> i.getId().equals(contextInvoiceId)).findFirst()
                    .orElseGet(() -> invoiceRepository.findById(contextInvoiceId).orElse(null));
        }
        if (targetInvoice == null && !patientInvoices.isEmpty()) {
            targetInvoice = patientInvoices.stream()
                    .filter(i -> i.getRemainingAmount() != null && i.getRemainingAmount().compareTo(BigDecimal.ZERO) > 0)
                    .findFirst()
                    .orElse(patientInvoices.get(0));
        }

        if (targetInvoice != null) {
            BigDecimal fAmt = targetInvoice.getFinalAmount() != null ? targetInvoice.getFinalAmount() : BigDecimal.ZERO;
            BigDecimal pAmt = targetInvoice.getPaidAmount() != null ? targetInvoice.getPaidAmount() : BigDecimal.ZERO;
            BigDecimal rAmt = targetInvoice.getRemainingAmount() != null ? targetInvoice.getRemainingAmount() : fAmt.subtract(pAmt).max(BigDecimal.ZERO);
            String statusLabel = "Chưa thanh toán";
            if (targetInvoice.getPaymentStatus() != null) {
                switch (targetInvoice.getPaymentStatus()) {
                    case PAID:
                        statusLabel = "Đã thanh toán";
                        break;
                    case PARTIALLY_PAID:
                        statusLabel = "Thanh toán 1 phần";
                        break;
                    case UNPAID:
                        statusLabel = "Chưa thanh toán";
                        break;
                    case CANCELLED:
                        statusLabel = "Đã hủy";
                        break;
                }
            }

            List<PatientCareDetailDTO.InvoiceItemDTO> itemDTOs = new ArrayList<>();
            if (targetInvoice.getInvoiceDetails() != null) {
                for (InvoiceDetail d : targetInvoice.getInvoiceDetails()) {
                    itemDTOs.add(PatientCareDetailDTO.InvoiceItemDTO.builder()
                            .itemName(d.getItemName() != null ? d.getItemName() : "Dịch vụ nha khoa")
                            .quantity(d.getQuantity() != null ? d.getQuantity() : 1)
                            .unitPrice(d.getUnitPrice() != null ? d.getUnitPrice() : BigDecimal.ZERO)
                            .subtotal(d.getSubtotal() != null ? d.getSubtotal() : BigDecimal.ZERO)
                            .build());
                }
            }

            String invDateFmt = targetInvoice.getInvoiceDate() != null ? targetInvoice.getInvoiceDate().format(DATE_FMT) : "";
            String empName = targetInvoice.getEmployee() != null ? targetInvoice.getEmployee().getFullName() : "Nhân viên thu ngân";

            invoiceInfo = PatientCareDetailDTO.InvoiceCareInfoDTO.builder()
                    .invoiceId(targetInvoice.getId())
                    .invoiceCode(targetInvoice.getInvoiceCode() != null ? targetInvoice.getInvoiceCode() : "")
                    .invoiceDate(targetInvoice.getInvoiceDate())
                    .dateFormatted(invDateFmt)
                    .totalAmount(targetInvoice.getTotalAmount() != null ? targetInvoice.getTotalAmount() : fAmt)
                    .discountAmount(targetInvoice.getDiscountAmount() != null ? targetInvoice.getDiscountAmount() : BigDecimal.ZERO)
                    .finalAmount(fAmt)
                    .paidAmount(pAmt)
                    .remainingAmount(rAmt)
                    .paymentStatus(targetInvoice.getPaymentStatus() != null ? targetInvoice.getPaymentStatus().name() : "UNPAID")
                    .paymentStatusLabel(statusLabel)
                    .employeeName(empName)
                    .items(itemDTOs)
                    .build();
        }

        return PatientCareDetailDTO.builder()
                .patientId(patient.getId())
                .patientCode(patient.getPatientCode() != null ? patient.getPatientCode() : "")
                .fullName(patient.getFullName() != null ? patient.getFullName() : "")
                .phone(patient.getPhoneNumber() != null ? patient.getPhoneNumber() : "")
                .dateOfBirth(patient.getDateOfBirth())
                .dateOfBirthFormatted(dobFormatted)
                .address(patient.getAddress())
                .customerGroup(patient.getCustomerGroup())
                .customerSource(patient.getCustomerSource())
                .customerCard(patient.getCustomerCard())
                .notes(patient.getNotes())
                .reminderInfo(reminderInfo)
                .invoiceInfo(invoiceInfo)
                .invoices(invoiceDTOs)
                .totalPatientDebt(totalPatientDebt)
                .totalPatientPaid(totalPatientPaid)
                .totalPatientInvoiced(totalPatientInvoiced)
                .careHistory(careHistory)
                .appointments(appointmentDTOs)
                .build();
    }

    @Override
    @Transactional
    public PatientCareDetailDTO.PatientAppointmentDTO updateAppointmentStatus(UUID appointmentId, String newStatus) {
        Appointment apt = appointmentRepository.findById(appointmentId).orElse(null);
        if (apt != null) {
            StatusAppointment status = mapLabelToAppointmentStatus(newStatus);
            apt.setStatus(status);
            apt = appointmentRepository.save(apt);

            LocalDateTime aptTime = apt.getAppointmentTime() != null ? apt.getAppointmentTime() : apt.getAppointmentDate();
            return PatientCareDetailDTO.PatientAppointmentDTO.builder()
                    .id(apt.getId())
                    .appointmentTime(aptTime)
                    .timeFormatted(aptTime != null ? aptTime.format(DATE_TIME_FMT) : "")
                    .appointmentType(apt.getAttribute() != null ? apt.getAttribute() : "Đặt trước")
                    .dentistId(apt.getDentist() != null ? apt.getDentist().getId() : null)
                    .dentistName(apt.getDentist() != null ? apt.getDentist().getFullName() : "")
                    .content(apt.getReason())
                    .notes(apt.getNotes())
                    .status(apt.getStatus().name())
                    .statusLabel(mapAppointmentStatusToLabel(apt.getStatus()))
                    .build();
        }

        FollowUpAppointment f = followUpAppointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy lịch hẹn hoặc lịch tái khám ID: " + appointmentId));

        boolean isCancelled = "Đã hủy".equalsIgnoreCase(newStatus) || "CANCELLED".equalsIgnoreCase(newStatus);
        f.setStatus(!isCancelled);
        f = followUpAppointmentRepository.save(f);

        LocalDateTime fTime = f.getFollowUpDate();
        String timeFmt = fTime != null ? fTime.format(DATE_TIME_FMT) : "";
        String dentistName = f.getDentist() != null ? f.getDentist().getFullName() : "";
        String sLabel = Boolean.FALSE.equals(f.getStatus()) ? "Đã hủy" : (fTime != null && fTime.isBefore(LocalDateTime.now()) ? "Đã xong" : "Chưa đến");
        String sCode = Boolean.FALSE.equals(f.getStatus()) ? "CANCELLED" : "CONFIRMED";

        return PatientCareDetailDTO.PatientAppointmentDTO.builder()
                .id(f.getId())
                .appointmentTime(fTime)
                .timeFormatted(timeFmt)
                .appointmentType("Tái khám")
                .dentistId(f.getDentist() != null ? f.getDentist().getId() : null)
                .dentistName(dentistName)
                .content(f.getReason() != null && !f.getReason().isBlank() ? f.getReason() : "Tái khám theo hẹn")
                .notes(f.getNote() != null ? f.getNote() : "")
                .status(sCode)
                .statusLabel(sLabel)
                .build();
    }

    @Override
    @Transactional
    public void deleteAppointment(UUID appointmentId) {
        Appointment apt = appointmentRepository.findById(appointmentId).orElse(null);
        if (apt != null) {
            List<CustomerCareRecord> linkedCares = careRepository.findAll().stream()
                    .filter(c -> c.getAppointment() != null && c.getAppointment().getId().equals(appointmentId))
                    .collect(Collectors.toList());
            for (CustomerCareRecord c : linkedCares) {
                c.setAppointment(null);
                careRepository.save(c);
            }
            appointmentRepository.delete(apt);
            return;
        }

        FollowUpAppointment f = followUpAppointmentRepository.findById(appointmentId).orElse(null);
        if (f != null) {
            followUpAppointmentRepository.delete(f);
        }
    }

    @Override
    @Transactional
    public PatientCareDetailDTO.PatientAppointmentDTO createPatientAppointment(UUID patientId, CreatePatientAppointmentRequestDTO request) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy bệnh nhân ID: " + patientId));

        Dentist dentist = null;
        if (request.getDentistId() != null) {
            dentist = dentistRepository.findById(request.getDentistId()).orElse(null);
        }

        StatusAppointment status = mapLabelToAppointmentStatus(request.getStatus());
        LocalDateTime time = request.getAppointmentTime() != null ? request.getAppointmentTime() : LocalDateTime.now();

        Appointment apt = Appointment.builder()
                .patient(patient)
                .patientName(patient.getFullName())
                .phone(patient.getPhoneNumber())
                .dentist(dentist)
                .appointmentDate(time.toLocalDate().atStartOfDay())
                .appointmentTime(time)
                .reason(request.getContent())
                .attribute(request.getAppointmentType() != null && !request.getAppointmentType().isBlank() ? request.getAppointmentType() : "Đặt trước")
                .status(status)
                .notes(request.getNotes())
                .build();

        apt = appointmentRepository.save(apt);

        return PatientCareDetailDTO.PatientAppointmentDTO.builder()
                .id(apt.getId())
                .appointmentTime(time)
                .timeFormatted(time.format(DATE_TIME_FMT))
                .appointmentType(apt.getAttribute())
                .dentistId(dentist != null ? dentist.getId() : null)
                .dentistName(dentist != null ? dentist.getFullName() : "")
                .content(apt.getReason())
                .notes(apt.getNotes())
                .status(apt.getStatus().name())
                .statusLabel(mapAppointmentStatusToLabel(apt.getStatus()))
                .build();
    }

    private String mapAppointmentStatusToLabel(StatusAppointment status) {
        if (status == null) return "Chưa đến";
        return switch (status) {
            case PENDING, CONFIRMED -> "Chưa đến";
            case IN_PROGRESS -> "Đang điều trị";
            case WAITING -> "Đã hẹn lại";
            case CALLED -> "Đã gọi";
            case COMPLETED -> "Đã xong";
            case CANCELLED -> "Đã hủy";
        };
    }

    private StatusAppointment mapLabelToAppointmentStatus(String label) {
        if (label == null || label.isBlank()) return StatusAppointment.PENDING;
        String l = label.trim().toLowerCase();
        if (l.contains("chưa đến") || l.contains("pending") || l.contains("chưa") || l.contains("xác nhận")) return StatusAppointment.PENDING;
        if (l.contains("đang điều trị") || l.contains("in_progress") || l.contains("tiến hành")) return StatusAppointment.IN_PROGRESS;
        if (l.contains("hẹn lại") || l.contains("waiting") || l.contains("chờ")) return StatusAppointment.WAITING;
        if (l.contains("hoàn thành") || l.contains("completed") || l.contains("xong")) return StatusAppointment.COMPLETED;
        if (l.contains("hủy") || l.contains("cancelled")) return StatusAppointment.CANCELLED;
        return StatusAppointment.PENDING;
    }

    private boolean matchesCity(String address, String city) {
        if (address == null || city == null) return false;
        String addrLower = address.toLowerCase();
        String cityLower = city.toLowerCase();
        if (addrLower.contains(cityLower)) return true;
        if (cityLower.contains("hồ chí minh") || cityLower.contains("hcm") || cityLower.contains("sài gòn")) {
            return addrLower.contains("hồ chí minh") || addrLower.contains("hcm") || addrLower.contains("tp.hcm") || addrLower.contains("saigon") || addrLower.contains("sài gòn");
        }
        if (cityLower.contains("hà nội")) {
            return addrLower.contains("hà nội") || addrLower.contains("hn");
        }
        if (cityLower.contains("đà nẵng")) {
            return addrLower.contains("đà nẵng") || addrLower.contains("da nang");
        }
        if (cityLower.contains("cần thơ")) {
            return addrLower.contains("cần thơ");
        }
        if (cityLower.contains("hải phòng")) {
            return addrLower.contains("hải phòng");
        }
        return false;
    }

    private boolean matchesDistrict(String address, String district) {
        if (address == null || district == null) return false;
        String addrLower = address.toLowerCase();
        String distLower = district.toLowerCase();
        if (addrLower.contains(distLower)) return true;
        if (distLower.startsWith("quận ") || distLower.startsWith("huyện ")) {
            String shortName = distLower.replace("quận ", "").replace("huyện ", "").trim();
            if (addrLower.contains("q." + shortName) || addrLower.contains("q" + shortName) || addrLower.contains("district " + shortName)) {
                return true;
            }
        }
        return false;
    }

    private String extractCityFromAddress(String address) {
        if (address == null || address.isBlank()) return "TP. Hồ Chí Minh";
        if (matchesCity(address, "Hà Nội")) return "Hà Nội";
        if (matchesCity(address, "Đà Nẵng")) return "Đà Nẵng";
        if (matchesCity(address, "Cần Thơ")) return "Cần Thơ";
        if (matchesCity(address, "Hải Phòng")) return "Hải Phòng";
        return "TP. Hồ Chí Minh";
    }

    private String extractDistrictFromAddress(String address) {
        if (address == null || address.isBlank()) return "Quận 1";
        String[] knownDistricts = {"Quận 1", "Quận 2", "Quận 3", "Quận 4", "Quận 5", "Quận 6", "Quận 7", "Quận 8", "Quận 9", "Quận 10", "Quận 11", "Quận 12", "Bình Thạnh", "Gò Vấp", "TP. Thủ Đức", "Phú Nhuận", "Tân Bình", "Tân Phú", "Bình Tân", "Nhà Bè", "Hóc Môn", "Củ Chi", "Bình Chánh", "Cần Giờ"};
        for (String d : knownDistricts) {
            if (matchesDistrict(address, d)) return d;
        }
        return "Quận 1";
    }

    private boolean matchesProcedureGroup(String reason, String group) {
        if (reason == null || group == null) return false;
        String r = reason.toLowerCase();
        String g = group.toLowerCase();
        if (g.contains("niềng") || g.contains("chỉnh nha")) {
            return r.contains("niềng") || r.contains("chỉnh nha") || r.contains("mắc cài") || r.contains("invisalign") || r.contains("khí cụ");
        }
        if (g.contains("implant")) {
            return r.contains("implant") || r.contains("all-on") || r.contains("cấy ghép");
        }
        if (g.contains("sứ") || g.contains("thẩm mỹ")) {
            return r.contains("sứ") || r.contains("veneer") || r.contains("zirconia") || r.contains("cercon") || r.contains("crown");
        }
        if (g.contains("nhổ") || g.contains("tiểu phẫu")) {
            return r.contains("nhổ") || r.contains("răng khôn") || r.contains("tiểu phẫu") || r.contains("piezotome");
        }
        if (g.contains("tủy")) {
            return r.contains("tủy") || r.contains("nội nha");
        }
        if (g.contains("tẩy trắng")) {
            return r.contains("tẩy trắng") || r.contains("bleach") || r.contains("laser") || r.contains("plasma");
        }
        if (g.contains("tổng quát")) {
            return r.contains("tổng quát") || r.contains("cao răng") || r.contains("trám") || r.contains("vệ sinh") || r.contains("khám");
        }
        return r.contains(g);
    }

    private String determineProcedureGroup(String procedureName) {
        if (procedureName == null || procedureName.isBlank()) return "Nha khoa tổng quát";
        String p = procedureName.toLowerCase();
        if (p.contains("niềng") || p.contains("chỉnh nha") || p.contains("mắc cài") || p.contains("invisalign")) return "Niềng răng - Chỉnh nha";
        if (p.contains("implant") || p.contains("all-on") || p.contains("cấy ghép")) return "Cấy ghép Implant";
        if (p.contains("sứ") || p.contains("veneer") || p.contains("zirconia") || p.contains("cercon")) return "Răng sứ thẩm mỹ";
        if (p.contains("nhổ") || p.contains("răng khôn") || p.contains("tiểu phẫu")) return "Nhổ răng & Tiểu phẫu";
        if (p.contains("tủy") || p.contains("nội nha")) return "Điều trị tủy";
        if (p.contains("tẩy trắng") || p.contains("laser whitening")) return "Tẩy trắng răng";
        return "Nha khoa tổng quát";
    }
}


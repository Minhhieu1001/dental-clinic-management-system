package iuh.fit.backend.dashboard.service.impl;

import iuh.fit.backend.dashboard.dto.*;
import iuh.fit.backend.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final JdbcTemplate jdbcTemplate;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DISPLAY_DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public record ResolvedPeriod(
            LocalDateTime startDate,
            LocalDateTime endDate,
            LocalDateTime prevStartDate,
            LocalDateTime prevEndDate,
            String label,
            String groupBy // "DAY" or "MONTH"
    ) {}

    public ResolvedPeriod resolvePeriod(DashboardFilterRequest filter) {
        String filterType = filter != null && filter.getFilterType() != null
                ? filter.getFilterType().trim().toUpperCase()
                : "YEAR"; // Default to YEAR to show rich 2026 data

        int defaultYear = 2026;
        int targetYear = (filter != null && filter.getYear() != null && filter.getYear() > 0)
                ? filter.getYear()
                : defaultYear;

        LocalDateTime start;
        LocalDateTime end;
        LocalDateTime prevStart;
        LocalDateTime prevEnd;
        String label;
        String groupBy;

        switch (filterType) {
            case "TODAY": {
                LocalDate today = LocalDate.now();
                start = today.atStartOfDay();
                end = today.atTime(LocalTime.MAX);
                prevStart = start.minusDays(1);
                prevEnd = end.minusDays(1);
                label = "Hôm nay (" + today.format(DISPLAY_DATE_FMT) + ")";
                groupBy = "DAY";
                break;
            }
            case "DAY": {
                LocalDate targetDate = filter != null && filter.getDate() != null
                        ? filter.getDate()
                        : LocalDate.of(targetYear, 10, 20);
                start = targetDate.atStartOfDay();
                end = targetDate.atTime(LocalTime.MAX);
                prevStart = start.minusDays(1);
                prevEnd = end.minusDays(1);
                label = "Ngày " + targetDate.format(DISPLAY_DATE_FMT);
                groupBy = "DAY";
                break;
            }
            case "LAST_7_DAYS": {
                LocalDate today = filter != null && filter.getDate() != null ? filter.getDate() : LocalDate.of(targetYear, 10, 20);
                start = today.minusDays(6).atStartOfDay();
                end = today.atTime(LocalTime.MAX);
                prevStart = start.minusDays(7);
                prevEnd = start.minusNanos(1);
                label = "7 ngày qua (" + start.format(DISPLAY_DATE_FMT) + " - " + end.format(DISPLAY_DATE_FMT) + ")";
                groupBy = "DAY";
                break;
            }
            case "LAST_30_DAYS": {
                LocalDate today = filter != null && filter.getDate() != null ? filter.getDate() : LocalDate.of(targetYear, 10, 20);
                start = today.minusDays(29).atStartOfDay();
                end = today.atTime(LocalTime.MAX);
                prevStart = start.minusDays(30);
                prevEnd = start.minusNanos(1);
                label = "30 ngày qua (" + start.format(DISPLAY_DATE_FMT) + " - " + end.format(DISPLAY_DATE_FMT) + ")";
                groupBy = "DAY";
                break;
            }
            case "MONTH": {
                int month = (filter != null && filter.getMonth() != null && filter.getMonth() >= 1 && filter.getMonth() <= 12)
                        ? filter.getMonth()
                        : 10;
                YearMonth ym = YearMonth.of(targetYear, month);
                start = ym.atDay(1).atStartOfDay();
                end = ym.atEndOfMonth().atTime(LocalTime.MAX);

                YearMonth prevYm = ym.minusMonths(1);
                prevStart = prevYm.atDay(1).atStartOfDay();
                prevEnd = prevYm.atEndOfMonth().atTime(LocalTime.MAX);

                label = "Tháng " + month + "/" + targetYear;
                groupBy = "DAY";
                break;
            }
            case "QUARTER": {
                int q = (filter != null && filter.getQuarter() != null && filter.getQuarter() >= 1 && filter.getQuarter() <= 4)
                        ? filter.getQuarter()
                        : (filter != null && filter.getMonth() != null ? (filter.getMonth() - 1) / 3 + 1 : 4);
                int startMonth = (q - 1) * 3 + 1;
                int endMonth = startMonth + 2;
                start = YearMonth.of(targetYear, startMonth).atDay(1).atStartOfDay();
                end = YearMonth.of(targetYear, endMonth).atEndOfMonth().atTime(LocalTime.MAX);

                int prevQ = q > 1 ? q - 1 : 4;
                int prevYear = q > 1 ? targetYear : targetYear - 1;
                int pStartMonth = (prevQ - 1) * 3 + 1;
                int pEndMonth = pStartMonth + 2;
                prevStart = YearMonth.of(prevYear, pStartMonth).atDay(1).atStartOfDay();
                prevEnd = YearMonth.of(prevYear, pEndMonth).atEndOfMonth().atTime(LocalTime.MAX);

                label = "Quý " + q + "/" + targetYear;
                groupBy = "MONTH";
                break;
            }
            case "CUSTOM": {
                LocalDate sDate = filter != null && filter.getStartDate() != null ? filter.getStartDate() : LocalDate.of(targetYear, 1, 1);
                LocalDate eDate = filter != null && filter.getEndDate() != null ? filter.getEndDate() : LocalDate.of(targetYear, 12, 31);
                if (sDate.isAfter(eDate)) {
                    LocalDate tmp = sDate;
                    sDate = eDate;
                    eDate = tmp;
                }
                start = sDate.atStartOfDay();
                end = eDate.atTime(LocalTime.MAX);
                long days = ChronoUnit.DAYS.between(sDate, eDate) + 1;
                prevStart = start.minusDays(days);
                prevEnd = end.minusDays(days);
                label = sDate.format(DISPLAY_DATE_FMT) + " - " + eDate.format(DISPLAY_DATE_FMT);
                groupBy = days > 60 ? "MONTH" : "DAY";
                break;
            }
            case "ALL":
            case "YEAR":
            default: {
                start = YearMonth.of(targetYear, 1).atDay(1).atStartOfDay();
                end = YearMonth.of(targetYear, 12).atEndOfMonth().atTime(LocalTime.MAX);
                prevStart = YearMonth.of(targetYear - 1, 1).atDay(1).atStartOfDay();
                prevEnd = YearMonth.of(targetYear - 1, 12).atEndOfMonth().atTime(LocalTime.MAX);
                label = "Năm " + targetYear;
                groupBy = "MONTH";
                break;
            }
        }

        return new ResolvedPeriod(start, end, prevStart, prevEnd, label, groupBy);
    }

    private Double calculateGrowthRate(BigDecimal current, BigDecimal previous) {
        if (current == null) current = BigDecimal.ZERO;
        if (previous == null) previous = BigDecimal.ZERO;
        if (previous.compareTo(BigDecimal.ZERO) == 0) {
            return current.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0;
        }
        return current.subtract(previous)
                .divide(previous, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(1, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private Double calculateGrowthRateLong(Long current, Long previous) {
        if (current == null) current = 0L;
        if (previous == null) previous = 0L;
        if (previous == 0L) {
            return current > 0L ? 100.0 : 0.0;
        }
        double val = ((double) (current - previous) / previous) * 100.0;
        return Math.round(val * 10.0) / 10.0;
    }

    // =========================================================================
    // 1. OVERVIEW
    // =========================================================================
    @Override
    public DashboardOverviewResponse getOverview(DashboardFilterRequest filter) {
        ResolvedPeriod period = resolvePeriod(filter);
        Timestamp startTs = Timestamp.valueOf(period.startDate());
        Timestamp endTs = Timestamp.valueOf(period.endDate());
        Timestamp pStartTs = Timestamp.valueOf(period.prevStartDate());
        Timestamp pEndTs = Timestamp.valueOf(period.prevEndDate());

        // 1. Revenue Summary
        String invSql = """
            SELECT
                COUNT(id) AS total_invoices,
                COALESCE(SUM(final_amount), 0) AS invoice_revenue,
                COALESCE(SUM(remaining_amount), 0) AS remaining_debt
            FROM invoices
            WHERE invoice_date BETWEEN ? AND ?
        """;
        var invData = jdbcTemplate.queryForMap(invSql, startTs, endTs);
        Long totalInvoices = ((Number) invData.get("total_invoices")).longValue();
        BigDecimal invoiceRevenue = (BigDecimal) invData.get("invoice_revenue");
        BigDecimal remainingDebt = (BigDecimal) invData.get("remaining_debt");

        var prevInvData = jdbcTemplate.queryForMap(invSql, pStartTs, pEndTs);
        BigDecimal prevInvoiceRevenue = (BigDecimal) prevInvData.get("invoice_revenue");

        String paySql = """
            SELECT
                COALESCE(SUM(total_amount), 0) AS actual_collected,
                COALESCE(SUM(service_amount), 0) AS service_amount,
                COALESCE(SUM(medicine_amount), 0) AS medicine_amount
            FROM payment_transactions
            WHERE status = 'SUCCESS' AND payment_time BETWEEN ? AND ?
        """;
        var payData = jdbcTemplate.queryForMap(paySql, startTs, endTs);
        BigDecimal actualCollected = (BigDecimal) payData.get("actual_collected");
        BigDecimal serviceAmount = (BigDecimal) payData.get("service_amount");
        BigDecimal medicineAmount = (BigDecimal) payData.get("medicine_amount");
        BigDecimal otherAmount = actualCollected.subtract(serviceAmount).subtract(medicineAmount).max(BigDecimal.ZERO);

        var prevPayData = jdbcTemplate.queryForMap(paySql, pStartTs, pEndTs);
        BigDecimal prevActual = (BigDecimal) prevPayData.get("actual_collected");

        var revenueSummary = DashboardOverviewResponse.RevenueSummary.builder()
                .totalInvoices(totalInvoices)
                .invoiceRevenue(invoiceRevenue)
                .actualCollected(actualCollected)
                .remainingDebt(remainingDebt)
                .revenueGrowthRate(calculateGrowthRate(invoiceRevenue, prevInvoiceRevenue))
                .actualGrowthRate(calculateGrowthRate(actualCollected, prevActual))
                .serviceAmount(serviceAmount)
                .medicineAmount(medicineAmount)
                .otherAmount(otherAmount)
                .build();

        // 2. Staff Summary
        Long totalDoctors = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM dentists", Long.class);
        Long totalEmployees = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM employees", Long.class);
        Long totalReceptions = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM employees WHERE position = 'RECEPTIONIST'", Long.class);

        var staffSummary = DashboardOverviewResponse.StaffSummary.builder()
                .totalStaff(totalDoctors + totalEmployees)
                .totalDoctors(totalDoctors)
                .totalEmployees(totalEmployees)
                .totalReceptionists(totalReceptions)
                .build();

        // 3. Medicine Summary
        Long totalMedicinesCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM medicines", Long.class);
        String medUsageSql = """
            SELECT
                COUNT(DISTINCT pd.medicine_id) AS used_types,
                COALESCE(SUM(pd.quantity), 0) AS units_dispensed,
                COALESCE(SUM(pd.quantity * COALESCE(pd.unit_price, m.price, 0)), 0) AS total_revenue
            FROM prescription_details pd
            JOIN prescriptions p ON pd.prescription_id = p.id
            JOIN medicines m ON pd.medicine_id = m.id
            WHERE p.prescription_date BETWEEN ? AND ?
        """;
        var medData = jdbcTemplate.queryForMap(medUsageSql, startTs, endTs);
        Long lowStockCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM medicines WHERE stock_quantity < 30", Long.class);

        var medicineSummary = DashboardOverviewResponse.MedicineSummary.builder()
                .totalMedicinesCount(totalMedicinesCount)
                .totalUsedCount(((Number) medData.get("used_types")).longValue())
                .totalUnitsDispensed(((Number) medData.get("units_dispensed")).longValue())
                .totalRevenue((BigDecimal) medData.get("total_revenue"))
                .lowStockCount(lowStockCount)
                .build();

        // 4. Service Summary
        Long totalServices = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM services WHERE is_active = true", Long.class);
        String srvUsageSql = """
            SELECT
                COALESCE(SUM(idt.quantity), 0) AS total_usage,
                COALESCE(SUM(idt.subtotal), 0) AS total_revenue
            FROM invoice_details idt
            JOIN invoices i ON idt.invoice_id = i.id
            WHERE i.invoice_date BETWEEN ? AND ?
        """;
        var srvData = jdbcTemplate.queryForMap(srvUsageSql, startTs, endTs);
        var prevSrvData = jdbcTemplate.queryForMap(srvUsageSql, pStartTs, pEndTs);
        BigDecimal currentSrvRev = (BigDecimal) srvData.get("total_revenue");
        BigDecimal prevSrvRev = (BigDecimal) prevSrvData.get("total_revenue");

        var serviceSummary = DashboardOverviewResponse.ServiceSummary.builder()
                .totalServices(totalServices)
                .totalUsageCount(((Number) srvData.get("total_usage")).longValue())
                .totalRevenue(currentSrvRev)
                .growthRate(calculateGrowthRate(currentSrvRev, prevSrvRev))
                .build();

        // 5. Promotion Summary
        Long totalPromotions = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM promotions", Long.class);
        Long activePromotions = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM promotions WHERE status = 'ACTIVE'", Long.class);
        String promoSql = """
            SELECT
                COUNT(id) AS promo_invoices,
                COALESCE(SUM(discount_amount), 0) AS total_discount
            FROM invoices
            WHERE (promotion_id IS NOT NULL OR discount_amount > 0)
              AND invoice_date BETWEEN ? AND ?
        """;
        var promoData = jdbcTemplate.queryForMap(promoSql, startTs, endTs);
        Long promoInvoices = ((Number) promoData.get("promo_invoices")).longValue();

        var promotionSummary = DashboardOverviewResponse.PromotionSummary.builder()
                .totalPromotions(totalPromotions)
                .activePromotions(activePromotions)
                .totalUsageCount(promoInvoices)
                .totalInvoicesApplied(promoInvoices)
                .totalDiscountAmount((BigDecimal) promoData.get("total_discount"))
                .build();

        // 6. Appointment Summary
        String apptSql = """
            SELECT
                COUNT(id) AS total,
                COUNT(id) FILTER (WHERE status = 'COMPLETED') AS completed,
                COUNT(id) FILTER (WHERE status = 'CANCELLED') AS cancelled,
                COUNT(id) FILTER (WHERE status = 'CONFIRMED') AS confirmed
            FROM appointments
            WHERE appointment_date BETWEEN ? AND ?
        """;
        var apptData = jdbcTemplate.queryForMap(apptSql, startTs, endTs);
        Long apptTotal = ((Number) apptData.get("total")).longValue();
        Long apptCompleted = ((Number) apptData.get("completed")).longValue();
        Long apptCancelled = ((Number) apptData.get("cancelled")).longValue();
        Long apptConfirmed = ((Number) apptData.get("confirmed")).longValue();

        var prevApptData = jdbcTemplate.queryForMap(apptSql, pStartTs, pEndTs);
        Long prevApptTotal = ((Number) prevApptData.get("total")).longValue();

        double compRate = apptTotal > 0 ? Math.round(((double) apptCompleted / apptTotal) * 1000.0) / 10.0 : 0.0;
        double cancRate = apptTotal > 0 ? Math.round(((double) apptCancelled / apptTotal) * 1000.0) / 10.0 : 0.0;

        var appointmentSummary = DashboardOverviewResponse.AppointmentSummary.builder()
                .totalAppointments(apptTotal)
                .completedAppointments(apptCompleted)
                .cancelledAppointments(apptCancelled)
                .confirmedAppointments(apptConfirmed)
                .completionRate(compRate)
                .cancellationRate(cancRate)
                .growthRate(calculateGrowthRateLong(apptTotal, prevApptTotal))
                .build();

        return DashboardOverviewResponse.builder()
                .periodLabel(period.label())
                .startDate(period.startDate())
                .endDate(period.endDate())
                .revenue(revenueSummary)
                .staff(staffSummary)
                .medicines(medicineSummary)
                .services(serviceSummary)
                .promotions(promotionSummary)
                .appointments(appointmentSummary)
                .build();
    }

    // =========================================================================
    // 2. REVENUE DASHBOARD
    // =========================================================================
    @Override
    public RevenueDashboardResponse getRevenueDashboard(DashboardFilterRequest filter) {
        ResolvedPeriod period = resolvePeriod(filter);
        Timestamp startTs = Timestamp.valueOf(period.startDate());
        Timestamp endTs = Timestamp.valueOf(period.endDate());
        Timestamp pStartTs = Timestamp.valueOf(period.prevStartDate());
        Timestamp pEndTs = Timestamp.valueOf(period.prevEndDate());

        // Invoices summary
        String invSql = """
            SELECT
                COUNT(id) AS total_invoices,
                COALESCE(SUM(total_amount), 0) AS total_amount,
                COALESCE(SUM(discount_amount), 0) AS discount_amount,
                COALESCE(SUM(final_amount), 0) AS invoice_revenue,
                COALESCE(SUM(remaining_amount), 0) AS remaining_debt
            FROM invoices
            WHERE invoice_date BETWEEN ? AND ?
        """;
        var invData = jdbcTemplate.queryForMap(invSql, startTs, endTs);
        Long totalInvoices = ((Number) invData.get("total_invoices")).longValue();
        BigDecimal totalAmount = (BigDecimal) invData.get("total_amount");
        BigDecimal discountAmount = (BigDecimal) invData.get("discount_amount");
        BigDecimal invoiceRevenue = (BigDecimal) invData.get("invoice_revenue");
        BigDecimal remainingDebt = (BigDecimal) invData.get("remaining_debt");

        var prevInvData = jdbcTemplate.queryForMap(invSql, pStartTs, pEndTs);
        Long prevTotalInvoices = ((Number) prevInvData.get("total_invoices")).longValue();
        BigDecimal prevInvoiceRevenue = (BigDecimal) prevInvData.get("invoice_revenue");
        BigDecimal prevDebt = (BigDecimal) prevInvData.get("remaining_debt");

        // Payments summary
        String paySql = """
            SELECT
                COALESCE(SUM(total_amount), 0) AS actual_collected,
                COALESCE(SUM(service_amount), 0) AS service_amount,
                COALESCE(SUM(medicine_amount), 0) AS medicine_amount
            FROM payment_transactions
            WHERE status = 'SUCCESS' AND payment_time BETWEEN ? AND ?
        """;
        var payData = jdbcTemplate.queryForMap(paySql, startTs, endTs);
        BigDecimal actualCollected = (BigDecimal) payData.get("actual_collected");
        BigDecimal serviceAmount = (BigDecimal) payData.get("service_amount");
        BigDecimal medicineAmount = (BigDecimal) payData.get("medicine_amount");
        BigDecimal otherAmount = actualCollected.subtract(serviceAmount).subtract(medicineAmount).max(BigDecimal.ZERO);

        var prevPayData = jdbcTemplate.queryForMap(paySql, pStartTs, pEndTs);
        BigDecimal prevActual = (BigDecimal) prevPayData.get("actual_collected");

        // Trend points
        boolean isDayGroup = "DAY".equalsIgnoreCase(period.groupBy());
        String datePattern = isDayGroup ? "YYYY-MM-DD" : "YYYY-MM";

        String trendInvSql = String.format("""
            SELECT
                TO_CHAR(invoice_date, '%s') AS d_key,
                COALESCE(SUM(final_amount), 0) AS rev,
                COALESCE(SUM(remaining_amount), 0) AS debt,
                COUNT(id) AS cnt
            FROM invoices
            WHERE invoice_date BETWEEN ? AND ?
            GROUP BY TO_CHAR(invoice_date, '%s')
            ORDER BY d_key ASC
        """, datePattern, datePattern);

        String trendPaySql = String.format("""
            SELECT
                TO_CHAR(payment_time, '%s') AS d_key,
                COALESCE(SUM(total_amount), 0) AS collected
            FROM payment_transactions
            WHERE status = 'SUCCESS' AND payment_time BETWEEN ? AND ?
            GROUP BY TO_CHAR(payment_time, '%s')
            ORDER BY d_key ASC
        """, datePattern, datePattern);

        Map<String, RevenueDashboardResponse.RevenueTrendPoint> trendMap = new TreeMap<>();
        jdbcTemplate.query(trendInvSql, (rs, rowNum) -> {
            String key = rs.getString("d_key");
            String label = isDayGroup && key.length() >= 10
                    ? key.substring(8, 10) + "/" + key.substring(5, 7)
                    : (key.length() >= 7 ? "Tháng " + key.substring(5, 7) : key);
            trendMap.put(key, RevenueDashboardResponse.RevenueTrendPoint.builder()
                    .dateKey(key)
                    .label(label)
                    .invoiceRevenue(rs.getBigDecimal("rev"))
                    .remainingDebt(rs.getBigDecimal("debt"))
                    .invoiceCount(rs.getLong("cnt"))
                    .actualCollected(BigDecimal.ZERO)
                    .build());
            return null;
        }, startTs, endTs);

        jdbcTemplate.query(trendPaySql, (rs, rowNum) -> {
            String key = rs.getString("d_key");
            BigDecimal collected = rs.getBigDecimal("collected");
            if (trendMap.containsKey(key)) {
                trendMap.get(key).setActualCollected(collected);
            } else {
                String label = isDayGroup && key.length() >= 10
                        ? key.substring(8, 10) + "/" + key.substring(5, 7)
                        : (key.length() >= 7 ? "Tháng " + key.substring(5, 7) : key);
                trendMap.put(key, RevenueDashboardResponse.RevenueTrendPoint.builder()
                        .dateKey(key)
                        .label(label)
                        .invoiceRevenue(BigDecimal.ZERO)
                        .remainingDebt(BigDecimal.ZERO)
                        .invoiceCount(0L)
                        .actualCollected(collected)
                        .build());
            }
            return null;
        }, startTs, endTs);

        List<RevenueDashboardResponse.RevenueTrendPoint> trendList = new ArrayList<>(trendMap.values());

        // Payment Methods
        String methodSql = """
            SELECT
                payment_method,
                COUNT(*) AS cnt,
                COALESCE(SUM(total_amount), 0) AS amt
            FROM payment_transactions
            WHERE status = 'SUCCESS' AND payment_time BETWEEN ? AND ?
            GROUP BY payment_method
            ORDER BY amt DESC
        """;
        List<RevenueDashboardResponse.PaymentMethodStat> paymentMethods = jdbcTemplate.query(methodSql, (rs, rowNum) -> {
            String method = rs.getString("payment_method");
            BigDecimal amt = rs.getBigDecimal("amt");
            long cnt = rs.getLong("cnt");
            double pct = actualCollected.compareTo(BigDecimal.ZERO) > 0
                    ? amt.divide(actualCollected, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                    : 0.0;
            String name = switch (method != null ? method : "") {
                case "CASH" -> "Tiền mặt";
                case "BANK_TRANSFER" -> "Chuyển khoản";
                case "CREDIT_CARD" -> "Thẻ tín dụng";
                case "MOMO" -> "Ví MoMo";
                case "VNPAY" -> "VNPay QR";
                default -> method != null ? method : "Khác";
            };
            return RevenueDashboardResponse.PaymentMethodStat.builder()
                    .method(method)
                    .methodName(name)
                    .count(cnt)
                    .amount(amt)
                    .percentage(Math.round(pct * 10.0) / 10.0)
                    .build();
        }, startTs, endTs);

        // Invoice Statuses
        String statusSql = """
            SELECT
                payment_status,
                COUNT(*) AS cnt,
                COALESCE(SUM(final_amount), 0) AS amt
            FROM invoices
            WHERE invoice_date BETWEEN ? AND ?
            GROUP BY payment_status
        """;
        List<RevenueDashboardResponse.InvoiceStatusStat> invoiceStatuses = jdbcTemplate.query(statusSql, (rs, rowNum) -> {
            String st = rs.getString("payment_status");
            String stName = switch (st != null ? st : "") {
                case "PAID" -> "Đã thanh toán";
                case "PARTIALLY_PAID" -> "Thanh toán một phần";
                case "UNPAID" -> "Chưa thanh toán";
                case "CANCELLED" -> "Đã hủy";
                default -> st;
            };
            return RevenueDashboardResponse.InvoiceStatusStat.builder()
                    .status(st)
                    .statusName(stName)
                    .count(rs.getLong("cnt"))
                    .amount(rs.getBigDecimal("amt"))
                    .build();
        }, startTs, endTs);

        // Recent Payments
        String recentSql = """
            SELECT
                pt.id,
                pt.transaction_code,
                i.invoice_code,
                p.full_name AS patient_name,
                pt.total_amount,
                pt.payment_method,
                pt.status,
                pt.payment_time,
                e.full_name AS cashier_name
            FROM payment_transactions pt
            LEFT JOIN invoices i ON pt.invoice_id = i.id
            LEFT JOIN patients p ON i.patient_id = p.id
            LEFT JOIN employees e ON pt.employee_id = e.id
            WHERE pt.status = 'SUCCESS' AND pt.payment_time BETWEEN ? AND ?
            ORDER BY pt.payment_time DESC
            LIMIT 100
        """;
        List<RevenueDashboardResponse.RecentPaymentItem> recentPayments = jdbcTemplate.query(recentSql, (rs, rowNum) ->
            RevenueDashboardResponse.RecentPaymentItem.builder()
                    .id(rs.getString("id"))
                    .transactionCode(rs.getString("transaction_code"))
                    .invoiceCode(rs.getString("invoice_code"))
                    .patientName(rs.getString("patient_name") != null ? rs.getString("patient_name") : "Khách lẻ")
                    .amount(rs.getBigDecimal("total_amount"))
                    .paymentMethod(rs.getString("payment_method"))
                    .status(rs.getString("status"))
                    .paymentTime(rs.getTimestamp("payment_time").toLocalDateTime())
                    .cashierName(rs.getString("cashier_name"))
                    .build()
        , startTs, endTs);

        return RevenueDashboardResponse.builder()
                .periodLabel(period.label())
                .startDate(period.startDate())
                .endDate(period.endDate())
                .totalInvoices(totalInvoices)
                .invoiceRevenue(invoiceRevenue)
                .actualCollected(actualCollected)
                .remainingDebt(remainingDebt)
                .invoiceCountGrowthRate(calculateGrowthRateLong(totalInvoices, prevTotalInvoices))
                .invoiceRevenueGrowthRate(calculateGrowthRate(invoiceRevenue, prevInvoiceRevenue))
                .actualCollectedGrowthRate(calculateGrowthRate(actualCollected, prevActual))
                .remainingDebtGrowthRate(calculateGrowthRate(remainingDebt, prevDebt))
                .totalAmount(totalAmount)
                .totalDiscount(discountAmount)
                .serviceAmount(serviceAmount)
                .medicineAmount(medicineAmount)
                .otherAmount(otherAmount)
                .trend(trendList)
                .paymentMethods(paymentMethods)
                .invoiceStatuses(invoiceStatuses)
                .recentPayments(recentPayments)
                .build();
    }

    // =========================================================================
    // 3. STAFF DASHBOARD
    // =========================================================================
    @Override
    public StaffDashboardResponse getStaffDashboard(DashboardFilterRequest filter) {
        ResolvedPeriod period = resolvePeriod(filter);
        Timestamp startTs = Timestamp.valueOf(period.startDate());
        Timestamp endTs = Timestamp.valueOf(period.endDate());

        Long totalDoctors = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM dentists", Long.class);
        Long totalEmployees = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM employees", Long.class);
        Long totalReceptions = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM employees WHERE position = 'RECEPTIONIST'", Long.class);
        Long totalWarehouse = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM employees WHERE position = 'WAREHOUSE'", Long.class);

        // Doctor stats
        String docSql = """
            SELECT
                d.id,
                d.full_name,
                u.phone,
                u.email,
                d.experience_years,
                (SELECT string_agg(s.name, ', ')
                 FROM dentist_specializations ds
                 JOIN specializations s ON ds.specialization_id = s.id
                 WHERE ds.dentist_id = d.id) AS specialization,
                (SELECT count(*)
                 FROM appointments a
                 WHERE a.dentist_id = d.id AND a.status = 'COMPLETED'
                   AND a.appointment_date BETWEEN ? AND ?) AS appts_completed,
                (SELECT count(*)
                 FROM examinations_result er
                 WHERE er.dentist_id = d.id
                   AND er.examination_date BETWEEN ? AND ?) AS exams_count,
                (SELECT count(*)
                 FROM treatment_plans tp
                 JOIN examinations_result er ON tp.examination_result_id = er.id
                 WHERE er.dentist_id = d.id AND tp.status = 'COMPLETED'
                   AND (tp.end_date BETWEEN ? AND ? OR tp.start_date BETWEEN ? AND ?)) AS treatments_completed,
                (SELECT COALESCE(SUM(i.final_amount), 0)
                 FROM invoices i
                 WHERE i.invoice_date BETWEEN ? AND ?
                   AND (
                        i.treatment_plan_id IN (
                            SELECT tp.id FROM treatment_plans tp
                            JOIN examinations_result er ON tp.examination_result_id = er.id
                            WHERE er.dentist_id = d.id
                        )
                        OR i.patient_id IN (
                            SELECT DISTINCT mr.patient_id FROM medical_records mr WHERE mr.dentist_id = d.id
                        )
                        OR i.patient_id IN (
                            SELECT p2.id FROM appointments a2
                            JOIN patients p2 ON a2.phone = p2.phone_number
                            WHERE a2.dentist_id = d.id
                        )
                   )
                ) AS service_revenue
            FROM dentists d
            LEFT JOIN users u ON d.user_id = u.id
            ORDER BY service_revenue DESC, appts_completed DESC
        """;

        List<StaffDashboardResponse.DoctorStatItem> doctors = jdbcTemplate.query(docSql, (rs, rowNum) -> {
            long appts = rs.getLong("appts_completed");
            long exams = rs.getLong("exams_count");
            long totalVisits = Math.max(appts, exams);
            if (totalVisits == 0 && (appts > 0 || exams > 0)) {
                totalVisits = appts + exams;
            }
            return StaffDashboardResponse.DoctorStatItem.builder()
                    .dentistId(rs.getString("id"))
                    .fullName(rs.getString("full_name"))
                    .phone(rs.getString("phone"))
                    .email(rs.getString("email"))
                    .specialization(rs.getString("specialization") != null ? rs.getString("specialization") : "Nha khoa tổng quát")
                    .experienceYears(rs.getInt("experience_years"))
                    .examCount(totalVisits)
                    .completedTreatments(rs.getLong("treatments_completed"))
                    .serviceRevenue(rs.getBigDecimal("service_revenue"))
                    .build();
        }, startTs, endTs, startTs, endTs, startTs, endTs, startTs, endTs, startTs, endTs);

        // Employee stats
        String empSql = """
            SELECT
                e.id,
                e.full_name,
                e.position,
                u.phone,
                u.email,
                (SELECT count(*)
                 FROM appointments a
                 WHERE a.employee_id = e.id AND a.appointment_date BETWEEN ? AND ?) AS appts_received,
                (SELECT count(*)
                 FROM payment_transactions pt
                 WHERE pt.employee_id = e.id AND pt.status = 'SUCCESS'
                   AND pt.payment_time BETWEEN ? AND ?) AS payments_handled,
                (SELECT COALESCE(SUM(pt.total_amount), 0)
                 FROM payment_transactions pt
                 WHERE pt.employee_id = e.id AND pt.status = 'SUCCESS'
                   AND pt.payment_time BETWEEN ? AND ?) AS total_assisted
            FROM employees e
            LEFT JOIN users u ON e.user_id = u.id
            ORDER BY total_assisted DESC, payments_handled DESC
        """;

        List<StaffDashboardResponse.EmployeeStatItem> employees = jdbcTemplate.query(empSql, (rs, rowNum) -> {
            String pos = rs.getString("position");
            String posLabel = switch (pos != null ? pos : "") {
                case "RECEPTIONIST" -> "Lễ tân phòng khám";
                case "WAREHOUSE" -> "Thủ kho vật tư";
                default -> pos;
            };
            return StaffDashboardResponse.EmployeeStatItem.builder()
                    .employeeId(rs.getString("id"))
                    .fullName(rs.getString("full_name"))
                    .position(pos)
                    .positionLabel(posLabel)
                    .phone(rs.getString("phone"))
                    .email(rs.getString("email"))
                    .appointmentsReceived(rs.getLong("appts_received"))
                    .invoicesAssisted(rs.getLong("payments_handled"))
                    .totalAssistedAmount(rs.getBigDecimal("total_assisted"))
                    .build();
        }, startTs, endTs, startTs, endTs, startTs, endTs);

        return StaffDashboardResponse.builder()
                .periodLabel(period.label())
                .startDate(period.startDate())
                .endDate(period.endDate())
                .totalStaff(totalDoctors + totalEmployees)
                .totalDoctors(totalDoctors)
                .totalEmployees(totalEmployees)
                .totalReceptionists(totalReceptions)
                .totalWarehouse(totalWarehouse)
                .doctors(doctors)
                .employees(employees)
                .build();
    }

    // =========================================================================
    // 4. MEDICINES & SUPPLIES DASHBOARD
    // =========================================================================
    @Override
    public MedicineDashboardResponse getMedicineDashboard(DashboardFilterRequest filter) {
        ResolvedPeriod period = resolvePeriod(filter);
        Timestamp startTs = Timestamp.valueOf(period.startDate());
        Timestamp endTs = Timestamp.valueOf(period.endDate());

        Long totalMedicinesCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM medicines", Long.class);
        Long lowStockCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM medicines WHERE stock_quantity < 30", Long.class);

        // Medicines usage query
        String medSql = """
            SELECT
                m.id,
                m.code,
                m.name,
                m.unit,
                m.manufacturer,
                m.stock_quantity,
                m.price,
                COALESCE(usage.qty_used, 0) AS qty_used,
                COALESCE(usage.total_rev, 0) AS total_rev,
                COALESCE(usage.prescription_cnt, 0) AS prescription_cnt
            FROM medicines m
            LEFT JOIN (
                SELECT
                    pd.medicine_id,
                    SUM(pd.quantity) AS qty_used,
                    SUM(pd.quantity * COALESCE(pd.unit_price, m2.price, 0)) AS total_rev,
                    COUNT(DISTINCT p.id) AS prescription_cnt
                FROM prescription_details pd
                JOIN prescriptions p ON pd.prescription_id = p.id
                JOIN medicines m2 ON pd.medicine_id = m2.id
                WHERE p.prescription_date BETWEEN ? AND ?
                GROUP BY pd.medicine_id
            ) usage ON m.id = usage.medicine_id
            ORDER BY usage.total_rev DESC NULLS LAST, usage.qty_used DESC NULLS LAST, m.name ASC
        """;

        List<MedicineDashboardResponse.MedicineUsageItem> medicines = jdbcTemplate.query(medSql, (rs, rowNum) ->
            MedicineDashboardResponse.MedicineUsageItem.builder()
                    .medicineId(rs.getString("id"))
                    .code(rs.getString("code") != null ? rs.getString("code") : "MED-" + (rowNum + 1))
                    .name(rs.getString("name"))
                    .unit(rs.getString("unit"))
                    .manufacturer(rs.getString("manufacturer"))
                    .stockQuantity(rs.getInt("stock_quantity"))
                    .price(rs.getBigDecimal("price"))
                    .quantityUsed(rs.getLong("qty_used"))
                    .totalRevenue(rs.getBigDecimal("total_rev"))
                    .prescriptionCount(rs.getLong("prescription_cnt"))
                    .build()
        , startTs, endTs);

        long usedCount = medicines.stream().filter(m -> m.getQuantityUsed() > 0).count();
        long totalUnits = medicines.stream().mapToLong(MedicineDashboardResponse.MedicineUsageItem::getQuantityUsed).sum();
        BigDecimal totalRev = medicines.stream()
                .map(MedicineDashboardResponse.MedicineUsageItem::getTotalRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Supplies query
        String supSql = """
            SELECT
                s.id,
                s.supplies_name,
                s.unit,
                s.stock_quantity,
                s.min_stock,
                COALESCE(it.exported_qty, 0) AS exported_qty
            FROM supplies s
            LEFT JOIN (
                SELECT
                    supply_id,
                    SUM(quantity) AS exported_qty
                FROM inventory_transactions
                WHERE transaction_type = 'EXPORT' AND created_at BETWEEN ? AND ?
                GROUP BY supply_id
            ) it ON s.id = it.supply_id
            ORDER BY s.stock_quantity ASC
        """;

        List<MedicineDashboardResponse.SupplyStockItem> supplies = jdbcTemplate.query(supSql, (rs, rowNum) ->
            MedicineDashboardResponse.SupplyStockItem.builder()
                    .supplyId(rs.getString("id"))
                    .suppliesName(rs.getString("supplies_name"))
                    .unit(rs.getString("unit"))
                    .stockQuantity(rs.getInt("stock_quantity"))
                    .minStock(rs.getInt("min_stock"))
                    .exportedQuantity(rs.getLong("exported_qty"))
                    .build()
        , startTs, endTs);

        return MedicineDashboardResponse.builder()
                .periodLabel(period.label())
                .startDate(period.startDate())
                .endDate(period.endDate())
                .totalMedicinesCount(totalMedicinesCount)
                .totalMedicinesUsedCount(usedCount)
                .totalUnitsDispensed(totalUnits)
                .totalMedicineRevenue(totalRev)
                .lowStockCount(lowStockCount)
                .medicines(medicines)
                .supplies(supplies)
                .build();
    }

    // =========================================================================
    // 5. SERVICE DASHBOARD
    // =========================================================================
    @Override
    public ServiceDashboardResponse getServiceDashboard(DashboardFilterRequest filter) {
        ResolvedPeriod period = resolvePeriod(filter);
        Timestamp startTs = Timestamp.valueOf(period.startDate());
        Timestamp endTs = Timestamp.valueOf(period.endDate());
        Timestamp pStartTs = Timestamp.valueOf(period.prevStartDate());
        Timestamp pEndTs = Timestamp.valueOf(period.prevEndDate());

        Long totalServicesCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM services", Long.class);
        Long activeServicesCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM services WHERE is_active = true", Long.class);

        // Service usage in current period
        String srvSql = """
            SELECT
                COALESCE(s.id::text, '') AS service_id,
                COALESCE(s.service_code, 'DV') AS service_code,
                idt.item_name AS service_name,
                COALESCE(s.category::text, 'KHAM_DIEU_TRI') AS category,
                COALESCE(s.unit, 'Lần') AS unit,
                COALESCE(s.price, MAX(idt.unit_price)) AS base_price,
                SUM(idt.quantity) AS usage_count,
                SUM(idt.subtotal) AS total_revenue
            FROM invoice_details idt
            JOIN invoices i ON idt.invoice_id = i.id
            LEFT JOIN services s ON LOWER(TRIM(s.service_name)) = LOWER(TRIM(idt.item_name))
            WHERE i.invoice_date BETWEEN ? AND ?
            GROUP BY s.id, s.service_code, idt.item_name, s.category, s.unit, s.price
            ORDER BY total_revenue DESC
        """;

        String prevSrvSql = """
            SELECT
                idt.item_name AS service_name,
                SUM(idt.subtotal) AS prev_revenue,
                SUM(idt.quantity) AS prev_usage
            FROM invoice_details idt
            JOIN invoices i ON idt.invoice_id = i.id
            WHERE i.invoice_date BETWEEN ? AND ?
            GROUP BY idt.item_name
        """;

        Map<String, BigDecimal> prevRevMap = new HashMap<>();
        Map<String, Long> prevUsageMap = new HashMap<>();
        jdbcTemplate.query(prevSrvSql, (rs, rowNum) -> {
            String name = rs.getString("service_name");
            prevRevMap.put(name, rs.getBigDecimal("prev_revenue"));
            prevUsageMap.put(name, rs.getLong("prev_usage"));
            return null;
        }, pStartTs, pEndTs);

        List<ServiceDashboardResponse.ServiceUsageItem> services = jdbcTemplate.query(srvSql, (rs, rowNum) -> {
            String name = rs.getString("service_name");
            BigDecimal rev = rs.getBigDecimal("total_revenue");
            BigDecimal pRev = prevRevMap.getOrDefault(name, BigDecimal.ZERO);
            String cat = rs.getString("category");
            String catName = formatCategoryName(cat);

            return ServiceDashboardResponse.ServiceUsageItem.builder()
                    .serviceId(rs.getString("service_id"))
                    .serviceCode(rs.getString("service_code"))
                    .serviceName(name)
                    .category(cat)
                    .categoryName(catName)
                    .unit(rs.getString("unit"))
                    .basePrice(rs.getBigDecimal("base_price"))
                    .usageCount(rs.getLong("usage_count"))
                    .totalRevenue(rev)
                    .prevPeriodRevenue(pRev)
                    .growthPercent(calculateGrowthRate(rev, pRev))
                    .build();
        }, startTs, endTs);

        long totalUsage = services.stream().mapToLong(ServiceDashboardResponse.ServiceUsageItem::getUsageCount).sum();
        BigDecimal totalRev = services.stream()
                .map(ServiceDashboardResponse.ServiceUsageItem::getTotalRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal prevTotalRev = prevRevMap.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        long prevTotalUsage = prevUsageMap.values().stream().mapToLong(Long::longValue).sum();

        // Monthly service usage trend (dịch vụ được sử dụng trong từng tháng)
        int year = period.startDate().getYear();
        Timestamp yStart = Timestamp.valueOf(LocalDateTime.of(year, 1, 1, 0, 0, 0));
        Timestamp yEnd = Timestamp.valueOf(LocalDateTime.of(year, 12, 31, 23, 59, 59));

        String monthlySql = """
            SELECT
                TO_CHAR(i.invoice_date, 'YYYY-MM') AS month_key,
                COALESCE(SUM(idt.quantity), 0) AS usage_count,
                COALESCE(SUM(idt.subtotal), 0) AS revenue
            FROM invoice_details idt
            JOIN invoices i ON idt.invoice_id = i.id
            WHERE i.invoice_date BETWEEN ? AND ?
            GROUP BY TO_CHAR(i.invoice_date, 'YYYY-MM')
            ORDER BY month_key ASC
        """;

        List<ServiceDashboardResponse.MonthlyServiceStat> monthlyStats = jdbcTemplate.query(monthlySql, (rs, rowNum) -> {
            String mKey = rs.getString("month_key");
            String label = mKey.length() >= 7 ? "Thg " + mKey.substring(5, 7) : mKey;
            return ServiceDashboardResponse.MonthlyServiceStat.builder()
                    .monthKey(mKey)
                    .label(label)
                    .usageCount(rs.getLong("usage_count"))
                    .revenue(rs.getBigDecimal("revenue"))
                    .growthRate(0.0) // calculated below
                    .build();
        }, yStart, yEnd);

        // Calculate month-over-month growth for monthlyStats
        for (int i = 1; i < monthlyStats.size(); i++) {
            BigDecimal prevMRev = monthlyStats.get(i - 1).getRevenue();
            BigDecimal currMRev = monthlyStats.get(i).getRevenue();
            monthlyStats.get(i).setGrowthRate(calculateGrowthRate(currMRev, prevMRev));
        }

        // Category stats breakdown
        String catSql = """
            SELECT
                COALESCE(s.category::text, 'KHAC') AS category,
                COUNT(DISTINCT s.id) AS service_count,
                COALESCE(SUM(idt.quantity), 0) AS usage_count,
                COALESCE(SUM(idt.subtotal), 0) AS total_revenue
            FROM services s
            LEFT JOIN invoice_details idt ON LOWER(TRIM(s.service_name)) = LOWER(TRIM(idt.item_name))
            LEFT JOIN invoices i ON idt.invoice_id = i.id AND i.invoice_date BETWEEN ? AND ?
            GROUP BY s.category
            ORDER BY total_revenue DESC
        """;

        List<ServiceDashboardResponse.ServiceCategoryStat> categoryStats = jdbcTemplate.query(catSql, (rs, rowNum) -> {
            String cat = rs.getString("category");
            BigDecimal cRev = rs.getBigDecimal("total_revenue");
            double pct = totalRev.compareTo(BigDecimal.ZERO) > 0
                    ? cRev.divide(totalRev, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                    : 0.0;
            return ServiceDashboardResponse.ServiceCategoryStat.builder()
                    .category(cat)
                    .categoryName(formatCategoryName(cat))
                    .serviceCount(rs.getLong("service_count"))
                    .usageCount(rs.getLong("usage_count"))
                    .totalRevenue(cRev)
                    .percentage(Math.round(pct * 10.0) / 10.0)
                    .build();
        }, startTs, endTs);

        return ServiceDashboardResponse.builder()
                .periodLabel(period.label())
                .startDate(period.startDate())
                .endDate(period.endDate())
                .totalServicesCount(totalServicesCount)
                .activeServicesCount(activeServicesCount)
                .totalUsageCount(totalUsage)
                .totalServiceRevenue(totalRev)
                .prevServiceRevenue(prevTotalRev)
                .prevUsageCount(prevTotalUsage)
                .revenueGrowthPercent(calculateGrowthRate(totalRev, prevTotalRev))
                .usageGrowthPercent(calculateGrowthRateLong(totalUsage, prevTotalUsage))
                .monthlyStats(monthlyStats)
                .services(services)
                .categoryStats(categoryStats)
                .build();
    }

    private String formatCategoryName(String cat) {
        if (cat == null) return "Dịch vụ chung";
        return switch (cat.toUpperCase()) {
            case "NIENG_RANG" -> "Niềng răng - Chỉnh nha";
            case "RANG_SU" -> "Phục hình răng sứ";
            case "IMPLANT" -> "Cấy ghép Implant";
            case "TAY_TRANG" -> "Tẩy trắng răng";
            case "KHAM_DIEU_TRI" -> "Khám & Điều trị bệnh lý";
            case "NHA_KHOA_TRE_EM" -> "Nha khoa trẻ em";
            default -> cat;
        };
    }

    // =========================================================================
    // 6. PROMOTION DASHBOARD
    // =========================================================================
    @Override
    public PromotionDashboardResponse getPromotionDashboard(DashboardFilterRequest filter) {
        ResolvedPeriod period = resolvePeriod(filter);
        Timestamp startTs = Timestamp.valueOf(period.startDate());
        Timestamp endTs = Timestamp.valueOf(period.endDate());

        Long totalPromotions = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM promotions", Long.class);
        Long activePromotions = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM promotions WHERE status = 'ACTIVE'", Long.class);

        String promoSql = """
            SELECT
                p.id,
                p.title,
                p.coupon_code,
                p.promotion_type,
                p.discount_percent,
                p.discount_amount,
                p.start_date,
                p.end_date,
                p.status,
                COUNT(i.id) AS invoices_count,
                COALESCE(SUM(i.discount_amount), 0) AS total_discount,
                COALESCE(SUM(i.final_amount), 0) AS total_sales
            FROM promotions p
            LEFT JOIN invoices i ON i.promotion_id = p.id AND i.invoice_date BETWEEN ? AND ?
            GROUP BY p.id, p.title, p.coupon_code, p.promotion_type, p.discount_percent, p.discount_amount, p.start_date, p.end_date, p.status
            ORDER BY total_discount DESC, invoices_count DESC, p.title ASC
        """;

        List<PromotionDashboardResponse.PromotionDetailItem> promotions = jdbcTemplate.query(promoSql, (rs, rowNum) ->
            PromotionDashboardResponse.PromotionDetailItem.builder()
                    .id(rs.getString("id"))
                    .title(rs.getString("title"))
                    .couponCode(rs.getString("coupon_code") != null ? rs.getString("coupon_code") : "KM" + (rowNum + 1))
                    .promotionType(rs.getString("promotion_type") != null ? rs.getString("promotion_type") : "PERCENTAGE")
                    .discountPercent(rs.getBigDecimal("discount_percent"))
                    .discountAmount(rs.getBigDecimal("discount_amount"))
                    .startDate(rs.getTimestamp("start_date") != null ? rs.getTimestamp("start_date").toLocalDateTime() : null)
                    .endDate(rs.getTimestamp("end_date") != null ? rs.getTimestamp("end_date").toLocalDateTime() : null)
                    .status(rs.getString("status") != null ? rs.getString("status") : "ACTIVE")
                    .usageCount(rs.getLong("invoices_count"))
                    .invoicesCount(rs.getLong("invoices_count"))
                    .discountGiven(rs.getBigDecimal("total_discount"))
                    .salesGenerated(rs.getBigDecimal("total_sales"))
                    .build()
        , startTs, endTs);

        long totalUsage = promotions.stream().mapToLong(PromotionDashboardResponse.PromotionDetailItem::getUsageCount).sum();
        BigDecimal totalDiscount = promotions.stream()
                .map(PromotionDashboardResponse.PromotionDetailItem::getDiscountGiven)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalSales = promotions.stream()
                .map(PromotionDashboardResponse.PromotionDetailItem::getSalesGenerated)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return PromotionDashboardResponse.builder()
                .periodLabel(period.label())
                .startDate(period.startDate())
                .endDate(period.endDate())
                .totalPromotions(totalPromotions)
                .activePromotions(activePromotions)
                .totalUsageCount(totalUsage)
                .totalInvoicesApplied(totalUsage)
                .totalDiscountAmount(totalDiscount)
                .totalSalesGenerated(totalSales)
                .promotions(promotions)
                .build();
    }

    // =========================================================================
    // 7. APPOINTMENT DASHBOARD
    // =========================================================================
    @Override
    public AppointmentDashboardResponse getAppointmentDashboard(DashboardFilterRequest filter) {
        ResolvedPeriod period = resolvePeriod(filter);
        Timestamp startTs = Timestamp.valueOf(period.startDate());
        Timestamp endTs = Timestamp.valueOf(period.endDate());
        Timestamp pStartTs = Timestamp.valueOf(period.prevStartDate());
        Timestamp pEndTs = Timestamp.valueOf(period.prevEndDate());

        String apptSql = """
            SELECT
                COUNT(id) AS total,
                COUNT(id) FILTER (WHERE status = 'COMPLETED') AS completed,
                COUNT(id) FILTER (WHERE status = 'CANCELLED') AS cancelled,
                COUNT(id) FILTER (WHERE status = 'CONFIRMED') AS confirmed,
                COUNT(id) FILTER (WHERE status IN ('WAITING', 'PENDING')) AS waiting,
                COUNT(id) FILTER (WHERE status IN ('IN_PROGRESS', 'CALLED')) AS in_progress
            FROM appointments
            WHERE appointment_date BETWEEN ? AND ?
        """;

        var apptData = jdbcTemplate.queryForMap(apptSql, startTs, endTs);
        Long total = ((Number) apptData.get("total")).longValue();
        Long completed = ((Number) apptData.get("completed")).longValue();
        Long cancelled = ((Number) apptData.get("cancelled")).longValue();
        Long confirmed = ((Number) apptData.get("confirmed")).longValue();
        Long waiting = ((Number) apptData.get("waiting")).longValue();
        Long inProgress = ((Number) apptData.get("in_progress")).longValue();

        var prevApptData = jdbcTemplate.queryForMap(apptSql, pStartTs, pEndTs);
        Long prevTotal = ((Number) prevApptData.get("total")).longValue();
        Long prevCompleted = ((Number) prevApptData.get("completed")).longValue();
        Long prevCancelled = ((Number) prevApptData.get("cancelled")).longValue();

        double compRate = total > 0 ? Math.round(((double) completed / total) * 1000.0) / 10.0 : 0.0;
        double cancRate = total > 0 ? Math.round(((double) cancelled / total) * 1000.0) / 10.0 : 0.0;

        // Status Breakdown
        String stSql = """
            SELECT status, COUNT(*) AS cnt
            FROM appointments
            WHERE appointment_date BETWEEN ? AND ?
            GROUP BY status
            ORDER BY cnt DESC
        """;
        List<AppointmentDashboardResponse.AppointmentStatusStat> statusBreakdown = jdbcTemplate.query(stSql, (rs, rowNum) -> {
            String st = rs.getString("status");
            long cnt = rs.getLong("cnt");
            double pct = total > 0 ? Math.round(((double) cnt / total) * 1000.0) / 10.0 : 0.0;
            String name = switch (st != null ? st : "") {
                case "CONFIRMED" -> "Đã xác nhận";
                case "COMPLETED" -> "Đã hoàn thành";
                case "CANCELLED" -> "Đã hủy";
                case "IN_PROGRESS" -> "Đang điều trị";
                case "WAITING" -> "Đang chờ khám";
                case "PENDING" -> "Chờ xác nhận";
                case "CALLED" -> "Đã gọi vào khám";
                default -> st;
            };
            return AppointmentDashboardResponse.AppointmentStatusStat.builder()
                    .status(st)
                    .statusName(name)
                    .count(cnt)
                    .percentage(pct)
                    .build();
        }, startTs, endTs);

        // Trend
        boolean isDayGroup = "DAY".equalsIgnoreCase(period.groupBy());
        String datePattern = isDayGroup ? "YYYY-MM-DD" : "YYYY-MM";

        String trendSql = String.format("""
            SELECT
                TO_CHAR(appointment_date, '%s') AS d_key,
                COUNT(id) AS total,
                COUNT(id) FILTER (WHERE status = 'COMPLETED') AS completed,
                COUNT(id) FILTER (WHERE status = 'CANCELLED') AS cancelled,
                COUNT(id) FILTER (WHERE status NOT IN ('COMPLETED', 'CANCELLED')) AS other
            FROM appointments
            WHERE appointment_date BETWEEN ? AND ?
            GROUP BY TO_CHAR(appointment_date, '%s')
            ORDER BY d_key ASC
        """, datePattern, datePattern);

        List<AppointmentDashboardResponse.AppointmentTrendPoint> trend = jdbcTemplate.query(trendSql, (rs, rowNum) -> {
            String key = rs.getString("d_key");
            String label = isDayGroup && key.length() >= 10
                    ? key.substring(8, 10) + "/" + key.substring(5, 7)
                    : (key.length() >= 7 ? "Tháng " + key.substring(5, 7) : key);
            return AppointmentDashboardResponse.AppointmentTrendPoint.builder()
                    .dateKey(key)
                    .label(label)
                    .total(rs.getLong("total"))
                    .completed(rs.getLong("completed"))
                    .cancelled(rs.getLong("cancelled"))
                    .other(rs.getLong("other"))
                    .build();
        }, startTs, endTs);

        // Doctor stats
        String docApptSql = """
            SELECT
                d.id,
                d.full_name,
                COUNT(a.id) AS total,
                COUNT(a.id) FILTER (WHERE a.status = 'COMPLETED') AS completed,
                COUNT(a.id) FILTER (WHERE a.status = 'CANCELLED') AS cancelled
            FROM dentists d
            JOIN appointments a ON a.dentist_id = d.id
            WHERE a.appointment_date BETWEEN ? AND ?
            GROUP BY d.id, d.full_name
            ORDER BY total DESC
            LIMIT 10
        """;

        List<AppointmentDashboardResponse.DoctorAppointmentStat> doctorStats = jdbcTemplate.query(docApptSql, (rs, rowNum) ->
            AppointmentDashboardResponse.DoctorAppointmentStat.builder()
                    .dentistId(rs.getString("id"))
                    .doctorName(rs.getString("full_name"))
                    .total(rs.getLong("total"))
                    .completed(rs.getLong("completed"))
                    .cancelled(rs.getLong("cancelled"))
                    .build()
        , startTs, endTs);

        return AppointmentDashboardResponse.builder()
                .periodLabel(period.label())
                .startDate(period.startDate())
                .endDate(period.endDate())
                .totalAppointments(total)
                .completedAppointments(completed)
                .cancelledAppointments(cancelled)
                .confirmedAppointments(confirmed)
                .waitingAppointments(waiting)
                .inProgressAppointments(inProgress)
                .completionRate(compRate)
                .cancellationRate(cancRate)
                .prevTotalAppointments(prevTotal)
                .prevCompletedAppointments(prevCompleted)
                .prevCancelledAppointments(prevCancelled)
                .totalGrowthRate(calculateGrowthRateLong(total, prevTotal))
                .statusBreakdown(statusBreakdown)
                .trend(trend)
                .doctorStats(doctorStats)
                .build();
    }
}

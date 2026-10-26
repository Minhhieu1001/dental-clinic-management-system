package iuh.fit.backend.customercare.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerCareStatsDTO {
    private long totalPending;
    private long totalCompleted;
    private long totalRecare;
    private long totalFailed;
    private long totalAppointments;
    private long totalBirthdays;
    private long totalGeneralCare;
    private long totalPostTreatmentCare;
    private long totalPaymentCare;
    private long totalPromotionCare;
    private long totalActivePromotions;
    private long totalPaidInvoices;
    private long totalDebtInvoices;
    private double satisfactionRate;
}

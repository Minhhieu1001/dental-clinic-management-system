package iuh.fit.backend.patient.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class PatientStatisticsResponse {
    // Legacy API name: total appointments and follow-ups in the current calendar month.
    private long totalAppointmentsLast30Days;
    private long totalPrescriptions;
    private long totalTreatmentPlans;
    private long completedTreatmentPlans;
    private long inProgressTreatmentPlans;
    private BigDecimal totalOutstandingDebt;
    private long totalInvoices;
}

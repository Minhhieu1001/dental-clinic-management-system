package iuh.fit.backend.customercare.dto;

public record CustomerCareSummaryResponse(
        long outstandingInvoiceCount,
        long birthdayPatientCount,
        long activePromotionCount
) {
}

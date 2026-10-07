package iuh.fit.backend.billing.repository;

import iuh.fit.backend.billing.dto.InvoiceSummaryResponse;
import iuh.fit.backend.billing.entity.Invoice;
import iuh.fit.backend.billing.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

    boolean existsByTreatmentPlanId(UUID treatmentPlanId);

    List<Invoice> findByPatientIdOrderByInvoiceDateDesc(UUID patientId);

    @Query("SELECT DISTINCT i FROM Invoice i " +
           "LEFT JOIN FETCH i.patient p " +
           "LEFT JOIN FETCH i.employee e " +
           "LEFT JOIN FETCH i.promotion promo " +
           "LEFT JOIN FETCH i.invoiceDetails d " +
           "WHERE (:year IS NULL OR EXTRACT(YEAR FROM i.invoiceDate) = :year) " +
           "AND (:month IS NULL OR EXTRACT(MONTH FROM i.invoiceDate) = :month) " +
           "AND (:status IS NULL OR i.paymentStatus = :status) " +
           "AND (:search = '' " +
           "     OR LOWER(i.invoiceCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(p.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(p.patientCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR p.phoneNumber LIKE CONCAT('%', :search, '%')) " +
           "ORDER BY i.invoiceDate DESC")
    List<Invoice> findAllByFilterOrderByInvoiceDateDesc(
            @Param("year") Integer year,
            @Param("month") Integer month,
            @Param("status") PaymentStatus status,
            @Param("search") String search
    );


    @Query("SELECT " +
           "COALESCE(SUM(i.finalAmount), 0)     AS totalRevenue, " +
           "COALESCE(SUM(i.paidAmount), 0)      AS totalPaid, " +
           "COALESCE(SUM(i.remainingAmount), 0) AS totalDebt, " +
           "COUNT(i)                            AS totalCount " +
           "FROM Invoice i " +
           "WHERE (:year IS NULL OR EXTRACT(YEAR FROM i.invoiceDate) = :year) " +
           "AND (:month IS NULL OR EXTRACT(MONTH FROM i.invoiceDate) = :month)")
    InvoiceSummaryResponse summarizeByYearAndMonth(
            @Param("year") Integer year,
            @Param("month") Integer month
    );
}

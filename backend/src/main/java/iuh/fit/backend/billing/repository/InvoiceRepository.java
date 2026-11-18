package iuh.fit.backend.billing.repository;

import iuh.fit.backend.billing.dto.InvoiceSummaryResponse;
import iuh.fit.backend.billing.entity.Invoice;
import iuh.fit.backend.billing.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.math.BigDecimal;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
    @Query("""
            SELECT i FROM Invoice i JOIN FETCH i.patient p
            WHERE i.remainingAmount > 0
              AND (i.paymentStatus IS NULL OR i.paymentStatus <> :excludedStatus)
              AND (:patientId IS NULL OR p.id = :patientId)
            ORDER BY p.id, i.invoiceDate, i.id
            """)
    List<Invoice> findOutstandingCareInvoices(@Param("patientId") UUID patientId,
                                             @Param("excludedStatus") PaymentStatus excludedStatus);


    @Query("""
            SELECT COUNT(i) FROM Invoice i
            WHERE i.remainingAmount > 0
              AND (i.paymentStatus IS NULL OR i.paymentStatus <> :excludedStatus)
            """)
    long countOutstandingInvoices(@Param("excludedStatus") PaymentStatus excludedStatus);

    long countByPatientId(UUID patientId);

    @Query("""
            SELECT COALESCE(SUM(i.remainingAmount), 0) FROM Invoice i
            WHERE i.patient.id = :patientId
              AND (i.paymentStatus IS NULL OR i.paymentStatus <> :excludedStatus)
              AND i.remainingAmount > 0
            """)
    BigDecimal sumOutstandingDebtByPatientId(@Param("patientId") UUID patientId,
            @Param("excludedStatus") PaymentStatus excludedStatus);

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
            @Param("search") String search);

    @Query(value = """
            SELECT
                COALESCE(SUM(i.final_amount), 0) AS "totalRevenue",
                COALESCE(SUM(i.paid_amount), 0) AS "totalPaid",
                COALESCE(SUM(i.remaining_amount), 0) AS "totalDebt",
                COUNT(i.id) AS "totalCount",
                COALESCE(SUM(COALESCE(tx.total_transaction, 0)), 0) AS "totalTransaction",
                COALESCE(SUM(COALESCE(tx.total_medicine, 0)), 0) AS "totalMedicine"
            FROM invoices i
            LEFT JOIN (
                SELECT
                    pt.invoice_id,
                    SUM(pt.total_amount) AS total_transaction,
                    SUM(pt.medicine_amount) AS total_medicine
                FROM payment_transactions pt
                WHERE pt.status = 'SUCCESS'
                GROUP BY pt.invoice_id
            ) tx ON tx.invoice_id = i.id
            WHERE (:year IS NULL OR EXTRACT(YEAR FROM i.invoice_date) = :year)
              AND (:month IS NULL OR EXTRACT(MONTH FROM i.invoice_date) = :month)
            """, nativeQuery = true)
    InvoiceSummaryResponse summarizeByYearAndMonth(
            @Param("year") Integer year,
            @Param("month") Integer month);
}

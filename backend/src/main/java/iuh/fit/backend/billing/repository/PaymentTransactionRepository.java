package iuh.fit.backend.billing.repository;

import iuh.fit.backend.billing.entity.PaymentTransactions;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransactions, UUID> {
    @Query("SELECT pt FROM PaymentTransactions pt " +
           "LEFT JOIN FETCH pt.invoice i " +
           "LEFT JOIN FETCH i.patient p " +
           "LEFT JOIN FETCH pt.employee e " +
           "LEFT JOIN FETCH e.user u " +
           "WHERE i.id = :invoiceId " +
           "ORDER BY pt.paymentTime DESC")
    List<PaymentTransactions> findByInvoiceIdWithDetails(@Param("invoiceId") UUID invoiceId);

    @Query("SELECT pt FROM PaymentTransactions pt " +
           "LEFT JOIN FETCH pt.invoice i " +
           "LEFT JOIN FETCH i.patient p " +
           "LEFT JOIN FETCH pt.employee e " +
           "LEFT JOIN FETCH e.user u " +
           "WHERE pt.paymentTime >= :startTime AND pt.paymentTime <= :endTime " +
           "AND (:employeeId IS NULL OR e.id = :employeeId) " +
           "ORDER BY pt.paymentTime DESC")
    List<PaymentTransactions> findTransactionsForShift(
            @Param("startTime") java.time.LocalDateTime startTime,
            @Param("endTime") java.time.LocalDateTime endTime,
            @Param("employeeId") UUID employeeId
    );
}

package iuh.fit.backend.customercare.repository;

import iuh.fit.backend.customercare.entity.CustomerCareRecord;
import iuh.fit.backend.customercare.enums.CareType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CustomerCareRecordRepository extends JpaRepository<CustomerCareRecord, UUID> {
    List<CustomerCareRecord> findByPatientIdOrderByCareTimeDesc(UUID patientId);

    List<CustomerCareRecord> findByAppointmentIdOrderByCareTimeDesc(UUID appointmentId);

    List<CustomerCareRecord> findByTreatmentPlanIdOrderByCareTimeDesc(UUID treatmentPlanId);

    List<CustomerCareRecord> findByPrescriptionIdOrderByCareTimeDesc(UUID prescriptionId);

    List<CustomerCareRecord> findByCareTypeOrderByCareTimeDesc(CareType careType);

    @Query("SELECT c FROM CustomerCareRecord c ORDER BY c.careTime DESC")
    List<CustomerCareRecord> findAllOrderByCareTimeDesc();

    @Query("SELECT c FROM CustomerCareRecord c WHERE c.appointment.id = :appointmentId ORDER BY c.careTime DESC")
    List<CustomerCareRecord> findLatestByAppointmentId(@Param("appointmentId") UUID appointmentId);

    @Query("SELECT c FROM CustomerCareRecord c WHERE c.treatmentPlan.id = :treatmentPlanId ORDER BY c.careTime DESC")
    List<CustomerCareRecord> findLatestByTreatmentPlanId(@Param("treatmentPlanId") UUID treatmentPlanId);

    @Query("SELECT c FROM CustomerCareRecord c WHERE c.prescription.id = :prescriptionId ORDER BY c.careTime DESC")
    List<CustomerCareRecord> findLatestByPrescriptionId(@Param("prescriptionId") UUID prescriptionId);

    @Query("SELECT c FROM CustomerCareRecord c WHERE c.patient.id = :patientId AND c.careType = iuh.fit.backend.customercare.enums.CareType.BIRTHDAY ORDER BY c.careTime DESC")
    List<CustomerCareRecord> findLatestBirthdayCareByPatientId(@Param("patientId") UUID patientId);

    List<CustomerCareRecord> findByInvoiceIdOrderByCareTimeDesc(UUID invoiceId);

    @Query("SELECT c FROM CustomerCareRecord c WHERE c.invoice.id = :invoiceId ORDER BY c.careTime DESC")
    List<CustomerCareRecord> findLatestByInvoiceId(@Param("invoiceId") UUID invoiceId);
}

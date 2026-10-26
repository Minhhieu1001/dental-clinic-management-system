package iuh.fit.backend.patient.repository;

import iuh.fit.backend.patient.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static jakarta.persistence.LockModeType.PESSIMISTIC_WRITE;

@Repository
public interface PatientRepository extends JpaRepository<Patient, UUID> {
    @Lock(PESSIMISTIC_WRITE)
    @Query("select p from Patient p where upper(p.patientCode) = upper(:code)")
    Optional<Patient> findForActivationByCode(@Param("code") String code);

    @Lock(PESSIMISTIC_WRITE)
    @Query("select p from Patient p where p.id = :id")
    Optional<Patient> findForActivationById(@Param("id") UUID id);
    boolean existsByPatientCode(String patientCode);
    Optional<Patient> findByPatientCode(String patientCode);
    List<Patient> findAllByOrderByCreatedAtDesc();
    List<Patient> findByPhoneNumberOrderByCreatedAtDesc(String phoneNumber);
    Optional<Patient> findFirstByPhoneNumberOrderByCreatedAtDesc(String phoneNumber);
    Optional<Patient> findFirstByCccdOrderByCreatedAtDesc(String cccd);
    Optional<Patient> findFirstByPatientCodeOrderByCreatedAtDesc(String patientCode);
    Optional<Patient> findByUserId(UUID userId);

    @Query(value = """
        SELECT
            pa.id AS patient_id,
            pa.patient_code AS patient_code,
            pa.full_name AS full_name,
            pa.phone_number AS phone,
            pa.cccd AS cccd,
            pa.gender AS gender,
            pa.date_of_birth AS date_of_birth,
            pa.address AS address,
            pa.hometown AS hometown,
            pa.job AS job,
            mr.id AS medical_record_id,
            mr.record_date AS record_date,
            ex.id AS examination_result_id,
            ex.examination_date AS examination_date,
            ex.chief_complaint AS chief_complaint,
            ex_dentist.full_name AS doctor_name,
            mr_dentist.full_name AS creator_name,
            ds.id AS diagnosis_id,
            ds.tooth_position AS tooth_position,
            ds.primary_diagnosis AS primary_diagnosis,
            ds.level AS diagnosis_level,
            ds.diagnostic_notes AS diagnostic_notes,
            trp.id AS treatment_plan_id,
            trp.plan_name AS plan_name,
            trp.description AS plan_description,
            trp.estimated_cost AS estimated_cost,
            trp.status AS plan_status,
            trp.start_date AS plan_start_date,
            pha.id AS phase_id,
            pha.phase_name AS phase_name,
            pha.phase_order AS phase_order,
            pha.treatment_type AS treatment_type,
            pha.description AS phase_description,
            pha.status AS phase_status,
            trs.id AS treatment_service_id,
            trs.service_id AS service_id,
            trs.service_name AS service_name,
            trs.tooth_number AS tooth_number,
            trs.quantity AS quantity,
            trs.price AS price,
            trs.total_amount AS total_amount
        FROM patients pa
        LEFT JOIN medical_records mr ON pa.id = mr.patient_id
        LEFT JOIN dentists mr_dentist ON mr.dentist_id = mr_dentist.id
        LEFT JOIN examinations_result ex ON mr.id = ex.medical_record_id
        LEFT JOIN dentists ex_dentist ON ex.dentist_id = ex_dentist.id
        LEFT JOIN diagnoses ds ON ex.id = ds.examination_result_id
        LEFT JOIN treatment_plans trp ON ex.id = trp.examination_result_id
        LEFT JOIN treatment_phases pha ON trp.id = pha.treatment_plan_id
        LEFT JOIN treatment_services trs ON pha.id = trs.treatment_phase_id
        WHERE pa.patient_code = :patientCode
    """, nativeQuery = true)
    List<Map<String, Object>> getRawInvoiceDataByPatientCode(@Param("patientCode") String patientCode);
}

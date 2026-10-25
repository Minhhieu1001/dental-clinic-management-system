package iuh.fit.backend.prescription.entity;

import iuh.fit.backend.medicalrecord.entity.ExaminationResult;
import iuh.fit.backend.medicalrecord.entity.MedicalRecord;
import iuh.fit.backend.billing.entity.InvoiceDetail;
import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.user.entity.Dentist;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "prescriptions")
public class Prescription {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "examination_result_id")
    private ExaminationResult examinationResult;

    @Column(name = "prescription_code", length = 50)
    private String prescriptionCode;

    @Column(name = "prescription_name", length = 255)
    private String prescriptionName;

    @Column(name = "prescription_date")
    private LocalDateTime prescriptionDate;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dentist_id", foreignKey = @ForeignKey(name = "fk_prescriptions_dentist"))
    private Dentist dentist;

    // Snapshot of the dentist's name when the prescription was issued.
    @Column(length = 255)
    private String prescriber;

    @Column(name = "doctor_advice", columnDefinition = "TEXT")
    private String doctorAdvice;


    @Builder.Default
    @OneToMany(mappedBy = "prescription", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PrescriptionDetail> prescriptionDetails = new ArrayList<>();

}


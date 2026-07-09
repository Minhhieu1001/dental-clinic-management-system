package iuh.fit.backend.prescription.entity;

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
    @JoinColumn(name = "medical_record_id")
    private MedicalRecord medicalRecord;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dentist_id")
    private Dentist dentist;

    private LocalDateTime prescriptionDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Builder.Default
    @OneToMany(mappedBy = "prescription", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<PrescriptionDetail> prescriptionDetails = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "prescription", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<InvoiceDetail> invoiceDetails = new ArrayList<>();
}

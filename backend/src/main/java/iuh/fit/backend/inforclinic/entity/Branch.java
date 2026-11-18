package iuh.fit.backend.inforclinic.entity;

import iuh.fit.backend.appointment.entity.Appointment;
import iuh.fit.backend.appointment.entity.AppointmentRequest;
import iuh.fit.backend.appointment.entity.FollowUpAppointment;
import iuh.fit.backend.billing.entity.Invoice;
import iuh.fit.backend.billing.entity.PaymentTransactions;
import iuh.fit.backend.inforclinic.enums.BranchStatus;
import iuh.fit.backend.medicalrecord.entity.ExaminationResult;
import iuh.fit.backend.medicalrecord.entity.MedicalRecord;
import iuh.fit.backend.user.entity.Dentist;
import iuh.fit.backend.user.entity.Employee;
import iuh.fit.backend.patient.entity.Patient;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "branches")
public class Branch {
    @Id
    @Column(name = "branch_id", length = 50, nullable = false, updatable = false)
    private String branchId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "clinic_id", nullable = false)
    private Clinic clinic;

    @Column(name = "branch_code", length = 50, unique = true, nullable = false)
    private String branchCode;

    @Column(name = "branch_name", length = 255, nullable = false)
    private String branchName;

    @Column(name = "phone_number", length = 30)
    private String phoneNumber;

    @Column(length = 255)
    private String email;

    @Column(length = 500)
    private String address;

    @Column(name = "open_time")
    private LocalTime openTime;

    @Column(name = "close_time")
    private LocalTime closeTime;

    @Column(name = "image_branch", columnDefinition = "TEXT")
    private String imageBranch;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private BranchStatus status = BranchStatus.ACTIVE;

    @JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "createdBranch", fetch = FetchType.LAZY)
    private List<Patient> patients = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "branch", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<Employee> employees = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "branch", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<Dentist> dentists = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "branch", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<AppointmentRequest> appointmentRequests = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "branch", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<Appointment> appointments = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "branch", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<FollowUpAppointment> followUpAppointments = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "branch", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<Invoice> invoices = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "branch", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<PaymentTransactions> paymentTransactions = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "branch", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<MedicalRecord> medicalRecords = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "branch", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<ExaminationResult> examinationResults = new ArrayList<>();

}

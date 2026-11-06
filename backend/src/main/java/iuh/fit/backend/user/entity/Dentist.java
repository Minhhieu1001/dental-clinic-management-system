package iuh.fit.backend.user.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import iuh.fit.backend.appointment.entity.Appointment;
import iuh.fit.backend.appointment.entity.FollowUpAppointment;
import iuh.fit.backend.appointment.entity.Shift;
import iuh.fit.backend.inforclinic.entity.Branch;
import iuh.fit.backend.medicalrecord.entity.ExaminationResult;
import iuh.fit.backend.medicalrecord.entity.MedicalRecord;
import iuh.fit.backend.prescription.entity.Prescription;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "dentists")
public class Dentist {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(length = 255)
    private String fullName;

    @Column(length = 50)
    private String gender;

    private LocalDate dateOfBirth;

    @Column(length = 255)
    private String address;

    @Column(length = 255)
    private String education;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Integer experienceYears;

    @Column(name = "license_number", length = 255)
    private String licenseNumber;

    @Builder.Default
    @OneToMany(mappedBy = "dentist", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Certificate> certificates = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "dentist", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<Shift> shifts = new ArrayList<>();

    @JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "dentist", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<Appointment> appointments = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "dentist", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<MedicalRecord> medicalRecords = new ArrayList<>();


    @Builder.Default
    @OneToMany(mappedBy = "dentist", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<ExaminationResult> examinationResults = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "dentist", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<FollowUpAppointment> followUpAppointments = new ArrayList<>();

    @JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "dentist", fetch = FetchType.LAZY)
    private List<Prescription> prescriptions = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "branch_id", nullable = true)
    private Branch branch;

}

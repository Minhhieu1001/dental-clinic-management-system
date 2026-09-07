package iuh.fit.backend.medicalrecord.entity;

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
@Table(name = "examinations_result")
public class ExaminationResult {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medical_record_id")
    private MedicalRecord medicalRecord;

    @Column(columnDefinition = "TEXT")
    private String chiefComplaint;

    private LocalDateTime examinationDate;

    @OneToOne(mappedBy = "examinationResult", fetch = FetchType.LAZY,
            cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private Diagnosis diagnosis;

    @Builder.Default
    @OneToMany(mappedBy = "examinationResult", fetch = FetchType.LAZY,
            cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<Tooth_Record> toothRecords = new ArrayList<>();
}

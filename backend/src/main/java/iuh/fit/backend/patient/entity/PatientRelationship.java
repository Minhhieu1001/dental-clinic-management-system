package iuh.fit.backend.patient.entity;

import iuh.fit.backend.patient.enums.RelationshipType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "patient_relationships", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"patient_id", "related_patient_id"})
})
public class PatientRelationship {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // 1. Khóa ngoại trỏ về Bệnh nhân chủ sở hữu (Bố/Mẹ)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    // 2. Khóa ngoại trỏ về Bệnh nhân người thân (Con)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_patient_id", nullable = false)
    private Patient relatedPatient;

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    private RelationshipType relationshipType;

    // trạng thái đang liên kết = true , hủy liên kết == false
    private boolean status;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
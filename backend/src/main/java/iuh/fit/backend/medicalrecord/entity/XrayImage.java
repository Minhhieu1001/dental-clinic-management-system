package iuh.fit.backend.medicalrecord.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "xray_images")
public class XrayImage {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medical_record_id")
    private MedicalRecord medicalRecord;

    @Column(length = 255)
    private String imageUrl;

    private LocalDateTime captureDate;

    @OneToOne(mappedBy = "xrayImage", fetch = FetchType.LAZY)
    private XrayAnalysis xrayAnalysis;
}

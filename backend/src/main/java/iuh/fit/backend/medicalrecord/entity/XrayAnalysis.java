package iuh.fit.backend.medicalrecord.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "xray_analysis")
public class XrayAnalysis {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "xray_image_id")
    private XrayImage xrayImage;

    @Column(columnDefinition = "TEXT")
    private String result;

    @Column(columnDefinition = "TEXT")
    private String detectedIssue;

    @Column(precision = 5, scale = 2)
    private BigDecimal confidenceScore;

    private LocalDateTime analyzedAt;
}

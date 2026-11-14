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
@Table(name = "xray_images")
public class XrayImage {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Mỗi đợt khám có tối đa một bản ghi ảnh X-quang.
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "examination_result_id", nullable = false, unique = true)
    private ExaminationResult examinationResult;

    @Column(length = 255)
    private String imageUrl;

    // Loại phim: PANORAMIC | PERIAPICAL | BITEWING | CEPHALOMETRIC | OTHER
    @Column(length = 30)
    private String imageType;

    private LocalDateTime captureDate;

    @Builder.Default
    @OneToMany(mappedBy = "xrayImage", fetch = FetchType.LAZY)
    private List<XrayAnalysis> analyses = new ArrayList<>();
}

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

    // Đợt khám (lần khám) mà phim X-quang được chụp / phân tích - cho phép null với dữ liệu cũ
    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "examination_result_id", nullable = true)
    private ExaminationResult examinationResult;

    @Column(length = 255)
    private String imageUrl;

    // Loại phim: PANORAMIC | PERIAPICAL | BITEWING | CEPHALOMETRIC | OTHER
    @Column(length = 30)
    private String imageType;

    private LocalDateTime captureDate;

    @OneToOne(mappedBy = "xrayImage", fetch = FetchType.LAZY)
    private XrayAnalysis xrayAnalysis;
}

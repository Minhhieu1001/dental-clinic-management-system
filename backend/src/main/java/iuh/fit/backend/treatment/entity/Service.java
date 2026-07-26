package iuh.fit.backend.treatment.entity;

import iuh.fit.backend.billing.entity.InvoiceDetail;
import iuh.fit.backend.promotion.entity.PromotionService;
import iuh.fit.backend.treatment.enums.ServiceCategory;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "services")
public class Service {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(length = 255)
    private String serviceName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(precision = 15, scale = 2)
    private BigDecimal price;

    /** Nhóm dịch vụ lớn: NIENG_RANG, RANG_SU, IMPLANT, TAY_TRANG, KHAM_DIEU_TRI */
    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private ServiceCategory category;

    /** Nhóm nhỏ trong category, ví dụ "Mắc cài kim loại", "Invisalign" */
    @Column(length = 255)
    private String subCategory;

    /** Đơn vị tính: "Cả 2 hàm", "/răng", "/trụ", "/lần" */
    @Column(length = 100)
    private String unit;

    /** URL ảnh minh họa dịch vụ */
    @Column(length = 1000)
    private String imageUrl;

    /** Thứ tự hiển thị trong danh sách */
    @Builder.Default
    @Column
    private Integer sortOrder = 0;

    /** Dịch vụ nổi bật hiển thị trên trang chủ / trang dịch vụ */
    @Builder.Default
    @Column
    private Boolean isFeatured = false;

    @Builder.Default
    @OneToMany(mappedBy = "service", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<TreatmentService> treatmentServices = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "service", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<InvoiceDetail> invoiceDetails = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "service", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<PromotionService> promotionServices = new ArrayList<>();
}

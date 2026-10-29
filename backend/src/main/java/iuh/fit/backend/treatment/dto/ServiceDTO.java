package iuh.fit.backend.treatment.dto;

import iuh.fit.backend.treatment.enums.ServiceCategory;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceDTO {
    private UUID id;
    private String serviceCode;
    private String serviceName;
    private String description;
    private BigDecimal price;
    private BigDecimal costPrice;
    private Integer estimatedDuration;
    private String sessionsCount;
    private ServiceCategory category;
    private String subCategory;
    private String unit;
    private String warrantyPeriod;
    private String imageUrl;
    private Integer sortOrder;
    private Boolean isFeatured;
    private Boolean isActive;
    private UUID promotionId;
    private String promotionTitle;
}

package iuh.fit.backend.treatment.dto;

import iuh.fit.backend.treatment.enums.ServiceCategory;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceCreateDTO {
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
}

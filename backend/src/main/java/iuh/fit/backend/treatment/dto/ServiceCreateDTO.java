package iuh.fit.backend.treatment.dto;

import iuh.fit.backend.treatment.enums.ServiceCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
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
    @DecimalMin(value = "0", message = "Giá dịch vụ không được âm")
    private BigDecimal price;
    @DecimalMin(value = "0", message = "Giá vốn không được âm")
    private BigDecimal costPrice;
    @Min(value = 0, message = "Thời lượng không được âm")
    private Integer estimatedDuration;
    private String sessionsCount;
    private ServiceCategory category;
    private String subCategory;
    private String unit;
    private String warrantyPeriod;
    private String imageUrl;
    @Min(value = 0, message = "Thứ tự hiển thị không được âm")
    private Integer sortOrder;
    private Boolean isFeatured;
    private Boolean isActive;
}

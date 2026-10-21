package iuh.fit.backend.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardFilterRequest {
    /**
     * ALL, TODAY, DAY, LAST_7_DAYS, LAST_30_DAYS, MONTH, QUARTER, YEAR, CUSTOM
     */
    private String filterType;

    private Integer year;
    private Integer month;
    private Integer quarter;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate date;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate startDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate endDate;

    private String branchId;
}

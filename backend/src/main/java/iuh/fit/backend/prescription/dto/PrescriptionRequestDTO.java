package iuh.fit.backend.prescription.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class PrescriptionRequestDTO {
    private UUID examinationResultId;

    private String prescriptionCode;

    @NotBlank(message = "Tên đơn thuốc không được để trống")
    private String prescriptionName;

    private LocalDateTime prescriptionDate;

    @NotNull(message = "Bác sĩ kê đơn không được để trống")
    private UUID dentistId;

    private String doctorAdvice;

    @Builder.Default
    private List<@Valid PrescriptionDetailRequestDTO> prescriptionDetails = new ArrayList<>();
}

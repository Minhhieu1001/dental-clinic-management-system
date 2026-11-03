package iuh.fit.backend.system.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PrimaryDiagnosisRequest {
    @NotBlank(message = "Tên chẩn đoán chính không được để trống")
    private String primaryDiagnosisName;

    private Boolean status;
}

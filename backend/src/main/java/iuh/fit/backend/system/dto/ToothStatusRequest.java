package iuh.fit.backend.system.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ToothStatusRequest {
    @NotBlank(message = "Mã răng không được để trống")
    private String toothCode;

    @NotBlank(message = "Tên trạng thái răng không được để trống")
    private String label;

    @NotBlank(message = "Màu trạng thái không được để trống")
    private String color;
}

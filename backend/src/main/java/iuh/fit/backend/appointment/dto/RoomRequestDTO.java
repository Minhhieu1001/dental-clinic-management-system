package iuh.fit.backend.appointment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomRequestDTO {
    @NotBlank(message = "Tên phòng khám không được để trống")
    private String roomName;

    private String floorName;

    @NotBlank(message = "Chi nhánh không được để trống")
    private String branchId;
}

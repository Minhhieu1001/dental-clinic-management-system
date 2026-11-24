package iuh.fit.backend.appointment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomResponseDTO {
    private UUID id;
    private String roomName;
    private String floorName;
    private LocalDateTime createAt;
    private String branchId;
    private String branchName;
}

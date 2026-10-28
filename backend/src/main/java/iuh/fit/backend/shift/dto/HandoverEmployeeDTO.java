package iuh.fit.backend.shift.dto;

import iuh.fit.backend.user.enums.Position;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HandoverEmployeeDTO {
    private UUID id;
    private String fullName;
    private Position position;
    private String positionLabel;
    private String branchId;
    private String branchName;
    private String username;
}

package iuh.fit.backend.system.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class PrimaryDiagnosisResponse {
    private UUID id;
    private String primaryDiagnosisName;
    private boolean status;
}

package iuh.fit.backend.system.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class ToothStatusResponse {
    private UUID id;
    private String toothCode;
    private String label;
    private String color;
}

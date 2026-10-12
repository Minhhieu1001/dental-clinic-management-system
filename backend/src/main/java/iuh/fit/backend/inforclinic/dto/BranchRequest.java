package iuh.fit.backend.inforclinic.dto;

import iuh.fit.backend.inforclinic.enums.BranchStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
public class BranchRequest {
    @NotBlank
    private String clinicId;
    @NotBlank
    private String branchCode;
    @NotBlank
    private String branchName;
    private String phoneNumber;
    private String email;
    private String address;
    private LocalTime openTime;
    private LocalTime closeTime;
    private String imageBranch;
    private BranchStatus status;
}

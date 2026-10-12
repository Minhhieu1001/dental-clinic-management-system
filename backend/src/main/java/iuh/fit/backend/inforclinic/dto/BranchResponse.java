package iuh.fit.backend.inforclinic.dto;

import iuh.fit.backend.inforclinic.enums.BranchStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalTime;

@Getter
@Builder
public class BranchResponse {
    private String branchId;
    private String clinicId;
    private String clinicCode;
    private String branchCode;
    private String branchName;
    private String phoneNumber;
    private String email;
    private String address;
    private LocalTime openTime;
    private LocalTime closeTime;
    private String imageBranch;
    private BranchStatus status;
}

package iuh.fit.backend.inforclinic.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class ClinicResponse {
    private String clinicId;
    private String clinicCode;
    private String brandName;
    private String legalName;
    private String taxCode;
    private String businessLicenseNo;
    private Integer establishedYear;
    private String representative;
    private String phoneNumber;
    private String email;
    private String logoUrl;
    private String registeredAddress;
    private String description;
    private String image;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<BranchResponse> branches;
}

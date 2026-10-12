package iuh.fit.backend.inforclinic.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ClinicRequest {
    @NotBlank
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
}

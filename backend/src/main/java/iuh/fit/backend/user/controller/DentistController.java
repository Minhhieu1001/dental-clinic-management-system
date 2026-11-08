package iuh.fit.backend.user.controller;

import iuh.fit.backend.user.dto.DentistListResponse;
import iuh.fit.backend.user.dto.DentistRequest;
import iuh.fit.backend.user.dto.DentistResponse;
import iuh.fit.backend.user.entity.Dentist;
import iuh.fit.backend.user.repository.DentistRepository;
import iuh.fit.backend.user.service.DentistService;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/dentists")
@RequiredArgsConstructor
public class DentistController {
    private final DentistService dentistService;

    @GetMapping
    public List<DentistResponse> getAllDentists() {
        return dentistService.getAllDentists();
    }

    @GetMapping("/list")
    public List<DentistListResponse> getDentistsList() {
        return dentistService.getDentistsList();
    }

    @GetMapping("/branch/{branchId}")
    public List<DentistListResponse> getDentistsByBranch(@PathVariable String branchId) {
        return dentistService.getDentistsByBranch(branchId);
    }

    @GetMapping("/stats")
    public Map<String, Long> getDentistStats() {
        return dentistService.getDentistStats();
    }


    @GetMapping("/{id}")
    public DentistListResponse getDentistById(@PathVariable UUID id) {
        return dentistService.getDentistById(id);
    }

    @GetMapping("/{id}/branch")
    public DentistListResponse getDentistWithBranchById(@PathVariable UUID id) {
        return dentistService.getDentistWithBranchById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DentistResponse createDentist(@RequestBody DentistRequest request) {
        return dentistService.createDentist(request);
    }

    @PutMapping("/{id}")
    public DentistListResponse updateDentist(@PathVariable UUID id, @RequestBody DentistRequest request) {
        return dentistService.updateDentist(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDentist(@PathVariable UUID id) {
        dentistService.deleteDentist(id);
    }
}


//@RestController
//@RequestMapping("/api/dentists")
//class PublicDentistController {
//    private final DentistRepository dentistRepository;
//
//    PublicDentistController(DentistRepository dentistRepository) {
//        this.dentistRepository = dentistRepository;
//    }
//
//    @GetMapping
//    List<PublicDentistDto> getAllPublicDentists() {
//        return dentistRepository.findAll().stream()
//                .map(dentist -> PublicDentistDto.builder()
//                        .id(dentist.getId())
//                        .fullName(dentist.getFullName())
//                        .licenseNumber(dentist.getLicenseNumber())
//                        .specialization(dentist.getSpecialization())
//                        .experienceYears(dentist.getExperienceYears())
//                        .qualification(dentist.getQualification())
//                        .avatarUrl(dentist.getUser() != null ? dentist.getUser().getAvatarUrl() : null)
//                        .build())
//                .collect(Collectors.toList());
//    }
//
//    @Data
//    @Builder
//    static class PublicDentistDto {
//        private UUID id;
//        private String fullName;
//        private String licenseNumber;
//        private String specialization;
//        private Integer experienceYears;
//        private String qualification;
//        private String avatarUrl;
//    }
//}

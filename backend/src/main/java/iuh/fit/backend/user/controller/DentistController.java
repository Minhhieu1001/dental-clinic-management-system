package iuh.fit.backend.user.controller;

import iuh.fit.backend.user.entity.Dentist;
import iuh.fit.backend.user.repository.DentistRepository;
import lombok.Builder;
import lombok.Data;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dentists")
public class DentistController {

    private final DentistRepository dentistRepository;

    public DentistController(DentistRepository dentistRepository) {
        this.dentistRepository = dentistRepository;
    }

    @GetMapping
    public List<DentistDto> getAllDentists() {
        return dentistRepository.findAll().stream()
                .map(d -> DentistDto.builder()
                        .id(d.getId())
                        .fullName(d.getFullName())
                        .licenseNumber(d.getLicenseNumber())
                        .specialization(d.getSpecialization())
                        .experienceYears(d.getExperienceYears())
                        .qualification(d.getQualification())
                        .avatarUrl(d.getUser() != null ? d.getUser().getAvatarUrl() : null)
                        .build())
                .collect(Collectors.toList());
    }

    @Data
    @Builder
    public static class DentistDto {
        private UUID id;
        private String fullName;
        private String licenseNumber;
        private String specialization;
        private Integer experienceYears;
        private String qualification;
        private String avatarUrl;
    }
}

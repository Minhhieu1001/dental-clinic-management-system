package iuh.fit.backend.user.service.Impl;

import iuh.fit.backend.user.dto.*;
import iuh.fit.backend.user.entity.Dentist;
import iuh.fit.backend.user.entity.User;
import iuh.fit.backend.user.entity.Specialization;
import iuh.fit.backend.user.entity.DentistSpecialization;
import iuh.fit.backend.user.entity.Certificate;
import iuh.fit.backend.user.repository.DentistRepository;
import iuh.fit.backend.user.repository.UserRepository;
import iuh.fit.backend.user.repository.SpecializationRepository;
import iuh.fit.backend.user.service.DentistService;
import iuh.fit.backend.user.service.UserService;
import iuh.fit.backend.user.enums.Role;
import iuh.fit.backend.user.enums.StatusUser;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class DentistServiceImpl implements DentistService {
    private final DentistRepository dentistRepository;
    private final UserRepository userRepository;
    private final SpecializationRepository specializationRepository;
    private final UserService userService;

    @Override
    public List<DentistResponse> getAllDentists() {
        return dentistRepository.findAll()
                .stream()
                .map(this::toDentistResponse)
                .toList();
    }

    @Override
    public List<DentistListResponse> getDentistsList() {
        return dentistRepository.findAllWithUser()
                .stream()
                .map(this::toDentistListResponse)
                .toList();
    }

    @Override
    public Map<String, Long> getDentistStats() {
        List<Dentist> allDentists = dentistRepository.findAllWithUser();
        long total = allDentists.size();
        long active = 0;
        long blocked = 0;
        long onLeave = 0;

        for (Dentist dentist : allDentists) {
            User user = dentist.getUser();
            if (user != null && user.getStatus() == StatusUser.BLOCK) {
                blocked++;
            } else {
                active++;
            }
        }

        Map<String, Long> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("active", active);
        stats.put("blocked", blocked);
        stats.put("onLeave", onLeave);
        return stats;
    }

    @Override
    public DentistListResponse getDentistById(UUID id) {
        return toDentistListResponse(findDentist(id));
    }

    @Override
    public DentistResponse createDentist(DentistRequest request) {
        Dentist dentist = new Dentist();
        applyDentistRequest(dentist, request, null);
        return toDentistResponse(dentistRepository.save(dentist));
    }

    @Override
    public DentistListResponse updateDentist(UUID id, DentistRequest request) {
        Dentist dentist = findDentist(id);
        applyDentistRequest(dentist, request, id);
        return toDentistListResponse(dentistRepository.save(dentist));
    }

    @Override
    public void deleteDentist(UUID id) {
        Dentist dentist = findDentist(id);
        try {
            dentistRepository.delete(dentist);
            dentistRepository.flush();
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot delete dentist because it is referenced by other data.",
                    exception
            );
        }
    }

    private void applyDentistRequest(Dentist dentist, DentistRequest request, UUID currentDentistId) {
        boolean isUpdate = currentDentistId != null;
        validateDentistUserIsAvailable(request.userId(), currentDentistId);

        if (request.userId() != null) {
            dentist.setUser(resolveUser(request.userId()));
        } else if (request.user() != null) {
            var userReq = request.user();
            var dentistUser = new UserRequest(
                    userReq.username(),
                    userReq.password(),
                    userReq.email(),
                    userReq.phone(),
                    userReq.avatarUrl(),
                    Role.DENTIST,
                    userReq.status() != null ? userReq.status() : StatusUser.ACTIVE
            );
            var created = userService.createUser(dentistUser);
            dentist.setUser(resolveUser(created.id()));
        } else if (!isUpdate) {
            dentist.setUser(null);
        }

        if (!isUpdate || request.fullName() != null) {
            dentist.setFullName(request.fullName());
        }
        if (!isUpdate || request.gender() != null) {
            dentist.setGender(request.gender());
        }
        if (!isUpdate || request.address() != null) {
            dentist.setAddress(request.address());
        }
        if (!isUpdate || request.dateOfBirth() != null) {
            dentist.setDateOfBirth(request.dateOfBirth());
        }
        if (!isUpdate || request.experienceYears() != null) {
            dentist.setExperienceYears(request.experienceYears());
        }
        if (!isUpdate || request.qualification() != null) {
            dentist.setEducation(request.qualification());
        }
        if (!isUpdate || request.description() != null) {
            dentist.setDescription(request.description());
        }

        List<String> requestedSpecializations = request.specializations();
        if (requestedSpecializations == null && request.specialization() != null) {
            requestedSpecializations = List.of(request.specialization());
        }

        if (requestedSpecializations != null) {
            dentist.getDentistSpecializations().clear();
            for (String name : requestedSpecializations) {
                String trimmed = name == null ? null : name.trim();
                if (trimmed == null || trimmed.isEmpty()) continue;

                Specialization spec = specializationRepository.findByName(trimmed)
                        .orElseGet(() -> {
                            Specialization s = new Specialization();
                            s.setName(trimmed);
                            return specializationRepository.save(s);
                        });

                DentistSpecialization ds = new DentistSpecialization();
                ds.setDentist(dentist);
                ds.setSpecialization(spec);
                dentist.getDentistSpecializations().add(ds);
            }
        }

        if (request.certificates() != null) {
            dentist.getCertificates().clear();
            for (CertificateCreateRequest cc : request.certificates()) {
                Certificate cert = new Certificate();
                cert.setCertificateName(cc.certificateName());
                cert.setCertificateNumber(cc.certificateNumber());
                cert.setIssuedBy(cc.issuedBy());
                cert.setIssueDate(cc.issueDate());
                cert.setExpiryDate(cc.expiryDate());
                cert.setCertificateFileUrl(cc.certificateFileUrl());
                cert.setDentist(dentist);
                dentist.getCertificates().add(cert);
            }
        }
    }

    private User resolveUser(UUID userId) {
        if (userId == null) {
            return null;
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userId));
    }

    private void validateDentistUserIsAvailable(UUID userId, UUID currentDentistId) {
        if (userId == null) {
            return;
        }
        dentistRepository.findByUserId(userId)
                .filter(dentist -> !dentist.getId().equals(currentDentistId))
                .ifPresent(dentist -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "User is already assigned to another dentist.");
                });
    }

    private Dentist findDentist(UUID id) {
        return dentistRepository.findByIdWithUser(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dentist not found: " + id));
    }

    private DentistResponse toDentistResponse(Dentist dentist) {
        User user = dentist.getUser();
        return new DentistResponse(
                dentist.getId(),
                user != null ? user.getId() : null,
                getDentistDisplayName(dentist, user),
                user != null ? user.getEmail() : null,
                dentist.getExperienceYears(),
                dentist.getEducation()
        );
    }

    private DentistListResponse toDentistListResponse(Dentist dentist) {
        User user = dentist.getUser();
        List<SpecializationDTO> specializations = dentist.getDentistSpecializations()
                .stream()
                .map(ds -> new SpecializationDTO(
                        ds.getSpecialization().getId(),
                        ds.getSpecialization().getName(),
                        ds.getSpecialization().getDescription()
                ))
                .toList();

        List<CertificateDTO> certificates = dentist.getCertificates()
                .stream()
                .map(cert -> new CertificateDTO(
                        cert.getId(),
                        cert.getCertificateName(),
                        cert.getCertificateNumber(),
                        cert.getIssuedBy(),
                        cert.getIssueDate(),
                        cert.getExpiryDate(),
                        cert.getCertificateFileUrl()
                ))
                .toList();

        return new DentistListResponse(
                dentist.getId(),
                user != null ? user.getId() : null,
                user != null ? user.getAvatarUrl() : null,
                getDentistDisplayName(dentist, user),
                user != null ? user.getEmail() : null,
                user != null ? user.getPhone() : null,
                dentist.getGender(),
                dentist.getAddress(),
                dentist.getExperienceYears(),
                dentist.getDateOfBirth(),
                dentist.getEducation(),
                dentist.getDescription(),
                user != null ? user.getCreatedAt() : null,
                user != null ? user.getStatus() : null,
                null,
                specializations,
                certificates
        );
    }

    private String getDentistDisplayName(Dentist dentist, User user) {
        if (dentist.getFullName() != null) {
            return dentist.getFullName();
        }
        return user != null ? user.getUsername() : null;
    }
}

package iuh.fit.backend.user.service;

import iuh.fit.backend.user.dto.DentistRequest;
import iuh.fit.backend.user.dto.DentistResponse;
import iuh.fit.backend.user.entity.Dentist;
import iuh.fit.backend.user.entity.User;
import iuh.fit.backend.user.repository.DentistRepository;
import iuh.fit.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class DentistService {
    private final DentistRepository dentistRepository;
    private final UserRepository userRepository;

    public List<DentistResponse> getAllDentists() {
        return dentistRepository.findAll()
                .stream()
                .map(this::toDentistResponse)
                .toList();
    }

    public DentistResponse getDentistById(UUID id) {
        return toDentistResponse(findDentist(id));
    }

    public DentistResponse createDentist(DentistRequest request) {
        Dentist dentist = new Dentist();
        applyDentistRequest(dentist, request, null);
        return toDentistResponse(dentistRepository.save(dentist));
    }

    public DentistResponse updateDentist(UUID id, DentistRequest request) {
        Dentist dentist = findDentist(id);
        applyDentistRequest(dentist, request, id);
        return toDentistResponse(dentistRepository.save(dentist));
    }

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
        validateDentistUserIsAvailable(request.userId(), currentDentistId);
        dentist.setUser(resolveUser(request.userId()));
        dentist.setLicenseNumber(request.licenseNumber());
        dentist.setSpecialization(request.specialization());
        dentist.setExperienceYears(request.experienceYears());
        dentist.setQualification(request.qualification());
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
        return dentistRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dentist not found: " + id));
    }

    private DentistResponse toDentistResponse(Dentist dentist) {
        User user = dentist.getUser();
        return new DentistResponse(
                dentist.getId(),
                user != null ? user.getId() : null,
                user != null ? user.getUsername() : null,
                dentist.getFullName(),
                user != null ? user.getEmail() : null,
                user != null ? user.getAvatarUrl() : null,
                dentist.getLicenseNumber(),
                dentist.getSpecialization(),
                dentist.getExperienceYears(),
                dentist.getQualification()
        );
    }
}

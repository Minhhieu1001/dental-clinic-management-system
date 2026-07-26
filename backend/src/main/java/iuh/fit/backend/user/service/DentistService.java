package iuh.fit.backend.user.service;

import iuh.fit.backend.user.dto.DentistListResponse;
import iuh.fit.backend.user.dto.DentistRequest;
import iuh.fit.backend.user.dto.DentistResponse;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface DentistService {
    List<DentistResponse> getAllDentists();

    List<DentistListResponse> getDentistsList();

    Map<String, Long> getDentistStats();

    DentistListResponse getDentistById(UUID id);

    DentistResponse createDentist(DentistRequest request);

    DentistListResponse updateDentist(UUID id, DentistRequest request);

    void deleteDentist(UUID id);
}

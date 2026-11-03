package iuh.fit.backend.system.service;

import iuh.fit.backend.system.dto.PrimaryDiagnosisRequest;
import iuh.fit.backend.system.dto.PrimaryDiagnosisResponse;

import java.util.List;
import java.util.UUID;

public interface PrimaryDiagnosisService {
    List<PrimaryDiagnosisResponse> getAll();

    PrimaryDiagnosisResponse getById(UUID id);

    PrimaryDiagnosisResponse create(PrimaryDiagnosisRequest request);

    PrimaryDiagnosisResponse update(UUID id, PrimaryDiagnosisRequest request);

    void delete(UUID id);
}

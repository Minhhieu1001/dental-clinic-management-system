package iuh.fit.backend.system.service.impl;

import iuh.fit.backend.system.dto.PrimaryDiagnosisRequest;
import iuh.fit.backend.system.dto.PrimaryDiagnosisResponse;
import iuh.fit.backend.system.entity.PrimaryDiagnosis;
import iuh.fit.backend.system.repository.PrimaryDiagnosisRepository;
import iuh.fit.backend.system.service.PrimaryDiagnosisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PrimaryDiagnosisServiceImpl implements PrimaryDiagnosisService {
    private final PrimaryDiagnosisRepository repository;

    @Override
    @Transactional(readOnly = true)
    public List<PrimaryDiagnosisResponse> getAll() {
        return repository.findAll().stream()
                .sorted(Comparator.comparing(PrimaryDiagnosis::getPrimaryDiagnosisName,
                        String.CASE_INSENSITIVE_ORDER))
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PrimaryDiagnosisResponse getById(UUID id) {
        return toResponse(findById(id));
    }

    @Override
    @Transactional
    public PrimaryDiagnosisResponse create(PrimaryDiagnosisRequest request) {
        String name = required(request.getPrimaryDiagnosisName(), "Tên chẩn đoán chính");
        if (repository.existsByPrimaryDiagnosisNameIgnoreCase(name)) {
            throw badRequest("Tên chẩn đoán chính đã tồn tại: " + name);
        }

        PrimaryDiagnosis diagnosis = new PrimaryDiagnosis();
        diagnosis.setPrimaryDiagnosisName(name);
        diagnosis.setStatus(request.getStatus() == null || request.getStatus());
        return toResponse(repository.save(diagnosis));
    }

    @Override
    @Transactional
    public PrimaryDiagnosisResponse update(UUID id, PrimaryDiagnosisRequest request) {
        PrimaryDiagnosis diagnosis = findById(id);
        String name = required(request.getPrimaryDiagnosisName(), "Tên chẩn đoán chính");
        if (repository.existsByPrimaryDiagnosisNameIgnoreCaseAndIdNot(name, id)) {
            throw badRequest("Tên chẩn đoán chính đã tồn tại: " + name);
        }

        diagnosis.setPrimaryDiagnosisName(name);
        if (request.getStatus() != null) {
            diagnosis.setStatus(request.getStatus());
        }
        return toResponse(repository.save(diagnosis));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        repository.delete(findById(id));
    }

    private PrimaryDiagnosis findById(UUID id) {
        if (id == null) {
            throw badRequest("ID chẩn đoán chính không hợp lệ");
        }
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy chẩn đoán chính: " + id));
    }

    private PrimaryDiagnosisResponse toResponse(PrimaryDiagnosis diagnosis) {
        return PrimaryDiagnosisResponse.builder()
                .id(diagnosis.getId())
                .primaryDiagnosisName(diagnosis.getPrimaryDiagnosisName())
                .status(diagnosis.isStatus())
                .build();
    }

    private String required(String value, String field) {
        if (value == null || value.isBlank()) {
            throw badRequest(field + " không được để trống");
        }
        return value.trim();
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}

package iuh.fit.backend.treatment.service.impl;

import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.exception.ErrorCode;
import iuh.fit.backend.treatment.dto.TreatmentStatusResponse;
import iuh.fit.backend.treatment.dto.TreatmentPhaseRequest;
import iuh.fit.backend.treatment.dto.TreatmentPhaseResponse;
import iuh.fit.backend.treatment.entity.TreatmentPlan;
import iuh.fit.backend.treatment.repository.TreatmentPlanRepository;
import iuh.fit.backend.treatment.enums.StatusPhase;
import iuh.fit.backend.treatment.entity.TreatmentPhase;
import iuh.fit.backend.treatment.repository.TreatmentPhaseRepository;
import iuh.fit.backend.treatment.service.TreatmentPhaseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TreatmentPhaseServiceImpl implements TreatmentPhaseService {

    private final TreatmentPlanRepository parentRepository;
    private final TreatmentPhaseRepository repository;

    @Override
    @Transactional
    public TreatmentPhaseResponse createTreatmentPhase(UUID parentId, TreatmentPhaseRequest request) {
        if (request.getPhaseName() == null || request.getPhaseName().isBlank()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Tên giai đoạn điều trị không được để trống");
        }
        TreatmentPlan parent = parentRepository.findById(parentId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy đối tượng cha: " + parentId));
        TreatmentPhase entity = new TreatmentPhase();
        entity.setTreatmentPlan(parent);
        entity.setStatus(StatusPhase.PENDING);
        applyRequest(entity, request);
        return toResponse(repository.save(entity));
    }

    @Override
    @Transactional
    public TreatmentPhaseResponse updateTreatmentPhase(UUID id, TreatmentPhaseRequest request) {
        TreatmentPhase entity = findById(id);
        applyRequest(entity, request);
        return toResponse(repository.save(entity));
    }

    @Override
    @Transactional
    public void deleteTreatmentPhase(UUID id) {
        TreatmentPhase entity = findById(id);
        repository.delete(entity);
        repository.flush();
    }

    private TreatmentPhase findById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy giai đoạn điều trị: " + id));
    }

    private void applyRequest(TreatmentPhase entity, TreatmentPhaseRequest request) {
        if (request.getPhaseName() != null && request.getPhaseName().isBlank()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Tên giai đoạn điều trị không được để trống");
        }
        if (request.getPhaseName() != null)
            entity.setPhaseName(request.getPhaseName());
        if (request.getPhaseOrder() != null)
            entity.setPhaseOrder(request.getPhaseOrder());
        if (request.getTreatmentType() != null)
            entity.setTreatmentType(request.getTreatmentType());
        if (request.getDescription() != null)
            entity.setDescription(request.getDescription());
        if (request.getStatus() != null)
            entity.setStatus(request.getStatus());
        if (request.getEstimatedDuration() != null)
            entity.setEstimatedDuration(request.getEstimatedDuration());
        if (request.getExpectedStartDate() != null)
            entity.setExpectedStartDate(request.getExpectedStartDate());
        if (request.getExpectedEndDate() != null)
            entity.setExpectedEndDate(request.getExpectedEndDate());
        if (entity.getExpectedStartDate() != null && entity.getExpectedEndDate() != null
                && entity.getExpectedEndDate().isBefore(entity.getExpectedStartDate())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Ngày kết thúc phải từ ngày bắt đầu trở đi");
        }
    }

    private TreatmentPhaseResponse toResponse(TreatmentPhase entity) {
        return new TreatmentPhaseResponse(entity.getId(), entity.getTreatmentPlan().getId(),
                entity.getPhaseName(), entity.getPhaseOrder(), entity.getTreatmentType(), entity.getDescription(),
                entity.getStatus(), entity.getEstimatedDuration(), entity.getExpectedStartDate(),
                entity.getExpectedEndDate());
    }

    @Override
    @Transactional
    public TreatmentStatusResponse updateTreatmentPhaseStatus(UUID id, StatusPhase status) {
        if (status == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Trạng thái điều trị không được để trống");
        }
        TreatmentPhase entity = repository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy giai đoạn điều trị với ID: " + id));
        entity.setStatus(status);
        repository.save(entity);
        return new TreatmentStatusResponse(id, entity.getStatus());
    }
}

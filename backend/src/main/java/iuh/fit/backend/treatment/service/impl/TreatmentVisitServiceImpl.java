package iuh.fit.backend.treatment.service.impl;

import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.exception.ErrorCode;
import iuh.fit.backend.treatment.dto.TreatmentStatusResponse;
import iuh.fit.backend.treatment.dto.TreatmentVisitRequest;
import iuh.fit.backend.treatment.dto.TreatmentVisitResponse;
import iuh.fit.backend.treatment.entity.TreatmentPhase;
import iuh.fit.backend.treatment.repository.TreatmentPhaseRepository;
import iuh.fit.backend.treatment.enums.StatusPhase;
import iuh.fit.backend.treatment.entity.TreatmentVisits;
import iuh.fit.backend.treatment.repository.TreatmentVisitsRepository;
import iuh.fit.backend.treatment.service.TreatmentVisitService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TreatmentVisitServiceImpl implements TreatmentVisitService {

    private final TreatmentPhaseRepository parentRepository;
    private final TreatmentVisitsRepository repository;

    @Override
    @Transactional
    public TreatmentVisitResponse createTreatmentVisit(UUID parentId, TreatmentVisitRequest request) {
        if (request.getVisitName() == null || request.getVisitName().isBlank()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Tên buổi điều trị không được để trống");
        }
        TreatmentPhase parent = parentRepository.findById(parentId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy đối tượng cha: " + parentId));
        TreatmentVisits entity = new TreatmentVisits();
        entity.setTreatmentPhase(parent);
        entity.setStatus(StatusPhase.PENDING);
        applyRequest(entity, request);
        return toResponse(repository.save(entity));
    }

    @Override
    @Transactional
    public TreatmentVisitResponse updateTreatmentVisit(UUID id, TreatmentVisitRequest request) {
        TreatmentVisits entity = findById(id);
        applyRequest(entity, request);
        return toResponse(repository.save(entity));
    }

    @Override
    @Transactional
    public void deleteTreatmentVisit(UUID id) {
        TreatmentVisits entity = findById(id);
        repository.delete(entity);
        repository.flush();
    }

    private TreatmentVisits findById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy buổi điều trị: " + id));
    }

    private void applyRequest(TreatmentVisits entity, TreatmentVisitRequest request) {
        if (request.getVisitName() != null && request.getVisitName().isBlank()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Tên buổi điều trị không được để trống");
        }
        if (request.getVisitOrder() != null && request.getVisitOrder() < 1) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Thứ tự buổi điều trị phải lớn hơn 0");
        }
        if (request.getVisitName() != null) entity.setVisitName(request.getVisitName());
        if (request.getVisitOrder() != null) entity.setVisitOrder(request.getVisitOrder());
        if (request.getStartDate() != null) entity.setStartDate(request.getStartDate());
        if (request.getStatus() != null) entity.setStatus(request.getStatus());
        if (request.getClinicalNotes() != null) entity.setClinicalNotes(request.getClinicalNotes());
        if (request.getAssignedDentist() != null) entity.setAssignedDentist(request.getAssignedDentist());
        if (request.getFacilityName() != null) entity.setFacilityName(request.getFacilityName());
        if (request.getFacilityAddress() != null) entity.setFacilityAddress(request.getFacilityAddress());
    }

    private TreatmentVisitResponse toResponse(TreatmentVisits entity) {
        return new TreatmentVisitResponse(entity.getVisitId(), entity.getTreatmentPhase().getId(),
                entity.getVisitName(), entity.getVisitOrder(), entity.getStartDate(), entity.getStatus(),
                entity.getClinicalNotes(), entity.getAssignedDentist(), entity.getFacilityName(), entity.getFacilityAddress());
    }

    @Override
    @Transactional
    public TreatmentStatusResponse updateTreatmentVisitStatus(UUID id, StatusPhase status) {
        if (status == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Trạng thái điều trị không được để trống");
        }
        TreatmentVisits entity = repository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy buổi điều trị với ID: " + id));
        entity.setStatus(status);
        repository.save(entity);
        return new TreatmentStatusResponse(id, entity.getStatus());
    }
}

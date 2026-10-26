package iuh.fit.backend.treatment.service.impl;

import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.exception.ErrorCode;
import iuh.fit.backend.treatment.dto.TreatmentServiceRequest;
import iuh.fit.backend.treatment.dto.TreatmentServiceResponse;
import iuh.fit.backend.treatment.entity.TreatmentPhase;
import iuh.fit.backend.treatment.entity.TreatmentService;
import iuh.fit.backend.treatment.repository.ServiceRepository;
import iuh.fit.backend.treatment.repository.TreatmentPhaseRepository;
import iuh.fit.backend.treatment.repository.TreatmentServiceRepository;
import iuh.fit.backend.treatment.service.TreatmentServiceI;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TreatmentServiceImpl implements TreatmentServiceI {
    private static final BigDecimal MAX_AMOUNT = new BigDecimal("9999999999999.99");

    private final TreatmentServiceRepository repository;
    private final TreatmentPhaseRepository phaseRepository;
    private final ServiceRepository serviceRepository;

    @Override
    @Transactional
    public TreatmentServiceResponse createTreatmentService(UUID phaseId, TreatmentServiceRequest request) {
        validateRequest(request);
        if (request.getServiceId() == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Vui lòng chọn dịch vụ");
        }
        TreatmentPhase phase = phaseRepository.findById(phaseId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy giai đoạn điều trị: " + phaseId));
        TreatmentService entity = new TreatmentService();
        entity.setTreatmentPhase(phase);
        entity.setQuantity(request.getQuantity() != null ? request.getQuantity() : 1);
        selectService(entity, request.getServiceId());
        applyRequest(entity, request);
        return toResponse(repository.save(entity));
    }

    @Override
    @Transactional
    public TreatmentServiceResponse updateTreatmentService(UUID id, TreatmentServiceRequest request) {
        validateRequest(request);
        TreatmentService entity = findById(id);
        ensureNotInvoiced(id);
        // Preserve the agreed price unless the selected catalog service changes.
        if (request.getServiceId() != null
                && (entity.getService() == null || !request.getServiceId().equals(entity.getService().getId()))) {
            selectService(entity, request.getServiceId());
        }
        applyRequest(entity, request);
        return toResponse(repository.save(entity));
    }

    @Override
    @Transactional
    public void deleteTreatmentService(UUID id) {
        TreatmentService entity = findById(id);
        ensureNotInvoiced(id);
        repository.delete(entity);
        repository.flush();
    }

    private TreatmentService findById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy dịch vụ điều trị: " + id));
    }

    private void ensureNotInvoiced(UUID id) {
        if (repository.existsInvoiceReference(id.toString())) {
            throw new AppException(ErrorCode.RESOURCE_IN_USE,
                    "Dịch vụ điều trị đã được lập hóa đơn, không thể sửa hoặc xóa");
        }
    }

    private void selectService(TreatmentService entity, UUID serviceId) {
        iuh.fit.backend.treatment.entity.Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy dịch vụ trong danh mục: " + serviceId));
        if (Boolean.FALSE.equals(service.getIsActive())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Dịch vụ đã ngừng hoạt động");
        }
        entity.setService(service);
        entity.setServiceName(service.getServiceName());
        entity.setPrice(service.getPrice());
    }

    private void applyRequest(TreatmentService entity, TreatmentServiceRequest request) {
        if (request.getToothNumber() != null) entity.setToothNumber(request.getToothNumber());
        if (request.getQuantity() != null) entity.setQuantity(request.getQuantity());
        if (request.getPrice() != null) entity.setPrice(request.getPrice());
        if (entity.getQuantity() == null || entity.getQuantity() <= 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Số lượng phải lớn hơn 0");
        }
        BigDecimal price = validateAmount(entity.getPrice(), "Đơn giá");
        BigDecimal total = validateAmount(price.multiply(BigDecimal.valueOf(entity.getQuantity())), "Thành tiền");
        entity.setPrice(price);
        entity.setTotalAmount(total);
    }

    private void validateRequest(TreatmentServiceRequest request) {
        if (request == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Dữ liệu dịch vụ không được để trống");
        }
        if (request.getQuantity() != null && request.getQuantity() <= 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Số lượng phải lớn hơn 0");
        }
        if (request.getToothNumber() != null && request.getToothNumber().length() > 50) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Số răng không được vượt quá 50 ký tự");
        }
        if (request.getPrice() != null) validateAmount(request.getPrice(), "Đơn giá");
    }

    private BigDecimal validateAmount(BigDecimal amount, String fieldName) {
        if (amount == null || amount.signum() < 0 || amount.compareTo(MAX_AMOUNT) > 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    fieldName + " phải nằm trong khoảng 0 đến " + MAX_AMOUNT);
        }
        try {
            return amount.setScale(2, RoundingMode.UNNECESSARY);
        } catch (ArithmeticException ex) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    fieldName + " chỉ được có tối đa 2 chữ số thập phân");
        }
    }

    private TreatmentServiceResponse toResponse(TreatmentService entity) {
        return new TreatmentServiceResponse(entity.getId(), entity.getTreatmentPhase().getId(),
                entity.getService() != null ? entity.getService().getId() : null,
                entity.getServiceName(), entity.getToothNumber(), entity.getQuantity(),
                entity.getPrice(), entity.getTotalAmount());
    }
}

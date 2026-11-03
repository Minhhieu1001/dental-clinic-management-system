package iuh.fit.backend.system.service.impl;

import iuh.fit.backend.system.dto.ToothStatusRequest;
import iuh.fit.backend.system.dto.ToothStatusResponse;
import iuh.fit.backend.system.entity.ToothStatus;
import iuh.fit.backend.system.repository.ToothStatusRepository;
import iuh.fit.backend.system.service.ToothStatusService;
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
public class ToothStatusServiceImpl implements ToothStatusService {
    private final ToothStatusRepository repository;

    @Override
    @Transactional(readOnly = true)
    public List<ToothStatusResponse> getAll() {
        return repository.findAll().stream()
                .sorted(Comparator.comparing(ToothStatus::getToothCode, String.CASE_INSENSITIVE_ORDER))
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ToothStatusResponse getById(UUID id) {
        return toResponse(findById(id));
    }

    @Override
    @Transactional
    public ToothStatusResponse create(ToothStatusRequest request) {
        String toothCode = required(request.getToothCode(), "Mã răng");
        if (repository.existsByToothCodeIgnoreCase(toothCode)) {
            throw badRequest("Mã răng đã tồn tại: " + toothCode);
        }

        ToothStatus status = new ToothStatus();
        apply(status, request);
        return toResponse(repository.save(status));
    }

    @Override
    @Transactional
    public ToothStatusResponse update(UUID id, ToothStatusRequest request) {
        ToothStatus status = findById(id);
        String toothCode = required(request.getToothCode(), "Mã răng");
        if (repository.existsByToothCodeIgnoreCaseAndIdNot(toothCode, id)) {
            throw badRequest("Mã răng đã tồn tại: " + toothCode);
        }

        apply(status, request);
        return toResponse(repository.save(status));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        repository.delete(findById(id));
    }

    private ToothStatus findById(UUID id) {
        if (id == null) {
            throw badRequest("ID trạng thái răng không hợp lệ");
        }
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy trạng thái răng: " + id));
    }

    private void apply(ToothStatus status, ToothStatusRequest request) {
        status.setToothCode(required(request.getToothCode(), "Mã răng"));
        status.setLabel(required(request.getLabel(), "Tên trạng thái răng"));
        status.setColor(required(request.getColor(), "Màu trạng thái"));
    }

    private ToothStatusResponse toResponse(ToothStatus status) {
        return ToothStatusResponse.builder()
                .id(status.getId())
                .toothCode(status.getToothCode())
                .label(status.getLabel())
                .color(status.getColor())
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

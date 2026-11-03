package iuh.fit.backend.system.service;

import iuh.fit.backend.system.dto.ToothStatusRequest;
import iuh.fit.backend.system.dto.ToothStatusResponse;

import java.util.List;
import java.util.UUID;

public interface ToothStatusService {
    List<ToothStatusResponse> getAll();

    ToothStatusResponse getById(UUID id);

    ToothStatusResponse create(ToothStatusRequest request);

    ToothStatusResponse update(UUID id, ToothStatusRequest request);

    void delete(UUID id);
}

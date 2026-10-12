package iuh.fit.backend.inforclinic.service;

import iuh.fit.backend.inforclinic.dto.ClinicRequest;
import iuh.fit.backend.inforclinic.dto.ClinicResponse;

import java.util.List;

public interface ClinicService {
    List<ClinicResponse> getAll();
    ClinicResponse getById(String clinicId);
    ClinicResponse create(ClinicRequest request);
    ClinicResponse update(String clinicId, ClinicRequest request);
    void delete(String clinicId);
}

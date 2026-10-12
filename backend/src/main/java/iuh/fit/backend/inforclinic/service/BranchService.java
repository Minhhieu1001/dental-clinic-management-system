package iuh.fit.backend.inforclinic.service;

import iuh.fit.backend.inforclinic.dto.BranchRequest;
import iuh.fit.backend.inforclinic.dto.BranchResponse;

import java.util.List;

public interface BranchService {
    List<BranchResponse> getAll();
    List<BranchResponse> getByClinicId(String clinicId);
    BranchResponse getById(String branchId);
    BranchResponse create(BranchRequest request);
    BranchResponse update(String branchId, BranchRequest request);
    void delete(String branchId);
}

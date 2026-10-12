package iuh.fit.backend.inforclinic.service.impl;

import iuh.fit.backend.inforclinic.dto.BranchRequest;
import iuh.fit.backend.inforclinic.dto.BranchResponse;
import iuh.fit.backend.inforclinic.entity.Branch;
import iuh.fit.backend.inforclinic.entity.Clinic;
import iuh.fit.backend.inforclinic.enums.BranchStatus;
import iuh.fit.backend.inforclinic.repository.BranchRepository;
import iuh.fit.backend.inforclinic.repository.ClinicRepository;
import iuh.fit.backend.inforclinic.service.BranchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BranchServiceImpl implements BranchService {
    private final BranchRepository branchRepository;
    private final ClinicRepository clinicRepository;

    @Override
    @Transactional(readOnly = true)
    public List<BranchResponse> getAll() {
        return branchRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BranchResponse> getByClinicId(String clinicId) {
        Clinic clinic = findClinic(clinicId);
        return branchRepository.findAllByClinicClinicIdOrderByBranchNameAsc(clinic.getClinicId())
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BranchResponse getById(String branchId) {
        return toResponse(findBranch(branchId));
    }

    @Override
    @Transactional
    public BranchResponse create(BranchRequest request) {
        String branchCode = normalizeRequired(request.getBranchCode(), "Mã chi nhánh");
        if (branchRepository.existsByBranchCodeIgnoreCase(branchCode)) {
            throw badRequest("Mã chi nhánh đã tồn tại: " + branchCode);
        }

        Branch branch = new Branch();
        branch.setBranchId(UUID.randomUUID().toString());
        branch.setBranchCode(branchCode);
        applyRequest(branch, request);
        return toResponse(branchRepository.save(branch));
    }

    @Override
    @Transactional
    public BranchResponse update(String branchId, BranchRequest request) {
        Branch branch = findBranch(branchId);
        String branchCode = normalizeRequired(request.getBranchCode(), "Mã chi nhánh");
        if (branchRepository.existsByBranchCodeIgnoreCaseAndBranchIdNot(branchCode, branchId)) {
            throw badRequest("Mã chi nhánh đã tồn tại: " + branchCode);
        }

        branch.setBranchCode(branchCode);
        applyRequest(branch, request);
        return toResponse(branchRepository.save(branch));
    }

    @Override
    @Transactional
    public void delete(String branchId) {
        branchRepository.delete(findBranch(branchId));
    }

    private void applyRequest(Branch branch, BranchRequest request) {
        branch.setClinic(findClinic(request.getClinicId()));
        branch.setBranchName(normalizeRequired(request.getBranchName(), "Tên chi nhánh"));
        branch.setPhoneNumber(trimToNull(request.getPhoneNumber()));
        branch.setEmail(trimToNull(request.getEmail()));
        branch.setAddress(trimToNull(request.getAddress()));
        branch.setOpenTime(request.getOpenTime());
        branch.setCloseTime(request.getCloseTime());
        branch.setImageBranch(trimToNull(request.getImageBranch()));
        branch.setStatus(request.getStatus() != null ? request.getStatus() : BranchStatus.ACTIVE);
        if (branch.getOpenTime() != null && branch.getCloseTime() != null
                && !branch.getCloseTime().isAfter(branch.getOpenTime())) {
            throw badRequest("Giờ đóng cửa phải sau giờ mở cửa");
        }
    }

    private BranchResponse toResponse(Branch branch) {
        Clinic clinic = branch.getClinic();
        return BranchResponse.builder()
                .branchId(branch.getBranchId())
                .clinicId(clinic.getClinicId())
                .clinicCode(clinic.getClinicCode())
                .branchCode(branch.getBranchCode())
                .branchName(branch.getBranchName())
                .phoneNumber(branch.getPhoneNumber())
                .email(branch.getEmail())
                .address(branch.getAddress())
                .openTime(branch.getOpenTime())
                .closeTime(branch.getCloseTime())
                .imageBranch(branch.getImageBranch())
                .status(branch.getStatus())
                .build();
    }

    private Branch findBranch(String branchId) {
        return branchRepository.findById(requireId(branchId, "branchId"))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy chi nhánh: " + branchId));
    }

    private Clinic findClinic(String clinicId) {
        return clinicRepository.findById(requireId(clinicId, "clinicId"))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy phòng khám: " + clinicId));
    }

    private String requireId(String value, String field) {
        if (value == null || value.isBlank()) {
            throw badRequest(field + " không được để trống");
        }
        return value.trim();
    }

    private String normalizeRequired(String value, String field) {
        String normalized = trimToNull(value);
        if (normalized == null) throw badRequest(field + " không được để trống");
        return normalized;
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}

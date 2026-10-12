package iuh.fit.backend.inforclinic.service.impl;

import iuh.fit.backend.inforclinic.dto.BranchResponse;
import iuh.fit.backend.inforclinic.dto.ClinicRequest;
import iuh.fit.backend.inforclinic.dto.ClinicResponse;
import iuh.fit.backend.inforclinic.entity.Clinic;
import iuh.fit.backend.inforclinic.repository.ClinicRepository;
import iuh.fit.backend.inforclinic.service.ClinicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClinicServiceImpl implements ClinicService {
    private final ClinicRepository clinicRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ClinicResponse> getAll() {
        return clinicRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ClinicResponse getById(String clinicId) {
        return toResponse(findClinic(clinicId));
    }

    @Override
    @Transactional
    public ClinicResponse create(ClinicRequest request) {
        String clinicCode = normalizeRequired(request.getClinicCode(), "Mã phòng khám");
        if (clinicRepository.existsByClinicCodeIgnoreCase(clinicCode)) {
            throw badRequest("Mã phòng khám đã tồn tại: " + clinicCode);
        }

        Clinic clinic = new Clinic();
        clinic.setClinicId(UUID.randomUUID().toString());
        clinic.setClinicCode(clinicCode);
        applyRequest(clinic, request);
        return toResponse(clinicRepository.save(clinic));
    }

    @Override
    @Transactional
    public ClinicResponse update(String clinicId, ClinicRequest request) {
        Clinic clinic = findClinic(clinicId);
        String clinicCode = normalizeRequired(request.getClinicCode(), "Mã phòng khám");
        if (clinicRepository.existsByClinicCodeIgnoreCaseAndClinicIdNot(clinicCode, clinicId)) {
            throw badRequest("Mã phòng khám đã tồn tại: " + clinicCode);
        }

        clinic.setClinicCode(clinicCode);
        applyRequest(clinic, request);
        return toResponse(clinicRepository.save(clinic));
    }

    @Override
    @Transactional
    public void delete(String clinicId) {
        clinicRepository.delete(findClinic(clinicId));
    }

    private Clinic findClinic(String clinicId) {
        return clinicRepository.findById(requireId(clinicId, "clinicId"))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy phòng khám: " + clinicId));
    }

    private void applyRequest(Clinic clinic, ClinicRequest request) {
        clinic.setBrandName(trimToNull(request.getBrandName()));
        clinic.setLegalName(trimToNull(request.getLegalName()));
        clinic.setTaxCode(trimToNull(request.getTaxCode()));
        clinic.setBusinessLicenseNo(trimToNull(request.getBusinessLicenseNo()));
        clinic.setEstablishedYear(request.getEstablishedYear());
        clinic.setRepresentative(trimToNull(request.getRepresentative()));
        clinic.setPhoneNumber(trimToNull(request.getPhoneNumber()));
        clinic.setEmail(trimToNull(request.getEmail()));
        clinic.setLogoUrl(trimToNull(request.getLogoUrl()));
        clinic.setRegisteredAddress(trimToNull(request.getRegisteredAddress()));
        clinic.setDescription(request.getDescription());
        clinic.setImage(trimToNull(request.getImage()));
    }

    private ClinicResponse toResponse(Clinic clinic) {
        return ClinicResponse.builder()
                .clinicId(clinic.getClinicId())
                .clinicCode(clinic.getClinicCode())
                .brandName(clinic.getBrandName())
                .legalName(clinic.getLegalName())
                .taxCode(clinic.getTaxCode())
                .businessLicenseNo(clinic.getBusinessLicenseNo())
                .establishedYear(clinic.getEstablishedYear())
                .representative(clinic.getRepresentative())
                .phoneNumber(clinic.getPhoneNumber())
                .email(clinic.getEmail())
                .logoUrl(clinic.getLogoUrl())
                .registeredAddress(clinic.getRegisteredAddress())
                .description(clinic.getDescription())
                .image(clinic.getImage())
                .createdAt(clinic.getCreatedAt())
                .updatedAt(clinic.getUpdatedAt())
                .branches(clinic.getBranches().stream().map(branch ->
                        BranchResponse.builder()
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
                                .build()).toList())
                .build();
    }

    private String requireId(String value, String field) {
        if (value == null || value.isBlank()) {
            throw badRequest(field + " không được để trống");
        }
        return value.trim();
    }

    private String normalizeRequired(String value, String field) {
        String normalized = trimToNull(value);
        if (normalized == null) {
            throw badRequest(field + " không được để trống");
        }
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

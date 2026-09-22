package iuh.fit.backend.prescription.service.impl;

import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.exception.ErrorCode;
import iuh.fit.backend.prescription.dto.MedicineDTO;
import iuh.fit.backend.prescription.dto.MedicineRequestDTO;
import iuh.fit.backend.prescription.entity.Medicine;
import iuh.fit.backend.prescription.enums.MedicineStatus;
import iuh.fit.backend.prescription.repository.MedicineRepository;
import iuh.fit.backend.prescription.service.MedicineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import iuh.fit.backend.prescription.dto.MedicineSummaryDTO;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MedicineServiceImpl implements MedicineService {

    private final MedicineRepository medicineRepository;

    @Override
    @Transactional(readOnly = true)
    public List<MedicineDTO> getAllMedicines(String keyword, MedicineStatus status, String unit, String stockStatus, String sortBy) {
        String cleanKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        String cleanUnit = (unit != null && !unit.trim().isEmpty() && !"ALL".equalsIgnoreCase(unit.trim())) ? unit.trim() : null;
        String cleanStockStatus = (stockStatus != null && !stockStatus.trim().isEmpty() && !"ALL".equalsIgnoreCase(stockStatus.trim())) ? stockStatus.trim() : null;

        Sort sort = mapSort(sortBy);
        List<Medicine> list = medicineRepository.searchMedicinesAdvanced(cleanKeyword, status, cleanUnit, cleanStockStatus, sort);
        return list.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getDistinctUnits() {
        return medicineRepository.findDistinctUnits();
    }

    @Override
    @Transactional(readOnly = true)
    public MedicineSummaryDTO getSummary() {
        List<Medicine> all = medicineRepository.findAll();
        LocalDate today = LocalDate.now();
        LocalDate warningThreshold = today.plusDays(60);

        long total = all.size();
        long active = 0;
        long inactive = 0;
        long lowStock = 0;
        long outOfStock = 0;
        long expiringSoon = 0;
        long expired = 0;
        long totalStock = 0;
        BigDecimal totalValuation = BigDecimal.ZERO;

        for (Medicine m : all) {
            if (m.getStatus() == MedicineStatus.ACTIVE) active++;
            else inactive++;

            int qty = m.getStockQuantity() != null ? m.getStockQuantity() : 0;
            totalStock += qty;
            if (m.getPrice() != null) {
                totalValuation = totalValuation.add(m.getPrice().multiply(BigDecimal.valueOf(qty)));
            }

            if (qty <= 0) outOfStock++;
            else if (qty < 30) lowStock++;

            if (m.getExpiryDate() != null) {
                if (m.getExpiryDate().isBefore(today)) {
                    expired++;
                } else if (!m.getExpiryDate().isAfter(warningThreshold)) {
                    expiringSoon++;
                }
            }
        }

        return MedicineSummaryDTO.builder()
                .total(total)
                .active(active)
                .inactive(inactive)
                .lowStock(lowStock)
                .outOfStock(outOfStock)
                .expiringSoon(expiringSoon)
                .expired(expired)
                .totalStock(totalStock)
                .totalValuation(totalValuation)
                .build();
    }

    private Sort mapSort(String sortBy) {
        if (sortBy == null || sortBy.trim().isEmpty() || "DEFAULT".equalsIgnoreCase(sortBy)) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        switch (sortBy.toUpperCase()) {
            case "NAME_ASC":
                return Sort.by(Sort.Direction.ASC, "name");
            case "NAME_DESC":
                return Sort.by(Sort.Direction.DESC, "name");
            case "PRICE_ASC":
                return Sort.by(Sort.Direction.ASC, "price");
            case "PRICE_DESC":
                return Sort.by(Sort.Direction.DESC, "price");
            case "STOCK_ASC":
                return Sort.by(Sort.Direction.ASC, "stockQuantity");
            case "STOCK_DESC":
                return Sort.by(Sort.Direction.DESC, "stockQuantity");
            case "EXPIRY_ASC":
                return Sort.by(Sort.Direction.ASC, "expiryDate");
            default:
                return Sort.by(Sort.Direction.DESC, "createdAt");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public MedicineDTO getMedicineById(UUID id) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy thông tin thuốc với ID: " + id));
        return mapToDTO(medicine);
    }

    @Override
    @Transactional(readOnly = true)
    public MedicineDTO getMedicineByCode(String code) {
        Medicine medicine = medicineRepository.findByCode(code)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy thông tin thuốc với mã: " + code));
        return mapToDTO(medicine);
    }

    @Override
    @Transactional
    public MedicineDTO createMedicine(MedicineRequestDTO request) {
        String code = request.getCode().trim().toUpperCase();

        if (medicineRepository.existsByCode(code)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Mã thuốc '" + code + "' đã tồn tại trong hệ thống. Vui lòng nhập mã khác.");
        }

        validateDates(request.getManufactureDate(), request.getExpiryDate());

        Medicine medicine = Medicine.builder()
                .code(code)
                .name(request.getName().trim())
                .unit(request.getUnit().trim())
                .manufacturer(request.getManufacturer() != null ? request.getManufacturer().trim() : null)
                .stockQuantity(request.getStockQuantity() != null ? request.getStockQuantity() : 0)
                .price(request.getPrice())
                .manufactureDate(request.getManufactureDate())
                .expiryDate(request.getExpiryDate())
                .description(request.getDescription())
                .usageInstruction(request.getUsageInstruction())
                .status(request.getStatus() != null ? request.getStatus() : MedicineStatus.ACTIVE)
                .build();

        Medicine saved = medicineRepository.save(medicine);
        log.info("Đã tạo mới thuốc: {} ({})", saved.getName(), saved.getCode());
        return mapToDTO(saved);
    }

    @Override
    @Transactional
    public MedicineDTO updateMedicine(UUID id, MedicineRequestDTO request) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy thông tin thuốc với ID: " + id));

        String newCode = request.getCode().trim().toUpperCase();
        if (medicineRepository.existsByCodeAndIdNot(newCode, id)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Mã thuốc '" + newCode + "' đã trùng với một loại thuốc khác.");
        }

        validateDates(request.getManufactureDate(), request.getExpiryDate());

        medicine.setCode(newCode);
        medicine.setName(request.getName().trim());
        medicine.setUnit(request.getUnit().trim());
        medicine.setManufacturer(request.getManufacturer() != null ? request.getManufacturer().trim() : null);
        medicine.setStockQuantity(request.getStockQuantity() != null ? request.getStockQuantity() : 0);
        medicine.setPrice(request.getPrice());
        medicine.setManufactureDate(request.getManufactureDate());
        medicine.setExpiryDate(request.getExpiryDate());
        medicine.setDescription(request.getDescription());
        medicine.setUsageInstruction(request.getUsageInstruction());
        if (request.getStatus() != null) {
            medicine.setStatus(request.getStatus());
        }

        Medicine updated = medicineRepository.save(medicine);
        log.info("Đã cập nhật thông tin thuốc: {} ({})", updated.getName(), updated.getCode());
        return mapToDTO(updated);
    }

    @Override
    @Transactional
    public MedicineDTO updateStatus(UUID id, MedicineStatus status) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy thông tin thuốc với ID: " + id));

        medicine.setStatus(status);
        Medicine updated = medicineRepository.save(medicine);
        log.info("Đã chuyển trạng thái thuốc {} ({}) sang {}", updated.getName(), updated.getCode(), status);
        return mapToDTO(updated);
    }

    @Override
    @Transactional
    public void deleteMedicine(UUID id) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy thông tin thuốc với ID: " + id));

        if (medicine.getPrescriptionDetails() != null && !medicine.getPrescriptionDetails().isEmpty()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "Không thể xóa thuốc '" + medicine.getName() + "' vì thuốc đã được kê trong đơn thuốc bệnh nhân. Bạn có thể chuyển trạng thái sang 'Ngừng bán' thay vì xóa!");
        }

        medicineRepository.delete(medicine);
        log.info("Đã xóa thuốc: {} ({})", medicine.getName(), medicine.getCode());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MedicineDTO> getExpiringSoon(int days) {
        LocalDate today = LocalDate.now();
        LocalDate threshold = today.plusDays(days > 0 ? days : 60);
        return medicineRepository.findExpiringSoon(today, threshold)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MedicineDTO> getLowStock(int threshold) {
        int limit = threshold >= 0 ? threshold : 30;
        return medicineRepository.findLowStock(limit)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private void validateDates(LocalDate manufactureDate, LocalDate expiryDate) {
        if (manufactureDate != null && expiryDate != null) {
            if (expiryDate.isBefore(manufactureDate)) {
                throw new AppException(ErrorCode.VALIDATION_ERROR, "Hạn sử dụng không thể trước ngày sản xuất.");
            }
        }
    }

    private MedicineDTO mapToDTO(Medicine medicine) {
        LocalDate today = LocalDate.now();
        Long daysUntilExpiry = null;
        boolean isExpired = false;
        boolean isExpiringSoon = false;

        if (medicine.getExpiryDate() != null) {
            daysUntilExpiry = ChronoUnit.DAYS.between(today, medicine.getExpiryDate());
            if (medicine.getExpiryDate().isBefore(today)) {
                isExpired = true;
            } else if (daysUntilExpiry <= 60) {
                isExpiringSoon = true;
            }
        }

        String stockStatus = "IN_STOCK";
        if (medicine.getStockQuantity() == null || medicine.getStockQuantity() <= 0) {
            stockStatus = "OUT_OF_STOCK";
        } else if (medicine.getStockQuantity() < 30) {
            stockStatus = "LOW_STOCK";
        }

        String statusLabel = (medicine.getStatus() == MedicineStatus.ACTIVE) ? "Đang bán" : "Ngừng bán";

        return MedicineDTO.builder()
                .id(medicine.getId())
                .code(medicine.getCode())
                .name(medicine.getName())
                .unit(medicine.getUnit())
                .manufacturer(medicine.getManufacturer())
                .stockQuantity(medicine.getStockQuantity())
                .price(medicine.getPrice())
                .manufactureDate(medicine.getManufactureDate())
                .expiryDate(medicine.getExpiryDate())
                .description(medicine.getDescription())
                .usageInstruction(medicine.getUsageInstruction())
                .status(medicine.getStatus())
                .statusLabel(statusLabel)
                .stockStatus(stockStatus)
                .daysUntilExpiry(daysUntilExpiry)
                .isExpiringSoon(isExpiringSoon)
                .isExpired(isExpired)
                .createdAt(medicine.getCreatedAt())
                .updatedAt(medicine.getUpdatedAt())
                .build();
    }
}

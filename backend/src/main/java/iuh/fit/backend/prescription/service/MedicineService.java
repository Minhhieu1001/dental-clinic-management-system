package iuh.fit.backend.prescription.service;

import iuh.fit.backend.prescription.dto.MedicineDTO;
import iuh.fit.backend.prescription.dto.MedicineRequestDTO;
import iuh.fit.backend.prescription.dto.MedicineSummaryDTO;
import iuh.fit.backend.prescription.enums.MedicineStatus;

import java.util.List;
import java.util.UUID;

public interface MedicineService {

    List<MedicineDTO> getAllMedicines(String keyword, MedicineStatus status, String unit, String stockStatus, String sortBy);

    List<String> getDistinctUnits();

    MedicineSummaryDTO getSummary();

    MedicineDTO getMedicineById(UUID id);

    MedicineDTO getMedicineByCode(String code);

    MedicineDTO createMedicine(MedicineRequestDTO request);

    MedicineDTO updateMedicine(UUID id, MedicineRequestDTO request);

    MedicineDTO updateStatus(UUID id, MedicineStatus status);

    void deleteMedicine(UUID id);

    List<MedicineDTO> getExpiringSoon(int days);

    List<MedicineDTO> getLowStock(int threshold);
}

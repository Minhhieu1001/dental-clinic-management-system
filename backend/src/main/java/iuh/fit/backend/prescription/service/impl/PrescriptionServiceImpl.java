package iuh.fit.backend.prescription.service.impl;

import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.exception.ErrorCode;
import iuh.fit.backend.medicalrecord.entity.ExaminationResult;
import iuh.fit.backend.medicalrecord.repository.ExaminationResultRepository;
import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.prescription.dto.PrescriptionDTO;
import iuh.fit.backend.prescription.dto.PrescriptionDetailDTO;
import iuh.fit.backend.prescription.dto.PrescriptionDetailRequestDTO;
import iuh.fit.backend.prescription.dto.PrescriptionRequestDTO;
import iuh.fit.backend.prescription.entity.Medicine;
import iuh.fit.backend.prescription.entity.Prescription;
import iuh.fit.backend.prescription.entity.PrescriptionDetail;
import iuh.fit.backend.prescription.repository.MedicineRepository;
import iuh.fit.backend.prescription.repository.PrescriptionRepository;
import iuh.fit.backend.prescription.service.PrescriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PrescriptionServiceImpl implements PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final ExaminationResultRepository examinationResultRepository;
    private final MedicineRepository medicineRepository;

    @Override
    @Transactional(readOnly = true)
    public List<PrescriptionDTO> getAllPrescriptions(UUID patientId, UUID examinationResultId, String patientCode) {
        List<Prescription> list;
        if (examinationResultId != null) {
            list = prescriptionRepository.findByExaminationResultId(examinationResultId);
        } else if (patientId != null) {
            list = prescriptionRepository.findByPatientId(patientId);
        } else if (patientCode != null && !patientCode.isBlank()) {
            list = prescriptionRepository.findByPatientCode(patientCode.trim());
        } else {
            list = prescriptionRepository.findAllByOrderByPrescriptionDateDesc();
        }
        return list.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PrescriptionDTO getPrescriptionById(UUID id) {
        Prescription p = prescriptionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND,"Không tìm thấy đơn thuốc với ID: " + id));
        return mapToDTO(p);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PrescriptionDTO> getPrescriptionsByExaminationResultId(UUID examinationResultId) {
        return prescriptionRepository.findByExaminationResultId(examinationResultId)
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PrescriptionDTO> getPrescriptionsByPatientId(UUID patientId) {
        return prescriptionRepository.findByPatientId(patientId)
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PrescriptionDTO> getPrescriptionsByPatientCode(String patientCode) {
        return prescriptionRepository.findByPatientCode(patientCode)
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    public PrescriptionDTO createPrescription(PrescriptionRequestDTO request) {
        ExaminationResult examinationResult = null;
        if (request.getExaminationResultId() != null) {
            examinationResult = examinationResultRepository.findById(request.getExaminationResultId())
                    .orElse(null);
        }

        String code = request.getPrescriptionCode();
        if (code == null || code.isBlank()) {
            code = "DT-" + (System.currentTimeMillis() % 1000000);
        } else {
            code = code.trim().toUpperCase();
        }

        Prescription prescription = Prescription.builder()
                .examinationResult(examinationResult)
                .prescriptionCode(code)
                .prescriptionName(request.getPrescriptionName())
                .prescriptionDate(request.getPrescriptionDate() != null ? request.getPrescriptionDate() : LocalDateTime.now())
                .prescriber(request.getPrescriber())
                .doctorAdvice(request.getDoctorAdvice())
                .prescriptionDetails(new ArrayList<>())
                .build();

        if (request.getPrescriptionDetails() != null) {
            for (PrescriptionDetailRequestDTO item : request.getPrescriptionDetails()) {
                Medicine medicine = null;
                if (item.getMedicineId() != null) {
                    medicine = medicineRepository.findById(item.getMedicineId()).orElse(null);
                }

                PrescriptionDetail detail = PrescriptionDetail.builder()
                        .prescription(prescription)
                        .medicine(medicine)
                        .medicineName(item.getMedicineName() != null ? item.getMedicineName() : (medicine != null ? medicine.getName() : ""))
                        .dosage(item.getDosage())
                        .unit(item.getUnit() != null ? item.getUnit() : (medicine != null ? medicine.getUnit() : ""))
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice() != null ? item.getUnitPrice() : (medicine != null ? medicine.getPrice() : BigDecimal.ZERO))
                        .build();

                prescription.getPrescriptionDetails().add(detail);
            }
        }

        Prescription saved = prescriptionRepository.save(prescription);
        return mapToDTO(saved);
    }

    @Override
    public PrescriptionDTO updatePrescription(UUID id, PrescriptionRequestDTO request) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND,"Không tìm thấy đơn thuốc với ID: " + id));

        if (request.getExaminationResultId() != null) {
            ExaminationResult examinationResult = examinationResultRepository.findById(request.getExaminationResultId())
                    .orElse(null);
            prescription.setExaminationResult(examinationResult);
        }

        if (request.getPrescriptionCode() != null && !request.getPrescriptionCode().isBlank()) {
            prescription.setPrescriptionCode(request.getPrescriptionCode().trim().toUpperCase());
        }
        prescription.setPrescriptionName(request.getPrescriptionName());
        if (request.getPrescriptionDate() != null) {
            prescription.setPrescriptionDate(request.getPrescriptionDate());
        }
        prescription.setPrescriber(request.getPrescriber());
        prescription.setDoctorAdvice(request.getDoctorAdvice());

        prescription.getPrescriptionDetails().clear();
        if (request.getPrescriptionDetails() != null) {
            for (PrescriptionDetailRequestDTO item : request.getPrescriptionDetails()) {
                Medicine medicine = null;
                if (item.getMedicineId() != null) {
                    medicine = medicineRepository.findById(item.getMedicineId()).orElse(null);
                }

                PrescriptionDetail detail = PrescriptionDetail.builder()
                        .prescription(prescription)
                        .medicine(medicine)
                        .medicineName(item.getMedicineName() != null ? item.getMedicineName() : (medicine != null ? medicine.getName() : ""))
                        .dosage(item.getDosage())
                        .unit(item.getUnit() != null ? item.getUnit() : (medicine != null ? medicine.getUnit() : ""))
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice() != null ? item.getUnitPrice() : (medicine != null ? medicine.getPrice() : BigDecimal.ZERO))
                        .build();

                prescription.getPrescriptionDetails().add(detail);
            }
        }

        Prescription updated = prescriptionRepository.save(prescription);
        return mapToDTO(updated);
    }

    @Override
    public void deletePrescription(UUID id) {
        if (!prescriptionRepository.existsById(id)) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND,"Không tìm thấy đơn thuốc với ID: " + id);
        }
        prescriptionRepository.deleteById(id);
    }

    private PrescriptionDTO mapToDTO(Prescription p) {
        UUID examId = null;
        UUID medRecId = null;
        UUID patId = null;
        String patCode = null;
        String patName = null;

        if (p.getExaminationResult() != null) {
            examId = p.getExaminationResult().getId();
            if (p.getExaminationResult().getMedicalRecord() != null) {
                medRecId = p.getExaminationResult().getMedicalRecord().getId();
                Patient patient = p.getExaminationResult().getMedicalRecord().getPatient();
                if (patient != null) {
                    patId = patient.getId();
                    patCode = patient.getPatientCode();
                    patName = patient.getFullName();
                }
            }
        }

        String rxCode = p.getPrescriptionCode();
        if (rxCode == null || rxCode.isBlank()) {
            rxCode = p.getId() != null ? "DT-" + p.getId().toString().substring(0, 8).toUpperCase() : null;
        }

        BigDecimal total = BigDecimal.ZERO;
        List<PrescriptionDetailDTO> details = new ArrayList<>();
        if (p.getPrescriptionDetails() != null) {
            for (PrescriptionDetail d : p.getPrescriptionDetails()) {
                BigDecimal price = d.getUnitPrice() != null ? d.getUnitPrice() : BigDecimal.ZERO;
                int qty = d.getQuantity() != null ? d.getQuantity() : 0;
                BigDecimal itemTotal = price.multiply(BigDecimal.valueOf(qty));
                total = total.add(itemTotal);

                details.add(PrescriptionDetailDTO.builder()
                        .id(d.getId())
                        .medicineId(d.getMedicine() != null ? d.getMedicine().getId() : null)
                        .medicineName(d.getMedicineName())
                        .medicineCode(d.getMedicine() != null ? d.getMedicine().getCode() : null)
                        .dosage(d.getDosage())
                        .unit(d.getUnit())
                        .quantity(d.getQuantity())
                        .unitPrice(d.getUnitPrice())
                        .totalPrice(itemTotal)
                        .build());
            }
        }

        return PrescriptionDTO.builder()
                .id(p.getId())
                .examinationResultId(examId)
                .medicalRecordId(medRecId)
                .patientId(patId)
                .patientCode(patCode)
                .patientName(patName)
                .prescriptionCode(rxCode)
                .prescriptionName(p.getPrescriptionName())
                .prescriptionDate(p.getPrescriptionDate())
                .prescriber(p.getPrescriber())
                .doctorAdvice(p.getDoctorAdvice())
                .totalAmount(total)
                .prescriptionDetails(details)
                .build();
    }
}

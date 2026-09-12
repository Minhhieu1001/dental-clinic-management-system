package iuh.fit.backend.treatment.service;

import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.exception.ErrorCode;
import iuh.fit.backend.medicalrecord.entity.ExaminationResult;
import iuh.fit.backend.medicalrecord.repository.ExaminationResultRepository;
import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.patient.repository.PatientRepository;
import iuh.fit.backend.treatment.dto.TreatmentPlanRequest;
import iuh.fit.backend.treatment.dto.TreatmentPlanResponse;
import iuh.fit.backend.treatment.entity.*;
import iuh.fit.backend.treatment.repository.*;
import iuh.fit.backend.user.entity.Dentist;
import iuh.fit.backend.user.repository.DentistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TreatmentPlanServiceImpl implements TreatmentPlanService {

    private final TreatmentPlanRepository treatmentPlanRepository;
    private final TreatmentPhaseRepository treatmentPhaseRepository;
    private final TreatmentServiceRepository treatmentServiceRepository;
    private final TreatmentVisitsRepository treatmentVisitsRepository;
    private final PatientRepository patientRepository;
    private final DentistRepository dentistRepository;
    private final ServiceRepository serviceRepository;
    private final ExaminationResultRepository examinationResultRepository;

    @Override
    @Transactional
    public TreatmentPlanResponse createTreatmentPlan(TreatmentPlanRequest request) {
        Patient patient = null;
        if (request.getPatientId() != null) {
            patient = patientRepository.findById(request.getPatientId()).orElse(null);
        }

        Dentist dentist = null;
        if (request.getDentistId() != null) {
            dentist = dentistRepository.findById(request.getDentistId()).orElse(null);
        }

        ExaminationResult examinationResult = null;
        if (request.getExaminationResultId() != null) {
            examinationResult = examinationResultRepository.findById(request.getExaminationResultId()).orElse(null);
            // Quan hệ 1-1: Nếu đợt khám này đã có kế hoạch điều trị, cập nhật kế hoạch hiện có
            Optional<TreatmentPlan> existingPlan = treatmentPlanRepository.findByExaminationResultId(request.getExaminationResultId());
            if (existingPlan.isPresent()) {
                return updateTreatmentPlan(existingPlan.get().getId(), request);
            }
        }

        LocalDateTime startDate = parseDateTime(request.getStartDate());
        LocalDateTime endDate = parseDateTime(request.getEndDate());

        TreatmentPlan plan = TreatmentPlan.builder()
                .patient(patient)
                .dentist(dentist)
                .examinationResult(examinationResult)
                .planName(request.getPlanName())
                .description(request.getDescription())
                .estimatedCost(request.getEstimatedCost())
                .status(request.getStatus() != null ? request.getStatus() : Boolean.TRUE)
                .startDate(startDate != null ? startDate : LocalDateTime.now())
                .endDate(endDate)
                .treatmentPhases(new ArrayList<>())
                .build();

        TreatmentPlan savedPlan = treatmentPlanRepository.save(plan);

        if (request.getPhases() != null && !request.getPhases().isEmpty()) {
            for (TreatmentPlanRequest.PhaseRequest phaseReq : request.getPhases()) {
                TreatmentPhase phase = TreatmentPhase.builder()
                        .treatmentPlan(savedPlan)
                        .phaseName(phaseReq.getPhaseName())
                        .phaseOrder(phaseReq.getPhaseOrder())
                        .treatmentType(phaseReq.getTreatmentType())
                        .description(phaseReq.getDescription())
                        .status(phaseReq.getStatus())
                        .estimatedDuration(phaseReq.getEstimatedDuration())
                        .treatmentServices(new ArrayList<>())
                        .treatmentVisits(new ArrayList<>())
                        .build();

                TreatmentPhase savedPhase = treatmentPhaseRepository.save(phase);

                if (phaseReq.getTreatmentServices() != null) {
                    for (TreatmentPlanRequest.ServiceItemRequest sReq : phaseReq.getTreatmentServices()) {
                        iuh.fit.backend.treatment.entity.Service service = null;
                        if (sReq.getServiceId() != null) {
                            service = serviceRepository.findById(sReq.getServiceId()).orElse(null);
                        }
                        TreatmentService ts = TreatmentService.builder()
                                .treatmentPhase(savedPhase)
                                .service(service)
                                .toothNumber(sReq.getToothNumber())
                                .quantity(sReq.getQuantity())
                                .price(sReq.getPrice())
                                .totalAmount(sReq.getTotalAmount())
                                .build();
                        treatmentServiceRepository.save(ts);
                        savedPhase.getTreatmentServices().add(ts);
                    }
                }

                if (phaseReq.getTreatmentVisits() != null) {
                    for (TreatmentPlanRequest.VisitItemRequest vReq : phaseReq.getTreatmentVisits()) {
                        TreatmentVisits tv = TreatmentVisits.builder()
                                .treatmentPhase(savedPhase)
                                .visitName(vReq.getVisitName())
                                .visitOrder(vReq.getVisitOrder())
                                .startDate(vReq.getStartDate())
                                .status(vReq.getStatus())
                                .clinicalNotes(vReq.getClinicalNotes())
                                .build();
                        treatmentVisitsRepository.save(tv);
                        savedPhase.getTreatmentVisits().add(tv);
                    }
                }

                savedPlan.getTreatmentPhases().add(savedPhase);
            }
        }

        return mapToResponse(savedPlan);
    }

    @Override
    @Transactional(readOnly = true)
    public TreatmentPlanResponse getTreatmentPlanById(UUID id) {
        TreatmentPlan plan = treatmentPlanRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy kế hoạch điều trị với ID: " + id));
        return mapToResponse(plan);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TreatmentPlanResponse> getTreatmentPlansByPatientId(UUID patientId) {
        List<TreatmentPlan> plans = treatmentPlanRepository.findByPatientId(patientId);
        return plans.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TreatmentPlanResponse getTreatmentPlanByExaminationResultId(UUID examinationResultId) {
        TreatmentPlan plan = treatmentPlanRepository.findByExaminationResultId(examinationResultId)
                .orElse(null);
        return plan != null ? mapToResponse(plan) : null;
    }

    @Override
    @Transactional
    public TreatmentPlanResponse updateTreatmentPlan(UUID id, TreatmentPlanRequest request) {
        TreatmentPlan plan = treatmentPlanRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy kế hoạch điều trị với ID: " + id));

        if (request.getPlanName() != null) plan.setPlanName(request.getPlanName());
        if (request.getDescription() != null) plan.setDescription(request.getDescription());
        if (request.getEstimatedCost() != null) plan.setEstimatedCost(request.getEstimatedCost());
        if (request.getStatus() != null) plan.setStatus(request.getStatus());
        if (request.getStartDate() != null) plan.setStartDate(parseDateTime(request.getStartDate()));
        if (request.getEndDate() != null) plan.setEndDate(parseDateTime(request.getEndDate()));
        if (request.getExaminationResultId() != null) {
            ExaminationResult exam = examinationResultRepository.findById(request.getExaminationResultId()).orElse(null);
            if (exam != null) plan.setExaminationResult(exam);
        }

        TreatmentPlan updated = treatmentPlanRepository.save(plan);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteTreatmentPlan(UUID id) {
        if (!treatmentPlanRepository.existsById(id)) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy kế hoạch điều trị với ID: " + id);
        }
        treatmentPlanRepository.deleteById(id);
    }

    private LocalDateTime parseDateTime(String str) {
        if (str == null || str.trim().isEmpty()) return null;
        try {
            if (str.length() == 10) {
                return LocalDate.parse(str).atStartOfDay();
            }
            return LocalDateTime.parse(str.replace("Z", ""));
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    private TreatmentPlanResponse mapToResponse(TreatmentPlan plan) {
        return TreatmentPlanResponse.builder()
                .id(plan.getId())
                .patientId(plan.getPatient() != null ? plan.getPatient().getId() : null)
                .examinationResultId(plan.getExaminationResult() != null ? plan.getExaminationResult().getId() : null)
                .patientName(plan.getPatient() != null ? plan.getPatient().getFullName() : null)
                .patientCode(plan.getPatient() != null ? plan.getPatient().getPatientCode() : null)
                .dentistId(plan.getDentist() != null ? plan.getDentist().getId() : null)
                .dentistName(plan.getDentist() != null ? plan.getDentist().getFullName() : null)
                .planName(plan.getPlanName())
                .description(plan.getDescription())
                .estimatedCost(plan.getEstimatedCost())
                .status(plan.getStatus())
                .startDate(plan.getStartDate())
                .endDate(plan.getEndDate())
                .phases((plan.getTreatmentPhases() != null ? plan.getTreatmentPhases() : List.<TreatmentPhase>of()).stream().map(ph ->
                        TreatmentPlanResponse.PhaseResponse.builder()
                                .id(ph.getId())
                                .phaseName(ph.getPhaseName())
                                .phaseOrder(ph.getPhaseOrder())
                                .treatmentType(ph.getTreatmentType())
                                .description(ph.getDescription())
                                .status(ph.getStatus())
                                .estimatedDuration(ph.getEstimatedDuration())
                                .treatmentServices((ph.getTreatmentServices() != null ? ph.getTreatmentServices() : List.<TreatmentService>of()).stream().map(ts ->
                                        TreatmentPlanResponse.ServiceItemResponse.builder()
                                                .id(ts.getId())
                                                .serviceId(ts.getService() != null ? ts.getService().getId() : null)
                                                .serviceName(ts.getService() != null ? ts.getService().getServiceName() : null)
                                                .toothNumber(ts.getToothNumber())
                                                .quantity(ts.getQuantity())
                                                .price(ts.getPrice())
                                                .totalAmount(ts.getTotalAmount())
                                                .build()
                                ).toList())
                                .treatmentVisits((ph.getTreatmentVisits() != null ? ph.getTreatmentVisits() : List.<TreatmentVisits>of()).stream().map(tv ->
                                        TreatmentPlanResponse.VisitItemResponse.builder()
                                                .visitId(tv.getVisitId())
                                                .visitName(tv.getVisitName())
                                                .visitOrder(tv.getVisitOrder())
                                                .startDate(tv.getStartDate())
                                                .status(tv.getStatus())
                                                .clinicalNotes(tv.getClinicalNotes())
                                                .build()
                                ).toList())
                                .build()
                ).toList())
                .build();
    }
}

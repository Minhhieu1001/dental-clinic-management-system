package iuh.fit.backend.customercare.controller;

import iuh.fit.backend.customercare.dto.*;
import iuh.fit.backend.customercare.service.CustomerCareService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/customer-care")
@RequiredArgsConstructor
public class CustomerCareController {

    private final CustomerCareService customerCareService;

    @GetMapping("/filter-patients")
    public ResponseEntity<List<FilterPatientItemDTO>> getFilterPatients(
            @RequestParam(required = false) String customerGroup,
            @RequestParam(required = false) String customerSource,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String appointmentStartDate,
            @RequestParam(required = false) String appointmentEndDate,
            @RequestParam(required = false) String treatmentStartDate,
            @RequestParam(required = false) String treatmentEndDate,
            @RequestParam(required = false) String dentistId,
            @RequestParam(required = false) String treatmentStatus,
            @RequestParam(required = false) String procedureGroup,
            @RequestParam(required = false) String procedureName,
            @RequestParam(required = false) String employeeId,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String customerCard,
            @RequestParam(required = false) Boolean careTreatment,
            @RequestParam(required = false) String search
    ) {
        List<FilterPatientItemDTO> result = customerCareService.getComprehensiveFilterPatients(
                customerGroup, customerSource, startDate, endDate,
                appointmentStartDate, appointmentEndDate, treatmentStartDate, treatmentEndDate,
                dentistId, treatmentStatus, procedureGroup, procedureName,
                employeeId, city, district, customerCard, careTreatment, search
        );
        return ResponseEntity.ok(result);
    }

    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentCareItemDTO>> getAppointmentCareList(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String careStatus,
            @RequestParam(required = false) String scheduleStatus,
            @RequestParam(required = false) String dentistId,
            @RequestParam(required = false) String employeeId
    ) {
        List<AppointmentCareItemDTO> result = customerCareService.getAppointmentCareList(
                search, startDate, endDate, careStatus, scheduleStatus, dentistId, employeeId
        );
        return ResponseEntity.ok(result);
    }

    @GetMapping("/post-treatments")
    public ResponseEntity<List<PostTreatmentCareItemDTO>> getPostTreatmentCareList(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String careStatus,
            @RequestParam(required = false) String dentistId,
            @RequestParam(required = false) String employeeId
    ) {
        List<PostTreatmentCareItemDTO> result = customerCareService.getPostTreatmentCareList(
                search, startDate, endDate, careStatus, dentistId, employeeId
        );
        return ResponseEntity.ok(result);
    }

    @GetMapping("/birthdays")
    public ResponseEntity<List<BirthdayCareItemDTO>> getBirthdayCareList(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String careStatus,
            @RequestParam(required = false) String employeeId
    ) {
        List<BirthdayCareItemDTO> result = customerCareService.getBirthdayCareList(
                search, startDate, endDate, careStatus, employeeId
        );
        return ResponseEntity.ok(result);
    }

    @GetMapping("/payments")
    public ResponseEntity<List<PaymentCareItemDTO>> getPaymentCareList(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) String careStatus,
            @RequestParam(required = false) String employeeId
    ) {
        List<PaymentCareItemDTO> result = customerCareService.getPaymentCareList(
                search, startDate, endDate, paymentStatus, careStatus, employeeId
        );
        return ResponseEntity.ok(result);
    }

    @GetMapping("/promotions")
    public ResponseEntity<List<PromotionCareItemDTO>> getPromotionCareList(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String promotionId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String careStatus,
            @RequestParam(required = false) String customerGroup,
            @RequestParam(required = false) String employeeId
    ) {
        List<PromotionCareItemDTO> result = customerCareService.getPromotionCareList(
                search, promotionId, category, careStatus, customerGroup, employeeId
        );
        return ResponseEntity.ok(result);
    }

    @GetMapping("/promotions/campaigns")
    public ResponseEntity<List<PromotionCampaignDTO>> getPromotionCampaigns() {
        return ResponseEntity.ok(customerCareService.getPromotionCampaigns());
    }

    @GetMapping("/records")
    public ResponseEntity<List<CustomerCareRecordResponseDTO>> getAllCareRecords(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String careType,
            @RequestParam(required = false) String careStatus,
            @RequestParam(required = false) String channel,
            @RequestParam(required = false) String employeeId
    ) {
        List<CustomerCareRecordResponseDTO> result = customerCareService.getAllCareRecords(
                search, startDate, endDate, careType, careStatus, channel, employeeId
        );
        return ResponseEntity.ok(result);
    }

    @GetMapping("/patient/{patientId}/history")
    public ResponseEntity<List<CustomerCareRecordResponseDTO>> getPatientCareHistory(
            @PathVariable UUID patientId
    ) {
        List<CustomerCareRecordResponseDTO> result = customerCareService.getPatientCareHistory(patientId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/records")
    public ResponseEntity<CustomerCareRecordResponseDTO> createCareRecord(
            @RequestBody CustomerCareRecordRequestDTO request
    ) {
        CustomerCareRecordResponseDTO result = customerCareService.createCareRecord(request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/send-email")
    public ResponseEntity<CustomerCareRecordResponseDTO> sendDirectCareEmail(
            @RequestBody SendDirectCareEmailRequestDTO request
    ) {
        CustomerCareRecordResponseDTO result = customerCareService.sendDirectCareEmail(request);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/stats")
    public ResponseEntity<CustomerCareStatsDTO> getStats() {
        return ResponseEntity.ok(customerCareService.getStats());
    }

    @GetMapping("/filter-options")
    public ResponseEntity<FilterOptionsDTO> getFilterOptions() {
        return ResponseEntity.ok(customerCareService.getFilterOptions());
    }

    @GetMapping("/patient/{patientId}/detail")
    public ResponseEntity<PatientCareDetailDTO> getPatientCareDetail(
            @PathVariable UUID patientId,
            @RequestParam(required = false) UUID appointmentId,
            @RequestParam(required = false) UUID invoiceId
    ) {
        PatientCareDetailDTO result = customerCareService.getPatientCareDetail(patientId, appointmentId, invoiceId);
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/appointments/{id}/status")
    public ResponseEntity<PatientCareDetailDTO.PatientAppointmentDTO> updateAppointmentStatus(
            @PathVariable UUID id,
            @RequestParam String status
    ) {
        PatientCareDetailDTO.PatientAppointmentDTO result = customerCareService.updateAppointmentStatus(id, status);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/appointments/{id}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable UUID id) {
        customerCareService.deleteAppointment(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/patient/{patientId}/appointments")
    public ResponseEntity<PatientCareDetailDTO.PatientAppointmentDTO> createPatientAppointment(
            @PathVariable UUID patientId,
            @RequestBody CreatePatientAppointmentRequestDTO request
    ) {
        PatientCareDetailDTO.PatientAppointmentDTO result = customerCareService.createPatientAppointment(patientId, request);
        return ResponseEntity.ok(result);
    }
}


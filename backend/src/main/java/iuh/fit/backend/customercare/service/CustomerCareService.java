package iuh.fit.backend.customercare.service;

import iuh.fit.backend.customercare.dto.*;

import java.util.List;
import java.util.UUID;

public interface CustomerCareService {
    List<FilterPatientItemDTO> getComprehensiveFilterPatients(
            String customerGroup,
            String customerSource,
            String startDate,
            String endDate,
            String appointmentStartDate,
            String appointmentEndDate,
            String treatmentStartDate,
            String treatmentEndDate,
            String dentistId,
            String treatmentStatus,
            String procedureGroup,
            String procedureName,
            String employeeId,
            String city,
            String district,
            String customerCard,
            Boolean careTreatment,
            String search
    );

    List<AppointmentCareItemDTO> getAppointmentCareList(
            String search,
            String startDate,
            String endDate,
            String careStatus,
            String scheduleStatus,
            String dentistId,
            String employeeId
    );

    List<PostTreatmentCareItemDTO> getPostTreatmentCareList(
            String search,
            String startDate,
            String endDate,
            String careStatus,
            String dentistId,
            String employeeId
    );


    List<BirthdayCareItemDTO> getBirthdayCareList(
            String search,
            String startDate,
            String endDate,
            String careStatus,
            String employeeId
    );

    List<PaymentCareItemDTO> getPaymentCareList(
            String search,
            String startDate,
            String endDate,
            String paymentStatus,
            String careStatus,
            String employeeId
    );

    List<PromotionCareItemDTO> getPromotionCareList(
            String search,
            String promotionId,
            String category,
            String careStatus,
            String customerGroup,
            String employeeId
    );

    List<PromotionCampaignDTO> getPromotionCampaigns();

    List<CustomerCareRecordResponseDTO> getAllCareRecords(
            String search,
            String startDate,
            String endDate,
            String careType,
            String careStatus,
            String channel,
            String employeeId
    );

    List<CustomerCareRecordResponseDTO> getPatientCareHistory(UUID patientId);

    CustomerCareRecordResponseDTO createCareRecord(CustomerCareRecordRequestDTO request);

    CustomerCareStatsDTO getStats();

    FilterOptionsDTO getFilterOptions();

    PatientCareDetailDTO getPatientCareDetail(UUID patientId, UUID contextAppointmentId, UUID contextInvoiceId);

    default PatientCareDetailDTO getPatientCareDetail(UUID patientId, UUID contextAppointmentId) {
        return getPatientCareDetail(patientId, contextAppointmentId, null);
    }

    PatientCareDetailDTO.PatientAppointmentDTO updateAppointmentStatus(UUID appointmentId, String newStatus);

    void deleteAppointment(UUID appointmentId);

    PatientCareDetailDTO.PatientAppointmentDTO createPatientAppointment(UUID patientId, CreatePatientAppointmentRequestDTO request);

    CustomerCareRecordResponseDTO sendDirectCareEmail(SendDirectCareEmailRequestDTO request);
}

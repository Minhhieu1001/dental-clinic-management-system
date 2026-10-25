package iuh.fit.backend.appointment.service;

import iuh.fit.backend.appointment.dto.FollowUpAppointmentDTO;
import iuh.fit.backend.appointment.dto.FollowUpAppointmentRequestDTO;

import java.util.List;
import java.util.UUID;

public interface FollowUpAppointmentService {
    List<FollowUpAppointmentDTO> getCurrentMonthFollowUpAppointmentsByPatientId(UUID patientId);
    List<FollowUpAppointmentDTO> getAllFollowUpAppointments(UUID patientId, UUID examinationResultId, String patientCode);
    FollowUpAppointmentDTO getFollowUpAppointmentById(UUID id);
    FollowUpAppointmentDTO createFollowUpAppointment(FollowUpAppointmentRequestDTO request);
    FollowUpAppointmentDTO updateFollowUpAppointment(UUID id, FollowUpAppointmentRequestDTO request);
    void deleteFollowUpAppointment(UUID id);
}

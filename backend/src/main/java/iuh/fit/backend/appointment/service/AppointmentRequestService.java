package iuh.fit.backend.appointment.service;

import iuh.fit.backend.appointment.dto.AppointmentRequestDTO;
import iuh.fit.backend.appointment.dto.AppointmentResponseDTO;
import iuh.fit.backend.appointment.enums.StatustAppointmentRequest;

import java.util.List;
import java.util.UUID;


public interface AppointmentRequestService {
    AppointmentResponseDTO createAppointRequest(AppointmentRequestDTO requestDTO);

    AppointmentResponseDTO processAppointmentRequest(UUID id);

    AppointmentResponseDTO updateAppointmentRequestStatus(UUID id, StatustAppointmentRequest status);

    List<AppointmentResponseDTO> getAppointmentRequestsToday();

    List<AppointmentResponseDTO> getPendingAppointmentRequestsToday();

    long countAppointmentRequestsToday();
}

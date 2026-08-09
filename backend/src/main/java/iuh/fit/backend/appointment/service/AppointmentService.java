package iuh.fit.backend.appointment.service;

import iuh.fit.backend.appointment.dto.AppointmentCreateDTO;
import iuh.fit.backend.appointment.dto.AppointmentDetailDTO;
import iuh.fit.backend.appointment.enums.StatusAppointment;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface AppointmentService {
    AppointmentDetailDTO createAppointment(AppointmentCreateDTO dto);
    List<AppointmentDetailDTO> getAllAppointments(UUID dentistId, String date, StatusAppointment status);
    List<AppointmentDetailDTO> getAppointmentsByDentist(UUID dentistId);
    List<AppointmentDetailDTO> getAppointmentsByDentistUser(UUID userId);
    AppointmentDetailDTO updateAppointmentStatus(UUID appointmentId, StatusAppointment status);
    AppointmentDetailDTO updateClinicalExam(UUID appointmentId, AppointmentCreateDTO dto);
    AppointmentDetailDTO getAppointmentById(UUID id);
    List<iuh.fit.backend.appointment.entity.Room> getAllRooms();
}



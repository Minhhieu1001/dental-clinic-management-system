package iuh.fit.backend.appointment.service;

import iuh.fit.backend.appointment.dto.AppointmentCreateDTO;
import iuh.fit.backend.appointment.dto.AppointmentDetailDTO;
import iuh.fit.backend.appointment.entity.Room;
import iuh.fit.backend.appointment.enums.StatusAppointment;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public interface AppointmentService {
    AppointmentDetailDTO createAppointment(AppointmentCreateDTO dto);

    List<AppointmentDetailDTO> getAllAppointments(UUID dentistId, String date, StatusAppointment status);

    List<AppointmentDetailDTO> getAppointmentsByDay(LocalDate date);

    List<AppointmentDetailDTO> getAppointmentsByWeek(LocalDate date);

    List<AppointmentDetailDTO> getAppointmentsByDentist(UUID dentistId);

    List<AppointmentDetailDTO> getAppointmentsByDentistAndSlot(
            UUID dentistId, LocalDate appointmentDate, LocalTime appointmentTime);

    List<AppointmentDetailDTO> getAppointmentsByDentistUser(UUID userId);

    AppointmentDetailDTO updateAppointment(UUID appointmentId, AppointmentCreateDTO dto);

    AppointmentDetailDTO updateClinicalExam(UUID appointmentId, AppointmentCreateDTO dto);

    AppointmentDetailDTO getAppointmentById(UUID id);

    List<AppointmentDetailDTO> getAppointmentsByPatient(UUID patientId);

    List<Room> getAllRooms();
}

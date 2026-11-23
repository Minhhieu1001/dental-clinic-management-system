package iuh.fit.backend.appointment.service;

import iuh.fit.backend.appointment.dto.AppointmentCreateDTO;
import iuh.fit.backend.appointment.entity.Appointment;
import iuh.fit.backend.appointment.entity.Room;
import iuh.fit.backend.appointment.enums.StatusAppointment;
import iuh.fit.backend.appointment.repository.*;
import iuh.fit.backend.appointment.service.Impl.AppointmentServiceImpl;
import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.inforclinic.entity.Branch;
import iuh.fit.backend.inforclinic.repository.BranchRepository;
import iuh.fit.backend.patient.repository.PatientRepository;
import iuh.fit.backend.user.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AppointmentRoomBranchTest {
    @Test void selectedDateQueriesOnlyAuthenticatedDentistAndDayBoundaries() {
        UUID userId = UUID.randomUUID();
        var date = java.time.LocalDate.of(2026, 11, 23);
        var appointment = Appointment.builder().id(UUID.randomUUID()).build();
        when(appointments.findForDentistUserOnDate(userId, date.atStartOfDay(), date.plusDays(1).atStartOfDay()))
                .thenReturn(List.of(appointment));
        var result = service.getAppointmentsByDentistUserOnDate(userId, date);
        assertEquals(1, result.size());
        assertEquals(appointment.getId(), result.get(0).getId());
        verify(appointments).findForDentistUserOnDate(userId, date.atStartOfDay(), date.plusDays(1).atStartOfDay());
        verifyNoMoreInteractions(appointments);
    }

    @Test void emptySelectedDayDoesNotFallBackToOtherAppointments() {
        assertTrue(service.getAppointmentsByDentistUserOnDate(UUID.randomUUID(), java.time.LocalDate.now()).isEmpty());
        verify(appointments, never()).findAll();
    }

    @BeforeEach void beginTransactionSynchronization() {
        TransactionSynchronizationManager.initSynchronization();
    }

    @AfterEach void clearTransactionSynchronization() {
        TransactionSynchronizationManager.clearSynchronization();
    }

    final AppointmentRepository appointments = mock(AppointmentRepository.class);
    final RoomRepository rooms = mock(RoomRepository.class);
    final AppointmentServiceImpl service = new AppointmentServiceImpl(
            mock(ApplicationEventPublisher.class), appointments, mock(AppointmentRequestRepository.class),
            mock(PatientRepository.class), mock(UserRepository.class), mock(DentistRepository.class),
            mock(EmployeeRepository.class), mock(BranchRepository.class), rooms,
            mock(iuh.fit.backend.notification.repository.notificationRepository.class),
            mock(SimpMessagingTemplate.class));

    @Test void filtersRoomsByRequestedBranch() {
        Room room = Room.builder().id(UUID.randomUUID()).build();
        when(rooms.findByBranch_BranchIdOrderByRoomNameAsc("CN1")).thenReturn(List.of(room));
        assertEquals(List.of(room), service.getRoomsByBranch(" CN1 "));
        verify(rooms, never()).findAll();
    }

    @Test void missingBranchNeverFallsBackToAllRooms() {
        assertThrows(AppException.class, () -> service.getRoomsByBranch(null));
        assertThrows(AppException.class, () -> service.getRoomsByBranch(" "));
        verifyNoInteractions(rooms);
    }

    @Test void callInAcceptsRoomInAppointmentBranch() {
        Appointment appointment = prepareAppointment();
        Room room = Room.builder().id(UUID.randomUUID()).branch(appointment.getBranch()).build();
        when(rooms.findById(room.getId())).thenReturn(Optional.of(room));
        when(appointments.save(appointment)).thenReturn(appointment);
        var result = service.updateAppointment(appointment.getId(), callRequest(room.getId()));
        assertEquals(room.getId(), result.getRoomId());
        assertEquals(StatusAppointment.CALLED, result.getStatus());
        verify(appointments).save(appointment);
    }

    @Test void callInRejectsRoomInAnotherBranch() {
        Appointment appointment = prepareAppointment();
        Room room = Room.builder().id(UUID.randomUUID())
                .branch(Branch.builder().branchId("CN2").build()).build();
        when(rooms.findById(room.getId())).thenReturn(Optional.of(room));
        assertThrows(AppException.class, () -> service.updateAppointment(appointment.getId(), callRequest(room.getId())));
        verify(appointments, never()).save(any());
    }

    @Test void callInRejectsRoomWithoutBranch() {
        Appointment appointment = prepareAppointment();
        Room room = Room.builder().id(UUID.randomUUID()).build();
        when(rooms.findById(room.getId())).thenReturn(Optional.of(room));
        assertThrows(AppException.class, () -> service.updateAppointment(appointment.getId(), callRequest(room.getId())));
        verify(appointments, never()).save(any());
    }

    @Test void callInRejectsUnknownRoom() {
        Appointment appointment = prepareAppointment();
        assertThrows(AppException.class, () -> service.updateAppointment(appointment.getId(), callRequest(UUID.randomUUID())));
        verify(appointments, never()).save(any());
    }

    private Appointment prepareAppointment() {
        Appointment appointment = Appointment.builder().id(UUID.randomUUID())
                .branch(Branch.builder().branchId("CN1").build()).status(StatusAppointment.WAITING).build();
        when(appointments.findByIdForUpdate(appointment.getId())).thenReturn(Optional.of(appointment));
        return appointment;
    }

    private AppointmentCreateDTO callRequest(UUID roomId) {
        AppointmentCreateDTO dto = new AppointmentCreateDTO();
        dto.setRoomId(roomId);
        dto.setStatus(StatusAppointment.CALLED);
        return dto;
    }
}

package iuh.fit.backend.appointment.service;

import iuh.fit.backend.appointment.dto.*;
import iuh.fit.backend.appointment.entity.Appointment;
import iuh.fit.backend.appointment.enums.StatusAppointment;
import iuh.fit.backend.appointment.repository.*;
import iuh.fit.backend.appointment.service.Impl.AppointmentServiceImpl;
import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.inforclinic.entity.Branch;
import iuh.fit.backend.inforclinic.repository.BranchRepository;
import iuh.fit.backend.notification.service.EmailService;
import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.patient.repository.PatientRepository;
import iuh.fit.backend.user.repository.*;
import org.junit.jupiter.api.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AppointmentCheckinTest {
    final AppointmentRepository appointments = mock(AppointmentRepository.class);
    final PatientRepository patients = mock(PatientRepository.class);
    final BranchRepository branches = mock(BranchRepository.class);
    final EmployeeRepository employees = mock(EmployeeRepository.class);
    final ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
    final SimpMessagingTemplate socket = mock(SimpMessagingTemplate.class);
    final AppointmentServiceImpl service = new AppointmentServiceImpl(events, appointments,
            mock(AppointmentRequestRepository.class), patients, mock(UserRepository.class),
            mock(DentistRepository.class), employees, branches,
            mock(RoomRepository.class), mock(iuh.fit.backend.notification.repository.notificationRepository.class), socket);
    Appointment appointment;
    Branch branch;
    AppointmentCheckinRequest request = new AppointmentCheckinRequest("APT-123", "Nguyen Van A", "0901234567", "branch-1");

    @BeforeEach void setup() {
        TransactionSynchronizationManager.initSynchronization();
        branch = new Branch();
        branch.setBranchId("branch-1");
        appointment = Appointment.builder().id(UUID.randomUUID()).appointmentCode("APT-123")
                .patientName("Nguyen Van A").phone("0901234567").branch(branch)
                .appointmentDate(LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).atStartOfDay())
                .status(StatusAppointment.CONFIRMED).build();
        when(appointments.findForCheckin("APT-123")).thenReturn(Optional.of(appointment));
    }
    @AfterEach void cleanup() {
        TransactionSynchronizationManager.clearSynchronization();
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
    }

    private void loginEmployee() {
        var user = new iuh.fit.backend.user.entity.User();
        user.setId(UUID.randomUUID());
        var employee = new iuh.fit.backend.user.entity.Employee();
        employee.setBranch(branch);
        when(employees.findByUserId(user.getId())).thenReturn(Optional.of(employee));
        var details = new iuh.fit.backend.common.security.CustomUserDetails(user);
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(details, null, List.of()));
    }

    @Test void searchNormalizesPhoneAndFiltersSelectedDayWithinEmployeeBranch() {
        loginEmployee();
        var tomorrow = Appointment.builder().id(UUID.randomUUID()).patientName("Other patient")
                .appointmentDate(appointment.getAppointmentDate().plusDays(1)).build();
        when(appointments.findByBranchAndNormalizedPhone("branch-1", "0901234567"))
                .thenReturn(List.of(appointment, tomorrow));
        var result = service.searchAppointmentsByPhone("+84 901-234-567", appointment.getAppointmentDate().toLocalDate());
        assertEquals(1, result.size());
        assertEquals(appointment.getId(), result.get(0).getId());
        assertEquals(2, service.searchAppointmentsByPhone("0901234567", null).size());
        verify(appointments, times(2)).findByBranchAndNormalizedPhone("branch-1", "0901234567");
    }

    @Test void phoneSearchRequiresEmployeeAndFullPhone() {
        assertThrows(AppException.class, () -> service.searchAppointmentsByPhone("0901234567", null));
        loginEmployee();
        assertThrows(AppException.class, () -> service.searchAppointmentsByPhone("0901", null));
        assertThrows(AppException.class, () -> service.searchAppointmentsByPhone("abc0901234567", null));
        verify(appointments, never()).findByBranchAndNormalizedPhone(anyString(), anyString());
    }

    @Test void checkinSetsFlagAndBroadcastsOnlyAfterCommit() {
        var result = service.checkIn(new AppointmentCheckinRequest(" apt-123 ", " nguyen  van a ", "+84 901234567", "branch-1"));
        assertEquals(StatusAppointment.WAITING, result.status());
        assertTrue(result.isCheck());
        assertFalse(result.alreadyCheckedIn());
        verify(appointments).saveAndFlush(appointment);
        verifyNoInteractions(socket);
        TransactionSynchronizationManager.getSynchronizations().forEach(s -> s.afterCommit());
        verify(socket).convertAndSend(eq("/topic/appointments"), any(AppointmentDetailDTO.class));
    }
    @Test void wrongIdentityOrBranchDoesNotChangeAppointment() {
        for (var invalid : List.of(
                new AppointmentCheckinRequest("APT-123", "Someone Else", "0901234567", "branch-1"),
                new AppointmentCheckinRequest("APT-123", "Nguyen Van A", "0909999999", "branch-1"),
                new AppointmentCheckinRequest("APT-123", "Nguyen Van A", "0901234567", "branch-2"))) {
            assertThrows(AppException.class, () -> service.checkIn(invalid));
        }
        assertFalse(appointment.getIsCheck());
        verify(appointments, never()).saveAndFlush(any());
    }
    @Test void wrongDayIsRejected() {
        appointment.setAppointmentDate(appointment.getAppointmentDate().plusDays(1));
        assertThrows(AppException.class, () -> service.checkIn(request));
        verify(appointments, never()).saveAndFlush(any());
    }
    @Test void cancelledAndPendingAreRejected() {
        for (var status : List.of(StatusAppointment.CANCELLED, StatusAppointment.PENDING)) {
            appointment.setStatus(status);
            assertThrows(AppException.class, () -> service.checkIn(request));
        }
    }
    @Test void duplicateDoesNotResetAdvancedStatus() {
        appointment.setIsCheck(true);
        appointment.setStatus(StatusAppointment.IN_PROGRESS);
        var result = service.checkIn(request);
        assertTrue(result.alreadyCheckedIn());
        assertEquals(StatusAppointment.IN_PROGRESS, result.status());
        verify(appointments, never()).saveAndFlush(any());
        verifyNoInteractions(socket);
    }
    @Test void staffCheckinSetsSameFlag() {
        when(appointments.findByIdForUpdate(appointment.getId())).thenReturn(Optional.of(appointment));
        when(appointments.save(appointment)).thenReturn(appointment);
        service.updateAppointment(appointment.getId(), AppointmentCreateDTO.builder().status(StatusAppointment.WAITING).build());
        assertTrue(appointment.getIsCheck());
        assertEquals(StatusAppointment.WAITING, appointment.getStatus());
    }
    @Test void bookingUsesOnlyFormEmail() {
        when(appointments.existsByAppointmentCode(anyString())).thenReturn(true, false);
        Patient patient = new Patient();
        patient.setId(UUID.randomUUID());
        patient.setEmail("profile@example.com");
        when(patients.findById(patient.getId())).thenReturn(Optional.of(patient));
        when(branches.findById("branch-1")).thenReturn(Optional.of(branch));
        when(appointments.save(any())).thenAnswer(invocation -> {
            Appointment saved = invocation.getArgument(0);
            assertTrue(saved.getAppointmentCode().matches("APT-[0-9]{6}"));
            saved.setId(UUID.randomUUID());
            saved.setAppointmentCode("APT-NEW");
            return saved;
        });
        var result = service.createAppointment(AppointmentCreateDTO.builder().patientId(patient.getId())
                .branchId("branch-1").fullName("Nguyen Van A").phone("0901234567")
                .email(" form@example.com ").appointmentDate("2026-11-21").appointmentTime("09:00").build());
        assertEquals("form@example.com", result.getEmail());
        verify(appointments, times(2)).existsByAppointmentCode(anyString());
        verify(events).publishEvent(argThat((Object event) -> event instanceof AppointmentConfirmation confirmation
                && confirmation.email().equals("form@example.com") && confirmation.code().equals("APT-NEW")));
    }
    @Test void missingEmailDoesNotFallBackToProfile() {
        assertThrows(AppException.class, () -> service.createAppointment(AppointmentCreateDTO.builder().build()));
        verify(appointments, never()).save(any());
        verifyNoInteractions(events);
    }
    @Test void mailerUsesExactRecipientAndFailureDoesNotThrow() {
        EmailService email = mock(EmailService.class);
        var event = new AppointmentConfirmation("form@example.com", "APT-123", "Patient", "09:00", "Doctor", "Exam", "Branch", "Address");
        doThrow(new RuntimeException("Provider unavailable")).when(email).sendToRecipient(anyString(), anyString(), anyString());
        assertDoesNotThrow(() -> new AppointmentConfirmationMailer(email).send(event));
        verify(email).sendToRecipient(eq("form@example.com"), contains("APT-123"), contains("APT-123"));
    }
}

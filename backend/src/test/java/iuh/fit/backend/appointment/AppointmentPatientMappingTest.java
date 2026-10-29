package iuh.fit.backend.appointment;

import iuh.fit.backend.appointment.dto.AppointmentDetailDTO;
import iuh.fit.backend.appointment.entity.Appointment;
import iuh.fit.backend.appointment.service.Impl.AppointmentServiceImpl;
import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.security.CustomUserDetails;
import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.patient.repository.PatientRepository;
import iuh.fit.backend.user.entity.User;
import iuh.fit.backend.user.enums.Role;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.Optional;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AppointmentPatientMappingTest {
    private final PatientRepository patients = mock(PatientRepository.class);
    private final AppointmentServiceImpl service = new AppointmentServiceImpl(
            null, null, patients, null, null, null, null, null, null, null);

    @AfterEach
    void clearContext() { SecurityContextHolder.clearContext(); }

    @Test
    void explicitPatientIdResolvesExistingPatientAndResponseIncludesIdentity() {
        Patient patient = Patient.builder().id(UUID.randomUUID()).patientCode("BN001").build();
        when(patients.findById(patient.getId())).thenReturn(Optional.of(patient));
        Patient resolved = ReflectionTestUtils.invokeMethod(service, "resolveAppointmentPatient", patient.getId());
        assertSame(patient, resolved);
        AppointmentDetailDTO response = ReflectionTestUtils.invokeMethod(service, "mapToDTO",
                Appointment.builder().patient(resolved).build());
        assertEquals(patient.getId(), response.getPatientId());
        assertEquals("BN001", response.getPatientCode());
    }

    @Test
    void patientLoginUsesSubmittedIdWithoutInferringPatientFromAccount() {
        User user = User.builder().id(UUID.randomUUID()).role(Role.PATIENT).build();
        CustomUserDetails principal = new CustomUserDetails(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
        Patient patient = Patient.builder().id(UUID.randomUUID()).build();
        when(patients.findById(patient.getId())).thenReturn(Optional.of(patient));
        assertNull(ReflectionTestUtils.invokeMethod(service, "resolveAppointmentPatient", (UUID) null));
        assertSame(patient, ReflectionTestUtils.invokeMethod(service, "resolveAppointmentPatient", patient.getId()));
        verify(patients, never()).findByUserId(any());
    }

    @Test
    void guestWithoutPatientIdRemainsUnlinkedAndUnknownIdIsRejected() {
        assertNull(ReflectionTestUtils.invokeMethod(service, "resolveAppointmentPatient", (UUID) null));
        UUID unknown = UUID.randomUUID();
        when(patients.findById(unknown)).thenReturn(Optional.empty());
        assertThrows(AppException.class, () -> ReflectionTestUtils.invokeMethod(service, "resolveAppointmentPatient", unknown));
    }
}

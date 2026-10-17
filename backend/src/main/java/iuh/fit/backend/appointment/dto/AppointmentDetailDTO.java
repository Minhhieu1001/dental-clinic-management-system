package iuh.fit.backend.appointment.dto;

import iuh.fit.backend.appointment.enums.StatusAppointment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentDetailDTO {
    private UUID id;
    private UUID patientId;
    private String patientName;
    private String patientCode;
    private String phone;
    private UUID dentistId;
    private String dentistName;
    private UUID employeeId;
    private String employeeName;
    private LocalDateTime appointmentDate;
    private LocalDateTime appointmentTime;
    private String reason;
    private String notes;
    private String diagnosis;
    private String symptoms;
    private String treatmentNotes;
    private StatusAppointment status;
    private UUID roomId;
    private String roomName;
    private String requestIdStr;
    private LocalDateTime createdAt;
}



package iuh.fit.backend.appointment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentCreateDTO {
    private UUID requestId;       // Optional: linked AppointmentRequest ID if converted
    private UUID patientId;       // Optional: if existing patient
    private String fullName;      // Patient full name
    private String phone;         // Patient phone number
    private UUID dentistId;       // Selected dentist ID
    private String appointmentDate; // YYYY-MM-DD
    private String appointmentTime; // HH:mm
    private String reason;        // Service / Reason for appointment
    private String notes;         // Additional notes
    private String diagnosis;     // Diagnosis
    private String symptoms;      // Symptoms
    private String treatmentNotes;// Treatment plan / notes
    private UUID roomId;          // Optional room ID
}


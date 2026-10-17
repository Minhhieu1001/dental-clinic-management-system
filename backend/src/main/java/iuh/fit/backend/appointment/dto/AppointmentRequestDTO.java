package iuh.fit.backend.appointment.dto;

public record AppointmentRequestDTO(
        String fullName,
        String phone,
        String description,
        String branchId,
        String branchName
) {

}

package iuh.fit.backend.appointment.dto;

import iuh.fit.backend.appointment.enums.StatusAppointment;

public record AppointmentCheckinResponse(String appointmentCode, StatusAppointment status,
                                        boolean isCheck, boolean alreadyCheckedIn) {}

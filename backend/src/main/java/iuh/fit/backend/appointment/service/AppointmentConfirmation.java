package iuh.fit.backend.appointment.service;

public record AppointmentConfirmation(String email, String code, String patientName,
                                      String time, String dentist, String reason,
                                      String branchName, String address) {}

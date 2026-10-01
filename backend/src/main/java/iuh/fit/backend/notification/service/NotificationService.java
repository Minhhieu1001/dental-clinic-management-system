package iuh.fit.backend.notification.service;

public interface NotificationService {
    void sendAccountCreatedEmail(String email, String username, String password);
    void sendTreatmentRoadmapEmail(String email, String patientName, String phone, String planName, String roadmapDetailsHtml);
    void sendAppointmentReminderEmail(String email, String phone, String patientName, String appointmentTimeStr, String doctorName, String reason, String reminderType);
}

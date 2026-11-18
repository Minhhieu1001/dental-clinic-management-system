package iuh.fit.backend.customercare.consumer;

import iuh.fit.backend.config.RabbitMQConfig;
import iuh.fit.backend.customercare.repository.CareStrategyRepository;
import iuh.fit.backend.notification.dto.NotificationResponseDTO;
import iuh.fit.backend.notification.entity.Notification;
import iuh.fit.backend.notification.enums.NotificationType;
import iuh.fit.backend.notification.repository.notificationRepository;
import iuh.fit.backend.notification.service.EmailService;
import iuh.fit.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.util.HtmlUtils;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class CustomerCareConsumer {
    private final CareStrategyRepository repository;
    private final EmailService emailService;
    private final TransactionTemplate transactions;
    private final notificationRepository notifications;
    private final UserRepository users;
    private final SimpMessagingTemplate messaging;

    private record MailData(UUID id, UUID patientId, UUID userId, String userEmail,
                            UUID senderId, String email, String subject, String body) {}

    @RabbitListener(queues = RabbitMQConfig.CARE_QUEUE)
    public void receive(String careTaskId) {
        var mail = transactions.execute(status -> {
            var care = repository.findForUpdate(UUID.fromString(careTaskId)).orElse(null);
            if (care == null) return null;
            care.setStatus("SENT");
            var patient = care.getPatient();
            var user = patient.getUser();
            var sender = care.getEmployee().getUser();
            String email = patient.getEmail();
            if ((email == null || email.isBlank()) && user != null) email = user.getEmail();
            String content = care.getCareContent() == null ? "" : care.getCareContent();
            int separator = content.indexOf("\n\n");
            String subject = separator > 0 ? content.substring(0, separator).trim() : "Chăm sóc khách hàng - Crown Dental";
            subject = subject.replace('\n', ' ').replace('\r', ' ');
            if (subject.length() > 255) subject = subject.substring(0, 255);
            return new MailData(care.getCareTaskId(), patient.getId(), user == null ? null : user.getId(),
                    user == null ? null : user.getEmail(), sender == null ? null : sender.getId(), email == null ? "" : email.trim(),
                    subject, separator > 0 ? content.substring(separator + 2).trim() : content);
        });
        if (mail == null) return; // Only skip records that no longer exist.
        try {
            if (mail.email().isBlank()) throw new IllegalArgumentException("Bệnh nhân chưa có email");
            emailService.send(mail.email(), mail.subject(), "<html><body><div style=\"white-space:pre-wrap\">"
                    + HtmlUtils.htmlEscape(mail.body()) + "</div></body></html>");
        } catch (Exception error) {
            log.warn("Gửi email chăm sóc {} thất bại: {}", mail.id(), error.getMessage());
            return;
        }
        notifyPatient(mail);
    }

    private void notifyPatient(MailData mail) {
        if (mail.userId() == null) return;
        try {
            var dto = transactions.execute(status -> {
                var notification = notifications.saveAndFlush(Notification.builder()
                        .user(users.getReferenceById(mail.userId()))
                        .sender(mail.senderId() == null ? null : users.getReferenceById(mail.senderId()))
                        .title(mail.subject()).content(mail.body()).type(NotificationType.SYSTEM).build());
                return NotificationResponseDTO.builder().id(notification.getId()).userId(mail.userId())
                        .title(mail.subject()).content(mail.body()).type(NotificationType.SYSTEM)
                        .isRead(false).createdAt(notification.getCreatedAt()).build();
            });
            if (mail.userEmail() != null) messaging.convertAndSendToUser(mail.userEmail(), "/queue/notifications", dto);
            messaging.convertAndSend("/topic/patient/" + mail.patientId() + "/notifications", dto);
        } catch (Exception error) {
            log.warn("Email {} đã gửi, thông báo hệ thống gặp lỗi: {}", mail.id(), error.getMessage());
        }
    }
}

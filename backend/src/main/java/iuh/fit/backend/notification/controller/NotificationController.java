package iuh.fit.backend.notification.controller;

import iuh.fit.backend.notification.dto.CreateNotificationDTO;
import iuh.fit.backend.notification.dto.NotificationResponseDTO;
import iuh.fit.backend.notification.entity.Notification;
import iuh.fit.backend.notification.enums.NotificationType;
import iuh.fit.backend.notification.repository.notificationRepository;
import iuh.fit.backend.user.entity.User;
import iuh.fit.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final notificationRepository notificationRepo;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate simpMessagingTemplate;

    @PostMapping
    public ResponseEntity<NotificationResponseDTO> createNotification(@RequestBody CreateNotificationDTO dto) {
        if (dto.getUserId() == null) {
            return ResponseEntity.badRequest().build();
        }
        User recipient = userRepository.findById(dto.getUserId()).orElse(null);
        if (recipient == null) {
            return ResponseEntity.notFound().build();
        }

        User sender = null;
        if (dto.getSenderId() != null) {
            sender = userRepository.findById(dto.getSenderId()).orElse(null);
        }

        Notification notif = Notification.builder()
                .user(recipient)
                .sender(sender)
                .title(dto.getTitle() != null && !dto.getTitle().isBlank() ? dto.getTitle() : "Thông báo hệ thống")
                .content(dto.getContent() != null ? dto.getContent() : "")
                .type(dto.getType() != null ? dto.getType() : NotificationType.SYSTEM)
                .targetUrl(dto.getTargetUrl())
                .isRead(false)
                .build();

        notif = notificationRepo.save(notif);
        NotificationResponseDTO res = mapToDTO(notif);

        try {
            if (simpMessagingTemplate != null) {
                simpMessagingTemplate.convertAndSendToUser(recipient.getId().toString(), "/queue/notifications", res);
                simpMessagingTemplate.convertAndSend("/topic/notifications", res);
            }
        } catch (Exception e) {
            // ignore websocket errors
        }

        return ResponseEntity.ok(res);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<NotificationResponseDTO>> getNotificationsByUser(@PathVariable UUID userId) {
        List<Notification> list = notificationRepo.findByUserIdOrderByCreatedAtDesc(userId);
        List<NotificationResponseDTO> dtos = list.stream().map(this::mapToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable UUID id) {
        notificationRepo.findById(id).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepo.save(n);
        });
        return ResponseEntity.ok().build();
    }

    @PutMapping("/user/{userId}/read-all")
    public ResponseEntity<Void> markAllAsRead(@PathVariable UUID userId) {
        List<Notification> list = notificationRepo.findByUserIdOrderByCreatedAtDesc(userId);
        list.forEach(n -> n.setIsRead(true));
        notificationRepo.saveAll(list);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable UUID id) {
        if (notificationRepo.existsById(id)) {
            notificationRepo.deleteById(id);
        }
        return ResponseEntity.noContent().build();
    }

    private NotificationResponseDTO mapToDTO(Notification n) {
        return NotificationResponseDTO.builder()
                .id(n.getId())
                .userId(n.getUser() != null ? n.getUser().getId() : null)
                .senderId(n.getSender() != null ? n.getSender().getId() : null)
                .senderName(n.getSender() != null ? n.getSender().getUsername() : "Hệ thống")
                .title(n.getTitle())
                .content(n.getContent())
                .type(n.getType())
                .targetUrl(n.getTargetUrl())
                .isRead(n.getIsRead() != null ? n.getIsRead() : false)
                .createdAt(n.getCreatedAt())
                .build();
    }
}

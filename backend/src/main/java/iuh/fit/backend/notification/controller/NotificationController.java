package iuh.fit.backend.notification.controller;

import iuh.fit.backend.notification.dto.NotificationResponseDTO;
import iuh.fit.backend.notification.entity.Notification;
import iuh.fit.backend.notification.repository.notificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final notificationRepository notificationRepo;

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

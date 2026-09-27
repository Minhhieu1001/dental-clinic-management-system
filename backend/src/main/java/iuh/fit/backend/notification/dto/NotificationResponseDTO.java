package iuh.fit.backend.notification.dto;

import iuh.fit.backend.notification.enums.NotificationType;
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
public class NotificationResponseDTO {
    private UUID id;
    private UUID userId;
    private UUID senderId;
    private String senderName;
    private String title;
    private String content;
    private NotificationType type;
    private String targetUrl;
    private Boolean isRead;
    private LocalDateTime createdAt;
}

package iuh.fit.backend.notification.dto;

import iuh.fit.backend.notification.enums.NotificationType;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateNotificationDTO {
    private UUID userId;
    private UUID senderId;
    private String title;
    private String content;
    private NotificationType type;
    private String targetUrl;
}

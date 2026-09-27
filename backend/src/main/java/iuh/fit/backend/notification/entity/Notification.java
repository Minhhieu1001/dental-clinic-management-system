package iuh.fit.backend.notification.entity;

import iuh.fit.backend.notification.enums.NotificationType;
import iuh.fit.backend.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "notifications")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // Người nhận thông báo (Bác sĩ / Lễ tân / Bệnh nhân)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id")
    private User sender; // Người gửi / Tác nhân tạo thông báo (Có thể null nếu hệ thống tạo)

    @Column(length = 255, nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Enumerated(EnumType.STRING)
    private NotificationType type;

    @Column(length = 255)
    private String targetUrl;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isRead = false;

    @CreationTimestamp
    private LocalDateTime createdAt;
}

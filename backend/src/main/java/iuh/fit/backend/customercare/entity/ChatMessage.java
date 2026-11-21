package iuh.fit.backend.customercare.entity;

import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.user.entity.Employee;
import iuh.fit.backend.customercare.enums.MessageType;
import iuh.fit.backend.customercare.enums.SenderType;
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
@Table(name = "chat_messages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "chat_room_id", nullable = false)
    private ChatRoom chatRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_patient_id")
    private Patient senderPatient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_employee_id")
    private Employee senderEmployee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SenderType senderType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MessageType messageType;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isRead = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}


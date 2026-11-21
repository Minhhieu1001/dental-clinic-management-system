package iuh.fit.backend.customercare.dto;

import iuh.fit.backend.customercare.enums.MessageType;
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
public class ChatRoomResponse {
    private UUID id;
    private UUID patientId;
    private String patientName;
    private String patientCode;
    private String patientPhone;
    private String patientAvatar;
    private String branchId;
    private String branchName;
    private String lastMessage;
    private MessageType lastMessageType;
    private LocalDateTime lastMessageTime;
    private long unreadCount;
    private long patientUnreadCount;
    private Boolean status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

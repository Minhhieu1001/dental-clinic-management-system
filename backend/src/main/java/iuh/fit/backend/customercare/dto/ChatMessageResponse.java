package iuh.fit.backend.customercare.dto;

import iuh.fit.backend.customercare.enums.MessageType;
import iuh.fit.backend.customercare.enums.SenderType;
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
public class ChatMessageResponse {
    private UUID id;
    private UUID chatRoomId;
    private SenderType senderType;
    private MessageType messageType;
    private String content;
    private Boolean isRead;
    private UUID senderPatientId;
    private String senderPatientName;
    private UUID senderEmployeeId;
    private String senderEmployeeName;
    private LocalDateTime createdAt;
}

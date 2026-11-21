package iuh.fit.backend.customercare.dto;

import iuh.fit.backend.customercare.enums.MessageType;
import iuh.fit.backend.customercare.enums.SenderType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {
    @NotNull(message = "Mã phòng chat không được để trống")
    private UUID roomId;

    @NotBlank(message = "Nội dung tin nhắn không được để trống")
    private String content;

    @NotNull(message = "Loại người gửi không được để trống")
    private SenderType senderType;

    @Builder.Default
    private MessageType messageType = MessageType.TEXT;

    private UUID senderPatientId;
    private UUID senderEmployeeId;
}

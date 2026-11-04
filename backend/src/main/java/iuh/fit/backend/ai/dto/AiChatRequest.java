package iuh.fit.backend.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiChatRequest {
    private String message;   // Câu hỏi của khách
    private String sessionId; // Mã phiên (nếu rỗng, backend tự sinh)
}
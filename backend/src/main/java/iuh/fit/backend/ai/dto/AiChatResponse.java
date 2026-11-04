package iuh.fit.backend.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiChatResponse {
    private String reply;     // Câu trả lời hoàn chỉnh từ Agent
    private String sessionId; // Trả lại sessionId để FE lưu cho câu chat sau
}
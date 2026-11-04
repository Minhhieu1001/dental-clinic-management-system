package iuh.fit.backend.ai.controller;

import iuh.fit.backend.ai.dto.AiChatRequest;
import iuh.fit.backend.ai.dto.AiChatResponse;
import iuh.fit.backend.ai.service.AiAgentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiChatController {

    private final AiAgentService aiAgentService;

    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(@RequestBody AiChatRequest request) {
        String sessionId = (request.getSessionId() != null && !request.getSessionId().isBlank())
                ? request.getSessionId()
                : UUID.randomUUID().toString();

        String reply = aiAgentService.chat(request.getMessage(), sessionId);
        return ResponseEntity.ok(new AiChatResponse(reply, sessionId));
    }
}
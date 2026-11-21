package iuh.fit.backend.customercare.controller;

import iuh.fit.backend.common.response.ApiResponse;
import iuh.fit.backend.customercare.dto.ChatMessageResponse;
import iuh.fit.backend.customercare.dto.ChatRoomResponse;
import iuh.fit.backend.customercare.dto.SendMessageRequest;
import iuh.fit.backend.customercare.enums.SenderType;
import iuh.fit.backend.customercare.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/rooms/get-or-create")
    public ResponseEntity<ApiResponse<ChatRoomResponse>> getOrCreateRoom(
            @RequestParam(required = false) String patientId,
            @RequestParam(required = false) String branchId
    ) {
        UUID parsedPatientId = parseUUIDSafely(patientId);
        ChatRoomResponse response = chatService.getOrCreateRoom(parsedPatientId, branchId);
        return ResponseEntity.ok(ApiResponse.success("Khởi tạo phòng chat thành công", response));
    }

    @GetMapping("/rooms/branch/{branchId}")
    public ResponseEntity<ApiResponse<List<ChatRoomResponse>>> getRoomsByBranch(
            @PathVariable String branchId
    ) {
        List<ChatRoomResponse> rooms = chatService.getRoomsByBranch(branchId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách phòng chat chi nhánh thành công", rooms));
    }

    @GetMapping("/rooms/patient/{patientId}")
    public ResponseEntity<ApiResponse<List<ChatRoomResponse>>> getRoomsByPatient(
            @PathVariable String patientId
    ) {
        UUID parsedPatientId = parseUUIDSafely(patientId);
        List<ChatRoomResponse> rooms = chatService.getRoomsByPatient(parsedPatientId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách phòng chat bệnh nhân thành công", rooms));
    }

    private UUID parseUUIDSafely(String val) {
        if (val == null || val.isBlank()) return null;
        try {
            return UUID.fromString(val.trim());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    @GetMapping("/rooms/{roomId}")
    public ResponseEntity<ApiResponse<ChatRoomResponse>> getRoomById(
            @PathVariable UUID roomId
    ) {
        ChatRoomResponse room = chatService.getRoomById(roomId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin phòng chat thành công", room));
    }

    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getMessagesByRoom(
            @PathVariable UUID roomId
    ) {
        List<ChatMessageResponse> messages = chatService.getMessagesByRoom(roomId);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử tin nhắn thành công", messages));
    }

    @PostMapping("/messages")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
            @Valid @RequestBody SendMessageRequest request
    ) {
        ChatMessageResponse response = chatService.sendMessage(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<ChatMessageResponse>builder()
                        .status(HttpStatus.CREATED.value())
                        .message("Gửi tin nhắn thành công")
                        .data(response)
                        .build());
    }

    @PutMapping("/messages/{messageId}/recall")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> recallMessage(@PathVariable UUID messageId) {
        return ResponseEntity.ok(ApiResponse.success("Message recalled", chatService.recallMessage(messageId)));
    }

    @PutMapping("/rooms/{roomId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable UUID roomId,
            @RequestParam(defaultValue = "EMPLOYEE") SenderType senderType
    ) {
        chatService.markAsRead(roomId, senderType);
        return ResponseEntity.ok(ApiResponse.success("Đánh dấu tin nhắn đã đọc thành công", null));
    }
}

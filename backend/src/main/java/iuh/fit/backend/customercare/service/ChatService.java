package iuh.fit.backend.customercare.service;

import iuh.fit.backend.customercare.dto.ChatMessageResponse;
import iuh.fit.backend.customercare.dto.ChatRoomResponse;
import iuh.fit.backend.customercare.dto.SendMessageRequest;
import iuh.fit.backend.customercare.enums.SenderType;

import java.util.List;
import java.util.UUID;

public interface ChatService {

    ChatRoomResponse getOrCreateRoom(UUID patientId, String branchId);

    List<ChatRoomResponse> getRoomsByBranch(String branchId);

    List<ChatRoomResponse> getRoomsByPatient(UUID patientId);

    ChatRoomResponse getRoomById(UUID roomId);

    List<ChatMessageResponse> getMessagesByRoom(UUID roomId);

    ChatMessageResponse sendMessage(SendMessageRequest request);

    ChatMessageResponse recallMessage(UUID messageId);

    void markAsRead(UUID roomId, SenderType readerSenderType);
}

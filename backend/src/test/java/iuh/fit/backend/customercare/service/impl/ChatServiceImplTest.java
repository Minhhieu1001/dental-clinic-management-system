package iuh.fit.backend.customercare.service.impl;

import iuh.fit.backend.common.security.CustomUserDetails;
import iuh.fit.backend.customercare.entity.ChatMessage;
import iuh.fit.backend.customercare.entity.ChatRoom;
import iuh.fit.backend.customercare.enums.MessageType;
import iuh.fit.backend.customercare.enums.SenderType;
import iuh.fit.backend.customercare.repository.ChatMessageRepository;
import iuh.fit.backend.customercare.repository.ChatRoomRepository;
import iuh.fit.backend.inforclinic.entity.Branch;
import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.patient.repository.PatientRepository;
import iuh.fit.backend.user.enums.Role;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import iuh.fit.backend.user.entity.User;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ChatServiceImplTest {
    private final ChatMessageRepository messages = mock(ChatMessageRepository.class);
    private final SimpMessagingTemplate websocket = mock(SimpMessagingTemplate.class);
    private final PatientRepository patients = mock(PatientRepository.class);
    private final ChatRoomRepository rooms = mock(ChatRoomRepository.class);
    private final ChatServiceImpl service = new ChatServiceImpl(rooms, messages, patients, null, null, websocket);

    @AfterEach
    void cleanup() {
        SecurityContextHolder.clearContext();
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    private User login() {
        User user = User.builder().id(UUID.randomUUID()).build();
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(new CustomUserDetails(user), null, List.of()));
        return user;
    }

    @Test
    void senderCanRecallImageAndBroadcastAfterCommit() {
        User user = login();
        ChatRoom room = ChatRoom.builder().id(UUID.randomUUID())
            .branch(Branch.builder().branchId("BR-01").build()).build();
        ChatMessage message = ChatMessage.builder().id(UUID.randomUUID()).chatRoom(room)
            .senderType(SenderType.PATIENT).senderPatient(Patient.builder().user(user).build())
            .messageType(MessageType.IMAGE).content("https://example.com/image.jpg").build();
        when(messages.findById(message.getId())).thenReturn(Optional.of(message));
        TransactionSynchronizationManager.initSynchronization();
        var response = service.recallMessage(message.getId());
        assertEquals("", message.getContent());
        assertEquals("", response.getContent());
        assertEquals(message.getId(), response.getId());
        assertEquals(MessageType.IMAGE, response.getMessageType());
        verify(messages).save(message);
        verifyNoInteractions(websocket);
        TransactionSynchronizationManager.getSynchronizations().forEach(sync -> sync.afterCommit());
        verify(websocket).convertAndSend("/topic/chat/" + room.getId(), response);
        verify(websocket).convertAndSend("/topic/branch/BR-01/chat", response);
    }

    @Test
    void anotherUserCannotRecallMessage() {
        login();
        ChatMessage message = ChatMessage.builder().id(UUID.randomUUID())
            .senderType(SenderType.PATIENT)
            .senderPatient(Patient.builder().user(User.builder().id(UUID.randomUUID()).build()).build())
            .content("Original").build();
        when(messages.findById(message.getId())).thenReturn(Optional.of(message));
        assertThrows(AccessDeniedException.class, () -> service.recallMessage(message.getId()));
        assertEquals("Original", message.getContent());
        verify(messages, never()).save(any());
        verifyNoInteractions(websocket);
    }

    @Test
    void anonymousCannotRecallMessage() {
        assertThrows(AuthenticationCredentialsNotFoundException.class, () -> service.recallMessage(UUID.randomUUID()));
        verifyNoInteractions(messages, websocket);
    }
    @Test
    void patientLoggedInByCodeCanRecallOwnUnlinkedProfileMessage() {
        User user = login();
        user.setRole(Role.PATIENT);
        user.setCodeName("BN001");
        Patient patient = Patient.builder().id(UUID.randomUUID()).patientCode("BN001").build();
        when(patients.findByUserId(user.getId())).thenReturn(Optional.empty());
        when(patients.findByPatientCode("BN001")).thenReturn(Optional.of(patient));
        ChatRoom room = ChatRoom.builder().id(UUID.randomUUID())
            .branch(Branch.builder().branchId("BR-01").build()).build();
        ChatMessage message = ChatMessage.builder().id(UUID.randomUUID()).chatRoom(room)
            .senderType(SenderType.PATIENT).senderPatient(patient)
            .messageType(MessageType.TEXT).content("Hello").build();
        when(messages.findById(message.getId())).thenReturn(Optional.of(message));
        TransactionSynchronizationManager.initSynchronization();
        assertEquals("", service.recallMessage(message.getId()).getContent());
    }

    @Test
    void patientCodeCannotOverrideAnotherUsersLinkedProfile() {
        User user = login();
        user.setRole(Role.PATIENT);
        user.setCodeName("BN001");
        Patient patient = Patient.builder().id(UUID.randomUUID()).patientCode("BN001")
            .user(User.builder().id(UUID.randomUUID()).build()).build();
        ChatMessage message = ChatMessage.builder().id(UUID.randomUUID())
            .senderType(SenderType.PATIENT).senderPatient(patient).content("Original").build();
        when(messages.findById(message.getId())).thenReturn(Optional.of(message));
        assertThrows(AccessDeniedException.class, () -> service.recallMessage(message.getId()));
        verifyNoInteractions(patients);
        assertEquals("Original", message.getContent());
    }

    @Test
    void patientCannotRecallAnotherUnlinkedProfilesMessage() {
        User user = login();
        user.setRole(Role.PATIENT);
        user.setCodeName("BN001");
        when(patients.findByUserId(user.getId())).thenReturn(Optional.empty());
        when(patients.findByPatientCode("BN001"))
            .thenReturn(Optional.of(Patient.builder().id(UUID.randomUUID()).build()));
        ChatMessage message = ChatMessage.builder().id(UUID.randomUUID())
            .senderType(SenderType.PATIENT)
            .senderPatient(Patient.builder().id(UUID.randomUUID()).build()).content("Original").build();
        when(messages.findById(message.getId())).thenReturn(Optional.of(message));
        assertThrows(AccessDeniedException.class, () -> service.recallMessage(message.getId()));
        assertEquals("Original", message.getContent());
    }

    @Test
    void roomPreviewIncludesMediaTypeAndSeparateUnreadCounts() {
        Patient patient = Patient.builder().id(UUID.randomUUID()).build();
        ChatRoom room = ChatRoom.builder().id(UUID.randomUUID()).patient(patient)
            .branch(Branch.builder().branchId("BR-01").build()).build();
        when(patients.findById(patient.getId())).thenReturn(Optional.of(patient));
        when(rooms.findAllByPatientIdOrderByUpdatedAtDesc(patient.getId())).thenReturn(List.of(room));
        when(messages.countUnreadMessagesByRoomAndSenderType(room.getId(), SenderType.PATIENT)).thenReturn(2L);
        when(messages.countUnreadMessagesByRoomAndSenderType(room.getId(), SenderType.EMPLOYEE)).thenReturn(3L);
        for (MessageType type : List.of(MessageType.IMAGE, MessageType.STICKER)) {
            when(messages.findLatestMessagesByRoomId(room.getId())).thenReturn(List.of(
                ChatMessage.builder().messageType(type).content("https://example.com/media.png").build()));
            var response = service.getRoomsByPatient(patient.getId()).get(0);
            assertEquals(type, response.getLastMessageType());
            assertEquals(2L, response.getUnreadCount());
            assertEquals(3L, response.getPatientUnreadCount());
        }
    }

}

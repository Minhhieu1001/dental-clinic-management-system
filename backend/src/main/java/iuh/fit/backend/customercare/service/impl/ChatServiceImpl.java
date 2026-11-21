package iuh.fit.backend.customercare.service.impl;

import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.exception.ErrorCode;
import iuh.fit.backend.customercare.dto.ChatMessageResponse;
import iuh.fit.backend.customercare.dto.ChatRoomResponse;
import iuh.fit.backend.customercare.dto.SendMessageRequest;
import iuh.fit.backend.customercare.entity.ChatMessage;
import iuh.fit.backend.customercare.entity.ChatRoom;
import iuh.fit.backend.customercare.enums.MessageType;
import iuh.fit.backend.customercare.enums.SenderType;
import iuh.fit.backend.customercare.repository.ChatMessageRepository;
import iuh.fit.backend.customercare.repository.ChatRoomRepository;
import iuh.fit.backend.customercare.service.ChatService;
import iuh.fit.backend.inforclinic.entity.Branch;
import iuh.fit.backend.inforclinic.repository.BranchRepository;
import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.patient.repository.PatientRepository;
import iuh.fit.backend.user.entity.Employee;
import iuh.fit.backend.user.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import iuh.fit.backend.user.enums.Role;
import iuh.fit.backend.common.security.CustomUserDetails;
import iuh.fit.backend.user.entity.User;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final PatientRepository patientRepository;
    private final BranchRepository branchRepository;
    private final EmployeeRepository employeeRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public ChatRoomResponse getOrCreateRoom(UUID patientId, String branchId) {
        Patient patient = resolvePatient(patientId);
        Branch branch = resolveBranch(branchId);

        Optional<ChatRoom> existingRoom = chatRoomRepository.findByPatientIdAndBranchId(
                patient.getId(),
                branch.getBranchId());

        if (existingRoom.isPresent()) {
            return toRoomResponse(existingRoom.get());
        }

        ChatRoom newRoom = ChatRoom.builder()
                .patient(patient)
                .branch(branch)
                .status(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        ChatRoom savedRoom = chatRoomRepository.save(newRoom);

        // Tạo tin nhắn chào mừng mặc định của hệ thống
        ChatMessage welcomeMsg = ChatMessage.builder()
                .chatRoom(savedRoom)
                .senderType(SenderType.SYSTEM)
                .messageType(MessageType.SYSTEM)
                .content("Cuộc trò chuyện tư vấn được kết nối với " + branch.getBranchName() + ".")
                .isRead(true)
                .createdAt(LocalDateTime.now())
                .build();
        chatMessageRepository.save(welcomeMsg);

        return toRoomResponse(savedRoom);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatRoomResponse> getRoomsByBranch(String branchId) {
        Branch branch = resolveBranch(branchId);
        List<ChatRoom> rooms = chatRoomRepository.findAllByBranchIdOrderByUpdatedAtDesc(branch.getBranchId());
        return rooms.stream().map(this::toRoomResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatRoomResponse> getRoomsByPatient(UUID patientId) {
        Patient patient = resolvePatient(patientId);
        List<ChatRoom> rooms = chatRoomRepository.findAllByPatientIdOrderByUpdatedAtDesc(patient.getId());
        return rooms.stream().map(this::toRoomResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ChatRoomResponse getRoomById(UUID roomId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phòng chat với mã: " + roomId));
        return toRoomResponse(room);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessagesByRoom(UUID roomId) {
        List<ChatMessage> messages = chatMessageRepository.findAllByChatRoomIdOrderByCreatedAtAsc(roomId);
        return messages.stream().map(this::toMessageResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ChatMessageResponse sendMessage(SendMessageRequest request) {
        ChatRoom room = chatRoomRepository.findById(request.getRoomId())
                .orElseThrow(
                        () -> new IllegalArgumentException("Không tìm thấy phòng chat với mã: " + request.getRoomId()));

        Patient senderPatient = null;
        Employee senderEmployee = null;

        if (request.getSenderType() == SenderType.PATIENT) {
            if (request.getSenderPatientId() != null) {
                senderPatient = patientRepository.findById(request.getSenderPatientId()).orElse(room.getPatient());
            } else {
                senderPatient = room.getPatient();
            }
        } else if (request.getSenderType() == SenderType.EMPLOYEE) {
            if (request.getSenderEmployeeId() != null) {
                senderEmployee = employeeRepository.findById(request.getSenderEmployeeId()).orElse(null);
            }
        }

        ChatMessage message = ChatMessage.builder()
                .chatRoom(room)
                .senderPatient(senderPatient)
                .senderEmployee(senderEmployee)
                .senderType(request.getSenderType())
                .messageType(request.getMessageType() != null ? request.getMessageType() : MessageType.TEXT)
                .content(request.getContent().trim())
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        ChatMessage savedMessage = chatMessageRepository.save(message);

        // Cập nhật thời điểm cập nhật mới nhất của phòng chat
        room.setUpdatedAt(LocalDateTime.now());
        chatRoomRepository.save(room);

        ChatMessageResponse response = toMessageResponse(savedMessage);

        broadcastAfterCommit(room, response);

        return response;
    }

    @Override
    @Transactional
    public void markAsRead(UUID roomId, SenderType readerSenderType) {
        SenderType oppositeSender = (readerSenderType == SenderType.PATIENT)
                ? SenderType.EMPLOYEE
                : SenderType.PATIENT;

        chatMessageRepository.markMessagesFromSenderAsRead(roomId, oppositeSender);
    }

    @Override
    @Transactional
    public ChatMessageResponse recallMessage(UUID messageId) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof CustomUserDetails current)) {
            throw new AuthenticationCredentialsNotFoundException("Authentication required");
        }
        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found: " + messageId));
        User owner = null;
        if (message.getSenderType() == SenderType.PATIENT && message.getSenderPatient() != null) {
            owner = message.getSenderPatient().getUser();
        } else if (message.getSenderType() == SenderType.EMPLOYEE && message.getSenderEmployee() != null) {
            owner = message.getSenderEmployee().getUser();
        }
        boolean isOwner = owner != null && owner.getId().equals(current.getUser().getId());
        // Match patient login's legacy profile lookup, without overriding another user's link.
        if (owner == null && message.getSenderType() == SenderType.PATIENT
                && message.getSenderPatient() != null && current.getUser().getRole() == Role.PATIENT) {
            User currentUser = current.getUser();
            Optional<Patient> currentPatient = patientRepository.findByUserId(currentUser.getId());
            if (currentPatient.isEmpty() && currentUser.getCodeName() != null
                    && !currentUser.getCodeName().isBlank()) {
                currentPatient = patientRepository.findByPatientCode(currentUser.getCodeName());
            }
            isOwner = currentPatient.map(patient -> patient.getId().equals(message.getSenderPatient().getId()))
                    .orElse(false);
        }
        if (!isOwner) {
            throw new AccessDeniedException("Only the sender can recall this message");
        }
        message.setContent("");
        chatMessageRepository.save(message);
        ChatMessageResponse response = toMessageResponse(message);
        broadcastAfterCommit(message.getChatRoom(), response);
        return response;
    }

    private void broadcastAfterCommit(ChatRoom room, ChatMessageResponse response) {
        UUID roomId = room.getId();
        String branchId = room.getBranch() != null ? room.getBranch().getBranchId() : null;
        UUID patientId = room.getPatient() != null ? room.getPatient().getId() : null;
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    messagingTemplate.convertAndSend("/topic/chat/" + roomId, response);
                    if (branchId != null) messagingTemplate.convertAndSend("/topic/branch/" + branchId + "/chat", response);
                    if (patientId != null) messagingTemplate.convertAndSend("/topic/patient/" + patientId + "/chat", response);
                } catch (Exception ex) {
                    log.warn("Failed to broadcast chat update: {}", ex.getMessage());
                }
            }
        });
    }

    private Patient resolvePatient(UUID patientId) {
        if (patientId != null) {
            Optional<Patient> p = patientRepository.findById(patientId);
            if (p.isPresent())
                return p.get();
        }
        // Fallback lấy bệnh nhân đầu tiên nếu id tạm/mock hoặc không tìm thấy
        List<Patient> all = patientRepository.findAll();
        if (!all.isEmpty()) {
            return all.get(0);
        }
        throw new AppException(ErrorCode.PATIENT_NOT_FOUND);
    }

    private Branch resolveBranch(String branchId) {
        if (branchId != null && !branchId.isBlank()) {
            Optional<Branch> b = branchRepository.findById(branchId);
            if (b.isPresent())
                return b.get();

            Optional<Branch> byName = branchRepository.findFirstByBranchNameIgnoreCase(branchId);
            if (byName.isPresent())
                return byName.get();
        }
        List<Branch> branches = branchRepository.findAll();
        if (!branches.isEmpty()) {
            return branches.get(0);
        }
        throw new IllegalArgumentException("Không tìm thấy chi nhánh phòng khám");
    }

    private ChatRoomResponse toRoomResponse(ChatRoom room) {
        List<ChatMessage> latest = chatMessageRepository.findLatestMessagesByRoomId(room.getId());
        String lastMsg = null;
        LocalDateTime lastMsgTime = room.getUpdatedAt();

        if (!latest.isEmpty()) {
            lastMsg = latest.get(0).getContent();
            lastMsgTime = latest.get(0).getCreatedAt();
        }

        long unread = chatMessageRepository.countUnreadMessagesByRoomAndSenderType(
                room.getId(),
                SenderType.PATIENT);

        Patient p = room.getPatient();
        Branch b = room.getBranch();

        return ChatRoomResponse.builder()
                .id(room.getId())
                .patientId(p != null ? p.getId() : null)
                .patientName(p != null ? p.getFullName() : "Bệnh nhân")
                .patientCode(p != null ? p.getPatientCode() : "")
                .patientPhone(p != null ? p.getPhoneNumber() : "")
                .branchId(b != null ? b.getBranchId() : null)
                .branchName(b != null ? b.getBranchName() : "")
                .lastMessage(lastMsg)
                .lastMessageType(latest.isEmpty() ? null : latest.get(0).getMessageType())
                .patientUnreadCount(chatMessageRepository.countUnreadMessagesByRoomAndSenderType(room.getId(), SenderType.EMPLOYEE))
                .lastMessageTime(lastMsgTime)
                .unreadCount(unread)
                .status(room.getStatus())
                .createdAt(room.getCreatedAt())
                .updatedAt(room.getUpdatedAt())
                .build();
    }

    private ChatMessageResponse toMessageResponse(ChatMessage m) {
        String employeeName = null;
        if (m.getSenderEmployee() != null) {
            employeeName = m.getSenderEmployee().getFullName();
        } else if (m.getSenderType() == SenderType.EMPLOYEE) {
            employeeName = "Tư vấn viên " + (m.getChatRoom() != null && m.getChatRoom().getBranch() != null
                    ? m.getChatRoom().getBranch().getBranchName()
                    : "Crown Dental");
        }

        String patientName = null;
        if (m.getSenderPatient() != null) {
            patientName = m.getSenderPatient().getFullName();
        }

        return ChatMessageResponse.builder()
                .id(m.getId())
                .chatRoomId(m.getChatRoom() != null ? m.getChatRoom().getId() : null)
                .senderType(m.getSenderType())
                .messageType(m.getMessageType())
                .content(m.getContent())
                .isRead(m.getIsRead())
                .senderPatientId(m.getSenderPatient() != null ? m.getSenderPatient().getId() : null)
                .senderPatientName(patientName)
                .senderEmployeeId(m.getSenderEmployee() != null ? m.getSenderEmployee().getId() : null)
                .senderEmployeeName(employeeName)
                .createdAt(m.getCreatedAt())
                .build();
    }
}

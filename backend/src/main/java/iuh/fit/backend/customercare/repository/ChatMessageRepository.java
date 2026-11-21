package iuh.fit.backend.customercare.repository;

import iuh.fit.backend.customercare.entity.ChatMessage;
import iuh.fit.backend.customercare.enums.SenderType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    @Query("SELECT m FROM ChatMessage m " +
           "LEFT JOIN FETCH m.senderPatient sp " +
           "LEFT JOIN FETCH m.senderEmployee se " +
           "WHERE m.chatRoom.id = :roomId " +
           "ORDER BY m.createdAt ASC")
    List<ChatMessage> findAllByChatRoomIdOrderByCreatedAtAsc(@Param("roomId") UUID roomId);

    @Query("SELECT m FROM ChatMessage m " +
           "WHERE m.chatRoom.id = :roomId " +
           "ORDER BY m.createdAt DESC")
    List<ChatMessage> findLatestMessagesByRoomId(@Param("roomId") UUID roomId);

    @Query("SELECT COUNT(m) FROM ChatMessage m " +
           "WHERE m.chatRoom.id = :roomId AND m.senderType = :senderType AND m.isRead = false")
    long countUnreadMessagesByRoomAndSenderType(
            @Param("roomId") UUID roomId,
            @Param("senderType") SenderType senderType
    );

    @Modifying
    @Query("UPDATE ChatMessage m SET m.isRead = true " +
           "WHERE m.chatRoom.id = :roomId AND m.senderType = :senderType AND m.isRead = false")
    void markMessagesFromSenderAsRead(
            @Param("roomId") UUID roomId,
            @Param("senderType") SenderType senderType
    );
}

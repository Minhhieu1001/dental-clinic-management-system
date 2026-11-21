package iuh.fit.backend.customercare.repository;

import iuh.fit.backend.customercare.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, UUID> {

    @Query("SELECT r FROM ChatRoom r " +
           "WHERE r.patient.id = :patientId AND r.branch.branchId = :branchId")
    Optional<ChatRoom> findByPatientIdAndBranchId(
            @Param("patientId") UUID patientId,
            @Param("branchId") String branchId
    );

    @Query("SELECT r FROM ChatRoom r " +
           "LEFT JOIN FETCH r.patient p " +
           "LEFT JOIN FETCH r.branch b " +
           "WHERE r.branch.branchId = :branchId " +
           "ORDER BY r.updatedAt DESC")
    List<ChatRoom> findAllByBranchIdOrderByUpdatedAtDesc(@Param("branchId") String branchId);

    @Query("SELECT r FROM ChatRoom r " +
           "LEFT JOIN FETCH r.patient p " +
           "LEFT JOIN FETCH r.branch b " +
           "WHERE r.patient.id = :patientId " +
           "ORDER BY r.updatedAt DESC")
    List<ChatRoom> findAllByPatientIdOrderByUpdatedAtDesc(@Param("patientId") UUID patientId);
}

package iuh.fit.backend.appointment.repository;

import iuh.fit.backend.appointment.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.List;

@Repository
public interface RoomRepository extends JpaRepository<Room, UUID> {
    List<Room> findByBranch_BranchIdOrderByRoomNameAsc(String branchId);
}

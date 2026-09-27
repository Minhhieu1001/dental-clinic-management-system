package iuh.fit.backend.appointment.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import iuh.fit.backend.patient.entity.Patient;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "rooms")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String roomName;
    private String floorName;
    private LocalDateTime createAt;

    @JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "room", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<Appointment> appointments = new ArrayList<>();
}

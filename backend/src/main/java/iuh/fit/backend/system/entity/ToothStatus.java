package iuh.fit.backend.system.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tooth_status")
public class ToothStatus {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String toothCode;
    private String label;
    private String color;

}

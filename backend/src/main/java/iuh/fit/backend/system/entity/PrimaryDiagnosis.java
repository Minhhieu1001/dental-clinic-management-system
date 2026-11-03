package iuh.fit.backend.system.entity;


import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "primary_diagnosis")
public class PrimaryDiagnosis {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String primaryDiagnosisName;

    private boolean status;

}

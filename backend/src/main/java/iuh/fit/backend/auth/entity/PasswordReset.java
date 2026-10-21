package iuh.fit.backend.auth.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "password_resets")
@Getter
@Setter
@NoArgsConstructor
public class PasswordReset {
    // One row per account; operations serialize using a lock on the user row.
    @Id
    private UUID userId;
    private String codeHash;
    private Instant codeExpiresAt;
    private Instant sentAt;
    private int failedAttempts;
    private String tokenHash;
    private Instant tokenExpiresAt;
}

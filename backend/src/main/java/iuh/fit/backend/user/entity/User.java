package iuh.fit.backend.user.entity;

import iuh.fit.backend.user.enums.Role;
import iuh.fit.backend.user.enums.StatusUser;
import iuh.fit.backend.notification.entity.Notification;
import iuh.fit.backend.patient.entity.Patient;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

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
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(length = 255)
    private String username;

    @Column(length = 255)
    private String password;

    @Column(length = 255, unique = true)
    private String email;

    @Column(length = 255)
    private String phone;

    @Column(length = 255)
    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    private Role role;

    @Enumerated(EnumType.STRING)
    private StatusUser status;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @OneToOne(mappedBy = "user", fetch = FetchType.LAZY)
    private Employee employee;

    @OneToOne(mappedBy = "user", fetch = FetchType.LAZY)
    private Dentist dentist;

    @Builder.Default
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<Notification> notifications = new ArrayList<>();
}

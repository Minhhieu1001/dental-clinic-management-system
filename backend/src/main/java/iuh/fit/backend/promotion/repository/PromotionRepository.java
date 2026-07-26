package iuh.fit.backend.promotion.repository;

import iuh.fit.backend.promotion.entity.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PromotionRepository extends JpaRepository<Promotion, UUID> {
}

package iuh.fit.backend.promotion.repository;

import iuh.fit.backend.promotion.entity.Promotion;
import iuh.fit.backend.promotion.enums.PromotionStatus;
import iuh.fit.backend.promotion.enums.PromotionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PromotionRepository extends JpaRepository<Promotion, UUID> {

    @Query("""
            SELECT DISTINCT p
            FROM Promotion p
            LEFT JOIN FETCH p.services
            WHERE p.promotionType = :promotionType
              AND p.status = :status
              AND (p.startDate IS NULL OR p.startDate <= :currentTime)
              AND (p.endDate IS NULL OR p.endDate >= :currentTime)
              AND (p.usageLimit IS NULL OR COALESCE(p.usedCount, 0) < p.usageLimit)
            ORDER BY p.startDate DESC
            """)
    List<Promotion> findAvailablePromotions(
            @Param("promotionType") PromotionType promotionType,
            @Param("status") PromotionStatus status,
            @Param("currentTime") LocalDateTime currentTime
    );

    @Query("""
            SELECT DISTINCT p
            FROM Promotion p
            LEFT JOIN FETCH p.services
            WHERE p.status = :status
              AND (p.startDate IS NULL OR p.startDate <= :currentTime)
              AND (p.endDate IS NULL OR p.endDate >= :currentTime)
              AND (p.usageLimit IS NULL OR COALESCE(p.usedCount, 0) < p.usageLimit)
            ORDER BY p.startDate DESC
            """)
    List<Promotion> findCurrentPromotions(
            @Param("status") PromotionStatus status,
            @Param("currentTime") LocalDateTime currentTime
    );

    @Query("""
            SELECT DISTINCT p
            FROM Promotion p
            LEFT JOIN FETCH p.services
            WHERE LOWER(p.couponCode) = LOWER(:couponCode)
              AND p.promotionType = :promotionType
              AND p.status = :status
              AND (p.startDate IS NULL OR p.startDate <= :currentTime)
              AND (p.endDate IS NULL OR p.endDate >= :currentTime)
              AND (p.usageLimit IS NULL OR COALESCE(p.usedCount, 0) < p.usageLimit)
            """)
    Optional<Promotion> findAvailableVoucherByCouponCode(
            @Param("couponCode") String couponCode,
            @Param("promotionType") PromotionType promotionType,
            @Param("status") PromotionStatus status,
            @Param("currentTime") LocalDateTime currentTime
    );
}

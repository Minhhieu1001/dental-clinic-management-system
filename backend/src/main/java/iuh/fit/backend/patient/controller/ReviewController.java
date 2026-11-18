package iuh.fit.backend.patient.controller;

import iuh.fit.backend.patient.entity.Review;
import iuh.fit.backend.patient.repository.ReviewRepository;
import lombok.Builder;
import lombok.Data;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/api/v1/reviews", "/api/reviews"})
public class ReviewController {

    private final ReviewRepository reviewRepository;

    public ReviewController(ReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
    }

    @GetMapping
    public List<ReviewDto> getAllReviews() {
        return reviewRepository.findAll().stream()
                .map(r -> ReviewDto.builder()
                        .id(r.getId())
                        .rating(r.getRating())
                        .comment(r.getComment())
                        .authorName(r.getPatient() != null ? r.getPatient().getFullName() : "Khách hàng ẩn danh")
                        .createdAt(r.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Data
    @Builder
    public static class ReviewDto {
        private UUID id;
        private Integer rating;
        private String comment;
        private String authorName;
        private LocalDateTime createdAt;
    }
}

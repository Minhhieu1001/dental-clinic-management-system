package iuh.fit.backend.treatment.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/data-fix")
@RequiredArgsConstructor
public class DataFixController {

    private final JdbcTemplate jdbcTemplate;

    /**
     * Kiểm tra và hiển thị các giá trị status không hợp lệ trong treatment_plans và treatment_phases
     * GET /api/v1/data-fix/check-status
     */
    @GetMapping("/check-status")
    public ResponseEntity<Map<String, Object>> checkInvalidStatus() {
        Map<String, Object> response = new LinkedHashMap<>();

        // Kiểm tra treatment_plans
        List<Map<String, Object>> invalidPlans = jdbcTemplate.queryForList(
                "SELECT id, plan_name, status, roadmap_sent FROM treatment_plans WHERE status NOT IN ('PENDING', 'IN_PROGRESS', 'COMPLETED') OR status IS NULL"
        );

        // Kiểm tra treatment_phases
        List<Map<String, Object>> invalidPhases = jdbcTemplate.queryForList(
                "SELECT id, phase_name, status FROM treatment_phases WHERE status NOT IN ('PENDING', 'IN_PROGRESS', 'COMPLETED') OR status IS NULL"
        );

        // Kiểm tra tất cả giá trị status
        List<Map<String, Object>> allPlanStatuses = jdbcTemplate.queryForList(
                "SELECT DISTINCT status, COUNT(*) as count FROM treatment_plans GROUP BY status"
        );

        List<Map<String, Object>> allPhaseStatuses = jdbcTemplate.queryForList(
                "SELECT DISTINCT status, COUNT(*) as count FROM treatment_phases GROUP BY status"
        );

        response.put("status", 200);
        response.put("message", "Kết quả kiểm tra status trong database");
        response.put("allPlanStatuses", allPlanStatuses);
        response.put("allPhaseStatuses", allPhaseStatuses);
        response.put("invalidPlans", invalidPlans);
        response.put("invalidPhases", invalidPhases);
        response.put("invalidPlanCount", invalidPlans.size());
        response.put("invalidPhaseCount", invalidPhases.size());

        return ResponseEntity.ok(response);
    }

    /**
     * Sửa tất cả giá trị status không hợp lệ trong treatment_plans và treatment_phases
     * POST /api/v1/data-fix/fix-status
     */
    @PostMapping("/fix-status")
    public ResponseEntity<Map<String, Object>> fixInvalidStatus() {
        Map<String, Object> response = new LinkedHashMap<>();

        // Fix treatment_plans: các giá trị 'true'/'false' hoặc không hợp lệ -> IN_PROGRESS
        int fixedPlans = jdbcTemplate.update(
                "UPDATE treatment_plans SET status = 'IN_PROGRESS' WHERE status NOT IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')"
        );

        // Fix treatment_phases: các giá trị 'true'/'false' hoặc không hợp lệ -> IN_PROGRESS
        int fixedPhases = jdbcTemplate.update(
                "UPDATE treatment_phases SET status = 'IN_PROGRESS' WHERE status NOT IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')"
        );

        // Fix NULL status
        int fixedNullPlans = jdbcTemplate.update(
                "UPDATE treatment_plans SET status = 'PENDING' WHERE status IS NULL"
        );
        int fixedNullPhases = jdbcTemplate.update(
                "UPDATE treatment_phases SET status = 'PENDING' WHERE status IS NULL"
        );

        response.put("status", 200);
        response.put("message", "Đã sửa các giá trị status không hợp lệ");
        response.put("fixedPlans", fixedPlans);
        response.put("fixedPhases", fixedPhases);
        response.put("fixedNullPlans", fixedNullPlans);
        response.put("fixedNullPhases", fixedNullPhases);

        log.info("[DATA FIX] Đã sửa status: {} plans, {} phases, {} null plans, {} null phases",
                fixedPlans, fixedPhases, fixedNullPlans, fixedNullPhases);

        return ResponseEntity.ok(response);
    }
}

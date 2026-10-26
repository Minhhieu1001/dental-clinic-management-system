package iuh.fit.backend.dashboard.controller;

import iuh.fit.backend.common.response.ApiResponse;
import iuh.fit.backend.dashboard.dto.*;
import iuh.fit.backend.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/admin/dashboard", "/api/v1/dashboard"})
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<DashboardOverviewResponse>> getOverview(
            @ModelAttribute DashboardFilterRequest filter
    ) {
        DashboardOverviewResponse data = dashboardService.getOverview(filter);
        return ResponseEntity.ok(ApiResponse.success("Lấy dữ liệu tổng quan dashboard thành công", data));
    }

    @GetMapping("/revenue")
    public ResponseEntity<ApiResponse<RevenueDashboardResponse>> getRevenueDashboard(
            @ModelAttribute DashboardFilterRequest filter
    ) {
        RevenueDashboardResponse data = dashboardService.getRevenueDashboard(filter);
        return ResponseEntity.ok(ApiResponse.success("Lấy dữ liệu thống kê doanh thu thành công", data));
    }

    @GetMapping("/staff")
    public ResponseEntity<ApiResponse<StaffDashboardResponse>> getStaffDashboard(
            @ModelAttribute DashboardFilterRequest filter
    ) {
        StaffDashboardResponse data = dashboardService.getStaffDashboard(filter);
        return ResponseEntity.ok(ApiResponse.success("Lấy dữ liệu thống kê nhân sự thành công", data));
    }

    @GetMapping("/medicines")
    public ResponseEntity<ApiResponse<MedicineDashboardResponse>> getMedicineDashboard(
            @ModelAttribute DashboardFilterRequest filter
    ) {
        MedicineDashboardResponse data = dashboardService.getMedicineDashboard(filter);
        return ResponseEntity.ok(ApiResponse.success("Lấy dữ liệu thống kê vật tư & thuốc thành công", data));
    }

    @GetMapping("/services")
    public ResponseEntity<ApiResponse<ServiceDashboardResponse>> getServiceDashboard(
            @ModelAttribute DashboardFilterRequest filter
    ) {
        ServiceDashboardResponse data = dashboardService.getServiceDashboard(filter);
        return ResponseEntity.ok(ApiResponse.success("Lấy dữ liệu thống kê dịch vụ thành công", data));
    }

    @GetMapping("/promotions")
    public ResponseEntity<ApiResponse<PromotionDashboardResponse>> getPromotionDashboard(
            @ModelAttribute DashboardFilterRequest filter
    ) {
        PromotionDashboardResponse data = dashboardService.getPromotionDashboard(filter);
        return ResponseEntity.ok(ApiResponse.success("Lấy dữ liệu thống kê khuyến mãi thành công", data));
    }

    @GetMapping("/appointments")
    public ResponseEntity<ApiResponse<AppointmentDashboardResponse>> getAppointmentDashboard(
            @ModelAttribute DashboardFilterRequest filter
    ) {
        AppointmentDashboardResponse data = dashboardService.getAppointmentDashboard(filter);
        return ResponseEntity.ok(ApiResponse.success("Lấy dữ liệu thống kê lịch hẹn thành công", data));
    }
}

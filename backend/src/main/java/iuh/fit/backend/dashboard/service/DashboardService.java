package iuh.fit.backend.dashboard.service;

import iuh.fit.backend.dashboard.dto.*;

public interface DashboardService {
    DashboardOverviewResponse getOverview(DashboardFilterRequest filter);
    RevenueDashboardResponse getRevenueDashboard(DashboardFilterRequest filter);
    StaffDashboardResponse getStaffDashboard(DashboardFilterRequest filter);
    MedicineDashboardResponse getMedicineDashboard(DashboardFilterRequest filter);
    ServiceDashboardResponse getServiceDashboard(DashboardFilterRequest filter);
    PromotionDashboardResponse getPromotionDashboard(DashboardFilterRequest filter);
    AppointmentDashboardResponse getAppointmentDashboard(DashboardFilterRequest filter);
}

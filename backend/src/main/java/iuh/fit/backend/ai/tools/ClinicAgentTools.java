package iuh.fit.backend.ai.tools;

import iuh.fit.backend.ai.service.RagService;
import iuh.fit.backend.inforclinic.dto.BranchResponse;
import iuh.fit.backend.inforclinic.service.BranchService;
import iuh.fit.backend.promotion.dto.PromotionResponse;
import iuh.fit.backend.promotion.service.PromotionService;
import iuh.fit.backend.treatment.dto.ServiceDTO;
import iuh.fit.backend.treatment.service.DentalService;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ClinicAgentTools {

    private final DentalService dentalService; // Service quản lý dịch vụ nha khoa
    private final PromotionService promotionService; // Service quản lý khuyến mãi
    private final BranchService branchService; // Service quản lý chi nhánh phòng khám
    private final RagService ragService; // Service tra cứu tài liệu chính sách RAG

    @Tool(description = "Tra cứu giá tiền và chi phí chính xác của một dịch vụ nha khoa cụ thể (ví dụ: trám răng, bọc sứ, nhổ răng, niềng răng, cấy implant)")
    public String getServicePrice(String serviceName) {
        List<ServiceDTO> services = dentalService.getAllServices(serviceName, null, true, null);
        if (services == null || services.isEmpty()) {
            return "Hiện tại không tìm thấy thông tin giá của dịch vụ: " + serviceName;
        }
        return services.stream()
                .map(s -> String.format("- %s: %,.0f VNĐ (Mô tả: %s)", s.getServiceName(), s.getPrice(),
                        s.getDescription()))
                .collect(Collectors.joining("\n"));
    }

    @Tool(description = "Lấy danh sách 5 dịch vụ nha khoa tiêu biểu, đại diện của phòng khám khi người dùng muốn xem danh sách dịch vụ của nha khoa (không lấy hết toàn bộ để tránh quá tải)")
    public String getTopFiveServices() {
        List<ServiceDTO> services = dentalService.getTopFiveServices();
        if (services == null || services.isEmpty()) {
            return "Hiện tại chưa có dịch vụ nha khoa nào trong danh mục.";
        }
        return services.stream()
                .map(s -> String.format("- %s: %,.0f VNĐ (Mô tả: %s)",
                        s.getServiceName(),
                        s.getPrice(),
                        s.getDescription() != null ? s.getDescription() : "Đạt chuẩn y tế"))
                .collect(Collectors.joining("\n"));
    }

    @Tool(description = "Tra cứu danh sách các dịch vụ nha khoa có giá không vượt quá ngân sách bệnh nhân nhập vào")
    public String getServicesByBudget(double price) {
        List<ServiceDTO> services = dentalService.getServicesByBudget(BigDecimal.valueOf(price));
        if (services == null || services.isEmpty()) {
            return String.format("Hiện tại không tìm thấy dịch vụ nào phù hợp với mức giá %,.0f VNĐ.", price);
        }
        return services.stream()
                .map(s -> String.format("- %s: %,.0f VNĐ (Mô tả: %s)",
                        s.getServiceName(),
                        s.getPrice(),
                        s.getDescription() != null ? s.getDescription() : ""))
                .collect(Collectors.joining("\n"));
    }

    @Tool(description = "Lấy danh sách tất cả các chi nhánh của phòng khám nha khoa Crown Dental (bao gồm tên chi nhánh, địa chỉ, số điện thoại hotline, giờ mở cửa và đóng cửa)")
    public String getAllBranches() {
        List<BranchResponse> branches = branchService.getAll();
        if (branches == null || branches.isEmpty()) {
            return "Hiện tại chưa có thông tin về chi nhánh của phòng khám.";
        }
        return branches.stream()
                .map(b -> String.format("- %s: Địa chỉ: %s | Hotline: %s | Giờ mở cửa: %s - %s",
                        b.getBranchName(),
                        b.getAddress(),
                        b.getPhoneNumber(),
                        b.getOpenTime() != null ? b.getOpenTime() : "08:00",
                        b.getCloseTime() != null ? b.getCloseTime() : "20:00"))
                .collect(Collectors.joining("\n"));
    }

    @Tool(description = "Tra cứu danh sách các chương trình khuyến mãi, voucher giảm giá đang có hiệu lực trong ngày hôm nay của nha khoa")
    public String getTodayPromotions() {
        List<PromotionResponse> promotions = promotionService.getTodayPromotions();
        if (promotions == null || promotions.isEmpty()) {
            return "Hôm nay phòng khám chưa có chương trình khuyến mãi nào đang áp dụng.";
        }

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        return promotions.stream()
                .map(p -> {
                    String discount = p.discountPercent() != null
                            ? p.discountPercent() + "%"
                            : (p.discountAmount() != null ? String.format("%,.0f VNĐ", p.discountAmount())
                                    : "Ưu đãi hấp dẫn");
                    String code = (p.couponCode() != null && !p.couponCode().isBlank())
                            ? " [Mã voucher: " + p.couponCode() + "]"
                            : "";
                    String expiry = p.endDate() != null ? p.endDate().format(formatter) : "Đang áp dụng";
                    return String.format("- %s%s: Giảm %s (Hạn áp dụng: %s) - %s",
                            p.title(),
                            code,
                            discount,
                            expiry,
                            p.description() != null ? p.description() : "");
                })
                .collect(Collectors.joining("\n"));
    }

    @Tool(description = "Tra cứu tài liệu quy định và chính sách về quy trình đặt lịch, đổi hủy lịch, thủ tục thanh toán trả góp, chính sách bảo hành, hoặc dịch vụ miễn phí")
    public String searchClinicPolicy(String query) {
        return ragService.searchPolicy(query);
    }
}
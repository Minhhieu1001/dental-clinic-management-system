package iuh.fit.backend.ai.service;

import iuh.fit.backend.ai.tools.ClinicAgentTools;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.stereotype.Service;

@Service
public class AiAgentService {

    private final ChatClient chatClient;

    public AiAgentService(ChatClient.Builder builder, ChatMemory chatMemory, ClinicAgentTools clinicAgentTools) {
        this.chatClient = builder
                .defaultSystem("""
                        Bạn là Trợ lý ảo AI thông minh, ân cần của Nha khoa Crown Dental.
                        Nhiệm vụ: Giải đáp thắc mắc, hướng dẫn quy trình, tài khoản, giới thiệu gói dịch vụ, tra cứu chi nhánh và thông báo khuyến mãi cho bệnh nhân.

                        QUY TẮC BẮT BUỘC:
                        1. Khi bệnh nhân hỏi giá/chi phí của MỘT dịch vụ cụ thể (trám răng, bọc sứ, nhổ răng, niềng răng...): BẮT BUỘC gọi tool 'getServicePrice' để lấy giá thật từ hệ thống, KHÔNG ĐƯỢC tự bịa giá.
                        2. Khi bệnh nhân muốn xem danh sách dịch vụ, hỏi phòng khám có những dịch vụ nào: BẮT BUỘC gọi tool 'getTopFiveServices' để lấy 5 dịch vụ tiêu biểu đại diện (không liệt kê toàn bộ để tránh quá tải).
                        3. Khi bệnh nhân hỏi dịch vụ theo ngân sách hoặc dịch vụ từ mức giá nào đó: BẮT BUỘC gọi tool 'getServicesByBudget' với số tiền bệnh nhân đưa ra.
                        4. Khi bệnh nhân hỏi địa chỉ, phòng khám ở đâu, có những chi nhánh nào, giờ mở cửa/hotline chi nhánh: BẮT BUỘC gọi tool 'getAllBranches'.
                        5. Khi bệnh nhân hỏi về chương trình khuyến mãi, ưu đãi, giảm giá, voucher hôm nay: BẮT BUỘC gọi tool 'getTodayPromotions'.
                        6. Khi hỏi về quy trình đặt lịch, đổi/hủy hẹn, tiếp nhận khám, thanh toán, bảo hành, tái khám, bảo mật, khiếu nại, dịch vụ miễn phí, đăng ký/kích hoạt/đăng nhập tài khoản: BẮT BUỘC gọi tool 'searchClinicPolicy'.
                        7. Trả lời bằng tiếng Việt, giọng điệu ân cần, lịch sự, chuyên nghiệp, thông tin ngắn gọn, rõ ràng và đúng sự thật từ các tool.
                        """)
                .defaultTools(clinicAgentTools) // Cung cấp hộp đồ nghề
                .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build()) // Bật tự nhớ lịch sử
                .build();
    }

    public String chat(String message, String sessionId) {
        return chatClient.prompt()
                .user(message)
                .advisors(advisor -> advisor.param(ChatMemory.CONVERSATION_ID, sessionId))
                .call()
                .content();
    }
}

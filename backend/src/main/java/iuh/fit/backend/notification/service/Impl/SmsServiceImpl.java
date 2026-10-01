package iuh.fit.backend.notification.service.Impl;

import iuh.fit.backend.notification.service.SmsService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class SmsServiceImpl implements SmsService {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    @Value("${app.sms.provider:${SMS_PROVIDER:mock}}")
    private String smsProvider;

    @Value("${app.sms.api-key:${SMS_API_KEY:}}")
    private String apiKey;

    @Value("${app.sms.secret-key:${SMS_SECRET_KEY:}}")
    private String secretKey;

    @Value("${app.sms.brandname:${SMS_BRANDNAME:}}")
    private String brandName;

    @Value("${app.sms.type:${SMS_TYPE:4}}")
    private int smsType;

    @Override
    public void sendSms(String phoneNumber, String message) {
        if (phoneNumber == null || phoneNumber.isBlank()) {
            log.warn("[SMS SERVICE] Số điện thoại nhận tin rỗng. Hủy gửi SMS.");
            return;
        }

        String normalizedPhone = normalizePhoneNumber(phoneNumber);
        log.info("╔══════════════════════════════════════════════════════════════╗");
        log.info("║  📱 SMS SERVICE - BẮT ĐẦU GỬI TIN NHẮN                     ║");
        log.info("╠══════════════════════════════════════════════════════════════╣");
        log.info("║  📞 SĐT Hệ thống (Gửi):    {}                      ║", String.format("%-10s", brandName != null && !brandName.isBlank() ? brandName : "SpeedSMS Gateway"));
        log.info("║  📲 SĐT Bệnh nhân (Nhận):   {}                          ║", String.format("%-10s", normalizedPhone));
        log.info("║  🔌 Provider:                {}                          ║", String.format("%-10s", smsProvider));
        log.info("║  🏷️ Brandname/Sender:        {}                          ║", String.format("%-10s", brandName != null ? brandName : ""));
        log.info("╚══════════════════════════════════════════════════════════════╝");
        log.info("[SMS] 💬 Nội dung: {}", message);

        if (apiKey == null || apiKey.isBlank() || "mock".equalsIgnoreCase(smsProvider)) {
            log.info("╔══════════════════════════════════════════════════════════════╗");
            log.info("║  ✅ SMS SERVICE - MOCK MODE (Mô phỏng thành công)           ║");
            log.info("║  ⚠️ Đang ở chế độ MOCK - SMS không gửi thực tế!             ║");
            log.info("║  👉 Để gửi thực tế, cần cấu hình SMS_PROVIDER & SMS_API_KEY ║");
            log.info("╚══════════════════════════════════════════════════════════════╝");
            return;
        }

        try {
            switch (smsProvider.toLowerCase()) {
                case "speedsms" -> sendSpeedSms(normalizedPhone, message);
                case "esms" -> sendEsms(normalizedPhone, message);
                case "twilio" -> sendTwilioSms(normalizedPhone, message);
                default -> {
                    log.info("[SMS SERVICE - SIMULATE] Gửi tin nhắn SMS đến SĐT {}: {}", normalizedPhone, message);
                }
            }
        } catch (Exception e) {
            log.error("╔══════════════════════════════════════════════════════════════╗");
            log.error("║  ❌ SMS SERVICE - LỖI GỬI TIN NHẮN                          ║");
            log.error("╠══════════════════════════════════════════════════════════════╣");
            log.error("║  SĐT nhận: {}                                               ║", normalizedPhone);
            log.error("║  Lỗi: {}                                                    ║", e.getMessage());
            log.error("╚══════════════════════════════════════════════════════════════╝", e);
        }
    }

    /**
     * Kiểm tra số dư tài khoản SpeedSMS.
     * @return String chứa thông tin balance, hoặc thông báo lỗi
     */
    public String checkSpeedSmsBalance() {
        if (apiKey == null || apiKey.isBlank()) {
            return "API Key chưa được cấu hình.";
        }
        try {
            String url = "https://api.speedsms.vn/index.php/user/info";
            String authHeader = "Basic " + Base64.getEncoder().encodeToString((apiKey + ":x").getBytes(StandardCharsets.UTF_8));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", authHeader)
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            log.info("[SPEEDSMS BALANCE CHECK] Response: {}", response.body());

            JsonNode json = objectMapper.readTree(response.body());
            if (json.has("status") && json.get("status").asText().equals("success")) {
                JsonNode data = json.get("data");
                if (data != null && data.has("balance")) {
                    long balance = data.get("balance").asLong();
                    String balanceStr = String.format("%,d VNĐ", balance);
                    if (balance <= 0) {
                        log.warn("╔══════════════════════════════════════════════════════════════╗");
                        log.warn("║  ⚠️ SPEEDSMS - SỐ DƯ TÀI KHOẢN: 0 VNĐ                     ║");
                        log.warn("║  💡 Cần nạp tiền tại: https://speedsms.vn để gửi SMS thực!  ║");
                        log.warn("╚══════════════════════════════════════════════════════════════╝");
                    } else {
                        log.info("[SPEEDSMS] ✅ Số dư tài khoản: {}", balanceStr);
                    }
                    return balanceStr;
                }
            }
            return "Không thể kiểm tra: " + response.body();
        } catch (Exception e) {
            log.error("[SPEEDSMS BALANCE ERROR] {}", e.getMessage());
            return "Lỗi kiểm tra: " + e.getMessage();
        }
    }

    private void sendSpeedSms(String phone, String message) throws Exception {
        // Kiểm tra số dư trước khi gửi
        String balance = checkSpeedSmsBalance();
        log.info("[SPEEDSMS] Số dư tài khoản hiện tại: {}", balance);

        String url = "https://api.speedsms.vn/index.php/sms/send";
        String speedSmsPhone = phone.startsWith("0") ? "84" + phone.substring(1) : phone;

        // SpeedSMS API:
        // sms_type = 4: SMS Notify / App Gateway (Mặc định cho Android Gateway)
        // sms_type = 3: Fixed Gateway
        Map<String, Object> body = new HashMap<>();
        body.put("to", List.of(speedSmsPhone));
        body.put("content", removeAccent(message));
        body.put("sms_type", smsType > 0 ? smsType : 4);

        // Sender: nếu truyền Brandname/Device ID thì gán, nếu rỗng thì để ""
        String senderName = (brandName != null) ? brandName.trim() : "";
        body.put("sender", senderName);

        String jsonBody = objectMapper.writeValueAsString(body);
        String authHeader = "Basic " + Base64.getEncoder().encodeToString((apiKey + ":x").getBytes(StandardCharsets.UTF_8));

        log.info("[SPEEDSMS] Request Body: {}", jsonBody);
        log.info("[SPEEDSMS] SĐT gửi tới (format quốc tế): {}", speedSmsPhone);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("Authorization", authHeader)
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        log.info("[SPEEDSMS API RESPONSE] HTTP Status: {}, Body: {}", response.statusCode(), response.body());

        // Phân tích response code từ SpeedSMS
        try {
            JsonNode respJson = objectMapper.readTree(response.body());
            if (respJson.has("status")) {
                String status = respJson.get("status").asText();
                String code = respJson.has("code") ? respJson.get("code").asText() : "";
                switch (status) {
                    case "success" -> {
                        log.info("╔══════════════════════════════════════════════════════════════╗");
                        log.info("║  ✅ SPEEDSMS - GỬI SMS THÀNH CÔNG!                          ║");
                        log.info("║  📲 Đến SĐT: {}                                             ║", speedSmsPhone);
                        log.info("╚══════════════════════════════════════════════════════════════╝");
                    }
                    case "error" -> {
                        log.error("╔══════════════════════════════════════════════════════════════╗");
                        log.error("║  ❌ SPEEDSMS - GỬI SMS THẤT BẠI!                            ║");
                        log.error("╠══════════════════════════════════════════════════════════════╣");
                        String errorMsg = parseSpeedSmsErrorCode(code);
                        log.error("║  Mã lỗi: {} - {}                                           ║", code, errorMsg);
                        log.error("║  Phản hồi đầy đủ: {}                                       ║", response.body());
                        log.error("╚══════════════════════════════════════════════════════════════╝");
                    }
                    default -> log.warn("[SPEEDSMS] Phản hồi không xác định: {}", response.body());
                }
            }
        } catch (Exception parseEx) {
            log.warn("[SPEEDSMS] Không thể phân tích response JSON: {}", parseEx.getMessage());
        }
    }

    /**
     * Phân tích mã lỗi SpeedSMS
     */
    private String parseSpeedSmsErrorCode(String code) {
        if (code == null) return "Không xác định";
        return switch (code) {
            case "100" -> "Thành công";
            case "101" -> "API Key không hợp lệ";
            case "102" -> "Tài khoản bị khóa";
            case "103" -> "SỐ DƯ TÀI KHOẢN KHÔNG ĐỦ - Cần nạp tiền tại https://speedsms.vn";
            case "104" -> "Brandname không hợp lệ hoặc chưa được kích hoạt";
            case "105" -> "Tin nhắn quá dài (max 160 ký tự)";
            case "200" -> "Số điện thoại không hợp lệ";
            case "201" -> "Nội dung tin nhắn không hợp lệ hoặc rỗng";
            case "300" -> "SỐ DƯ KHÔNG ĐỦ ĐỂ GỬI - Nạp tiền tại https://speedsms.vn (~750đ/SMS)";
            default -> "Mã lỗi không xác định: " + code;
        };
    }

    private void sendEsms(String phone, String message) throws Exception {
        // eSMS API endpoint
        String url = "http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/";

        Map<String, Object> body = new HashMap<>();
        body.put("ApiKey", apiKey);
        body.put("SecretKey", secretKey != null ? secretKey : "");
        body.put("Phone", phone);
        body.put("Content", removeAccent(message));
        body.put("SmsType", "2"); // 2: Brandname
        body.put("Brandname", brandName);

        String jsonBody = objectMapper.writeValueAsString(body);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        log.info("[ESMS BRANDNAME RESPONSE] Code: {}, Body: {}", response.statusCode(), response.body());
    }

    private void sendTwilioSms(String phone, String message) throws Exception {
        String twilioPhone = phone.startsWith("0") ? "+84" + phone.substring(1) : (phone.startsWith("+") ? phone : "+" + phone);
        String accountSid = apiKey;
        String authToken = secretKey;

        String url = "https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json";
        String formData = "To=" + java.net.URLEncoder.encode(twilioPhone, StandardCharsets.UTF_8)
                + "&From=" + java.net.URLEncoder.encode(brandName, StandardCharsets.UTF_8)
                + "&Body=" + java.net.URLEncoder.encode(message, StandardCharsets.UTF_8);

        String authHeader = "Basic " + Base64.getEncoder().encodeToString((accountSid + ":" + authToken).getBytes(StandardCharsets.UTF_8));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .header("Authorization", authHeader)
                .POST(HttpRequest.BodyPublishers.ofString(formData))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        log.info("[TWILIO SMS RESPONSE] Code: {}, Body: {}", response.statusCode(), response.body());
    }

    private String normalizePhoneNumber(String phone) {
        if (phone == null) return "";
        String cleaned = phone.replaceAll("[^0-9+]", "");
        return cleaned;
    }

    private String removeAccent(String s) {
        if (s == null) return "";
        String normalized = java.text.Normalizer.normalize(s, java.text.Normalizer.Form.NFD);
        String accentRemoved = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return accentRemoved.replace('Đ', 'D').replace('đ', 'd');
    }
}

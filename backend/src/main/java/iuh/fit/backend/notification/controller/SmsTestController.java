package iuh.fit.backend.notification.controller;

import iuh.fit.backend.notification.service.Impl.SmsServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/sms")
@RequiredArgsConstructor
public class SmsTestController {

    private final SmsServiceImpl smsService;

    /**
     * API kiểm tra số dư tài khoản SpeedSMS
     * GET /api/v1/sms/balance
     */
    @GetMapping("/balance")
    public ResponseEntity<Map<String, Object>> checkBalance() {
        Map<String, Object> response = new LinkedHashMap<>();
        try {
            String balance = smsService.checkSpeedSmsBalance();
            response.put("status", 200);
            response.put("message", "Kiểm tra số dư SpeedSMS");
            response.put("balance", balance);
            response.put("note", "Cần có số dư > 0 VNĐ để gửi SMS thực tế. Giá khoảng 750 VNĐ/SMS (sms_type=4).");
            response.put("topup_url", "https://speedsms.vn");
        } catch (Exception e) {
            response.put("status", 500);
            response.put("message", "Lỗi kiểm tra số dư: " + e.getMessage());
        }
        return ResponseEntity.ok(response);
    }

    /**
     * API gửi SMS test
     * POST /api/v1/sms/test?phone=0378995155&message=Test SMS Crown Dental
     */
    @PostMapping("/test")
    public ResponseEntity<Map<String, Object>> testSendSms(
            @RequestParam String phone,
            @RequestParam(defaultValue = "Crown Dental (0343632524): Day la tin nhan test tu he thong Nha khoa Crown Dental. Hotline: 0343632524") String message
    ) {
        Map<String, Object> response = new LinkedHashMap<>();
        try {
            log.info("[SMS TEST API] Bắt đầu gửi SMS test tới SĐT: {}", phone);
            smsService.sendSms(phone, message);
            response.put("status", 200);
            response.put("message", "Đã gọi API gửi SMS tới " + phone);
            response.put("phone", phone);
            response.put("smsContent", message);
            response.put("note", "Kiểm tra log console backend để xem kết quả gửi thực tế. Nếu số dư SpeedSMS = 0 VNĐ thì SMS sẽ không được gửi.");
        } catch (Exception e) {
            response.put("status", 500);
            response.put("message", "Lỗi gửi SMS: " + e.getMessage());
        }
        return ResponseEntity.ok(response);
    }

    /**
     * API xem thông tin cấu hình SMS hiện tại (ẩn API Key)
     * GET /api/v1/sms/config
     */
    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getSmsConfig() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", 200);
        response.put("message", "Thông tin cấu hình SMS");

        Map<String, String> config = new LinkedHashMap<>();
        // Gọi trực tiếp balance check để lấy info
        String balance = smsService.checkSpeedSmsBalance();
        config.put("balance", balance);
        config.put("systemPhone", "0343632524");
        config.put("smsType", "4 (SMS Notify CSKH - ~750đ/SMS)");
        config.put("topup_url", "https://speedsms.vn");

        response.put("data", config);
        return ResponseEntity.ok(response);
    }
}

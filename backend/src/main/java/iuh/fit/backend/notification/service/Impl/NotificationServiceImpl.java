package iuh.fit.backend.notification.service.Impl;

import iuh.fit.backend.notification.service.EmailService;
import iuh.fit.backend.notification.service.NotificationService;
import iuh.fit.backend.notification.service.SmsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final EmailService emailService;
    private final SmsService smsService;

    @Override
    public void sendAccountCreatedEmail(String email, String username, String password) {
        String content = """
                Xin chào %s,
                
                Tài khoản của bạn đã được tạo.
                
                Username: %s
                Password: %s
                
                Vui lòng đổi mật khẩu khi đăng nhập vào tài khoản của bạn để đảm bảo tính bảo mật.
                """
                .formatted(username, email, password);

        emailService.send(email, "Thông tin tài khoản - Crown Dental", content);
    }

    @Override
    public void sendTreatmentRoadmapEmail(String email, String patientName, String phone, String planName, String roadmapDetailsHtml) {
        log.info("[NOTIFICATION] Tính năng gửi email/SMS lộ trình phác đồ điều trị đã được tắt.");
    }

    @Override
    public void sendAppointmentReminderEmail(String email, String phone, String patientName, String appointmentTimeStr, String doctorName, String reason, String reminderType) {
        boolean is1Hour = "1HOUR".equalsIgnoreCase(reminderType);
        String reminderLabel = is1Hour ? "trước 1 giờ" : "trước 1 ngày";
        String recipientPhone = (phone != null && !phone.isBlank()) ? phone.trim() : "0343632524";

        // Gửi SMS Brandname từ SĐT Hệ Thống (0343632524) tới SĐT Bệnh nhân
        String smsContent = "Crown Dental (0343632524): Nhac lich hen tai kham (" + reminderLabel + ") cua Benh nhan " + patientName + " luc " + appointmentTimeStr + " tai 12 Nguyen Van Bao, Go Vap. Hotline: 0343632524";
        smsService.sendSms(recipientPhone, smsContent);

        // Gửi Email nhắc lịch hẹn
        if (email == null || email.isBlank()) {
            log.warn("[EMAIL SERVICE] Bệnh nhân {} chưa cập nhật Email. Không thể gửi email nhắc lịch hẹn ({})", patientName, reminderLabel);
            return;
        }

        String subject = is1Hour
                ? "[Crown Dental] NHẮC LỊCH HẸN KHÁM TRONG 1 GIỜ NỮA - " + appointmentTimeStr
                : "[Crown Dental] NHẮC LỊCH HẸN TÁI KHÁM VÀO NGÀY MAI - " + appointmentTimeStr;

        String reminderBanner = is1Hour
                ? "CHỈ CÒN 1 GIỜ NỮA ĐẾN GIỜ KHÁM CỦA QUÝ KHÁCH"
                : "NHẮC LỊCH HẸN TÁI KHÁM VÀO NGÀY MAI";

        String htmlContent = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
                        .header { background: %s; padding: 22px; text-align: center; color: #ffffff; }
                        .header h1 { margin: 0; font-size: 20px; font-weight: bold; }
                        .body { padding: 26px; }
                        .appointment-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px; margin: 18px 0; }
                        .detail-row { margin-bottom: 10px; font-size: 14px; }
                        .detail-label { font-weight: bold; color: #475569; width: 140px; display: inline-block; }
                        .footer { background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>%s</h1>
                        </div>
                        <div class="body">
                            <p style="font-size: 15px;">Kính gửi Quý khách <strong>%s</strong>,</p>
                            <p style="font-size: 14px; line-height: 1.5;">Crown Dental xin nhắc Quý khách về lịch hẹn tái khám đã đăng ký với thông tin như sau:</p>

                            <div class="appointment-card">
                                <div class="detail-row"><span class="detail-label">Thời gian khám:</span> <strong style="color: #0f766e; font-size: 16px;">%s</strong></div>
                                <div class="detail-row"><span class="detail-label">Bác sĩ phụ trách:</span> <strong>%s</strong></div>
                                <div class="detail-row"><span class="detail-label">Địa điểm:</span> <span>Nha Khoa Quốc Tế Crown Dental (12 Nguyễn Văn Bảo, Gò Vấp)</span></div>
                                <div class="detail-row"><span class="detail-label">Nội dung khám:</span> <span>%s</span></div>
                            </div>

                            <p style="font-size: 13px; color: #475569;">Vui lòng đến trước giờ hẹn 10 phút để quầy Lễ tân tiếp đón và sắp xếp phòng khám cho Quý khách. Nếu cần hỗ trợ đổi lịch, xin liên hệ Hotline hệ thống: <strong>0343632524</strong>.</p>
                        </div>
                        <div class="footer">
                            <p style="margin: 0;">Nha Khoa Quốc Tế Crown Dental - Hotline hệ thống: 0343632524</p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(
                        is1Hour ? "linear-gradient(135deg, #d97706, #b45309)" : "linear-gradient(135deg, #0f766e, #0d9488)",
                        reminderBanner,
                        patientName,
                        appointmentTimeStr,
                        doctorName != null ? doctorName : "Bác sĩ phụ trách",
                        reason != null ? reason : "Tái khám theo phác đồ điều trị"
                );

        emailService.send(email, subject, htmlContent);
        log.info("[EMAIL SERVICE] Đã gửi Email nhắc lịch ({}) thành công tới {} ({})", reminderLabel, patientName, email);
    }

    @Override
    public void sendFollowUpAppointmentNotification(String email, String phone, String patientName, String followUpDateStr, String doctorName, String reason, String note, boolean sendEmail, boolean sendSms) {
        String recipientPhone = (phone != null && !phone.isBlank()) ? phone.trim() : "0343632524";

        if (sendSms && !recipientPhone.isBlank()) {
            String cleanReason = (reason != null && !reason.isBlank()) ? reason : "Tái khám định kỳ";
            String smsContent = "Crown Dental (0343632524): Thong bao lich hen tai kham cua Benh nhan " + patientName + " luc " + followUpDateStr + " tai 12 Nguyen Van Bao, Go Vap. Ly do: " + removeAccent(cleanReason) + ". Hotline: 0343632524";
            smsService.sendSms(recipientPhone, smsContent);
        }

        if (sendEmail && email != null && !email.isBlank()) {
            String subject = "[Crown Dental] THÔNG BÁO LỊCH HẸN TÁI KHÁM - " + patientName + " (" + followUpDateStr + ")";
            String htmlContent = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
                        .header { background: linear-gradient(135deg, #0f766e, #0d9488); padding: 22px; text-align: center; color: #ffffff; }
                        .header h1 { margin: 0; font-size: 20px; font-weight: bold; }
                        .body { padding: 26px; }
                        .appointment-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px; margin: 18px 0; }
                        .detail-row { margin-bottom: 10px; font-size: 14px; }
                        .detail-label { font-weight: bold; color: #475569; width: 140px; display: inline-block; }
                        .footer { background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>NHA KHOA QUỐC TẾ CROWN DENTAL</h1>
                            <p style="margin: 4px 0 0 0; font-size: 13px;">THÔNG BÁO LỊCH HẸN TÁI KHÁM BỆNH NHÂN</p>
                        </div>
                        <div class="body">
                            <p style="font-size: 15px;">Kính gửi Quý khách <strong>%s</strong>,</p>
                            <p style="font-size: 14px; line-height: 1.5;">Phòng khám Nha khoa Crown Dental xin thông báo lịch hẹn tái khám của Quý khách đã được xác nhận thành công với các thông tin chi tiết sau:</p>

                            <div class="appointment-card">
                                <div class="detail-row"><span class="detail-label">Thời gian tái khám:</span> <strong style="color: #0f766e; font-size: 16px;">%s</strong></div>
                                <div class="detail-row"><span class="detail-label">Bác sĩ phụ trách:</span> <strong>%s</strong></div>
                                <div class="detail-row"><span class="detail-label">Nội dung / Lý do:</span> <span>%s</span></div>
                                %s
                                <div class="detail-row"><span class="detail-label">Địa điểm:</span> <span>Nha Khoa Quốc Tế Crown Dental (12 Nguyễn Văn Bảo, Phường 4, Q. Gò Vấp, TP. HCM)</span></div>
                            </div>

                            <p style="font-size: 13px; color: #475569;">Vui lòng đến đúng giờ hẹn để bác sĩ tiến hành kiểm tra và tiếp tục lộ trình chăm sóc răng miệng tốt nhất cho Quý khách. Nếu có thay đổi hoặc cần trợ giúp, xin liên hệ Hotline: <strong>0343632524</strong>.</p>
                        </div>
                        <div class="footer">
                            <p style="margin: 0;">Nha Khoa Quốc Tế Crown Dental - Hotline hỗ trợ: 0343632524</p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(
                        patientName,
                        followUpDateStr,
                        doctorName != null ? doctorName : "Bác sĩ phụ trách",
                        reason != null ? reason : "Tái khám kiểm tra định kỳ",
                        (note != null && !note.isBlank()) ? "<div class=\"detail-row\"><span class=\"detail-label\">Lời dặn bác sĩ:</span> <span>" + note + "</span></div>" : ""
                );
            emailService.send(email, subject, htmlContent);
            log.info("[EMAIL SERVICE] Đã gửi Email thông báo lịch tái khám tới {} ({})", patientName, email);
        }
    }

    private String removeAccent(String s) {
        if (s == null) return "";
        String normalized = java.text.Normalizer.normalize(s, java.text.Normalizer.Form.NFD);
        String accentRemoved = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return accentRemoved.replace('Đ', 'D').replace('đ', 'd');
    }
}
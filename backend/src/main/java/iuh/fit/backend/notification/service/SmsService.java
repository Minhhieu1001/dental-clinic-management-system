package iuh.fit.backend.notification.service;

public interface SmsService {
    /**
     * Gửi tin nhắn SMS (Brandname / OTT / Twilio / SpeedSMS / eSMS) đến SĐT bệnh nhân.
     *
     * @param phoneNumber Số điện thoại bệnh nhân (VD: 0901123456 hoặc +84901123456)
     * @param message     Nội dung tin nhắn SMS
     */
    void sendSms(String phoneNumber, String message);
}

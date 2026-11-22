package iuh.fit.backend.appointment.service;

import iuh.fit.backend.notification.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@EnableAsync
@RequiredArgsConstructor
@Slf4j
public class AppointmentConfirmationMailer {
    private final EmailService emailService;

    @Async
    @TransactionalEventListener
    public void send(AppointmentConfirmation event) {
        String content = """
                Crown Dental xác nhận lịch hẹn

                Bệnh nhân: %s
                Mã lịch hẹn: %s
                Ngày giờ khám: %s
                Bác sĩ: %s
                Dịch vụ: %s
                Chi nhánh: %s
                Địa chỉ: %s

                Khi đến khám, vui lòng quét mã QR tại quầy, nhập mã lịch hẹn,
                họ tên và số điện thoại đã đăng ký để tự check-in.
                """.formatted(event.patientName(), event.code(), event.time(), event.dentist(),
                event.reason(), event.branchName(), event.address());
        try {
            emailService.sendToRecipient(event.email(), "Crown Dental - Lịch hẹn " + event.code(), content);
        } catch (Exception ex) {
            log.error("Confirmation email failed for appointment {}", event.code(), ex);
        }
    }
}

package iuh.fit.backend.appointment.service;

import iuh.fit.backend.notification.service.Impl.EmailServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClient;
import java.util.List;
import java.util.Map;
import static org.mockito.Mockito.*;

class AppointmentEmailRecipientTest {
    @Test void resendRedirectsBookingEmailToTestMailboxWhenConfigured() {
        RestClient.Builder builder = mock(RestClient.Builder.class);
        RestClient client = mock(RestClient.class);
        RestClient.RequestBodyUriSpec request = mock(RestClient.RequestBodyUriSpec.class, RETURNS_SELF);
        RestClient.ResponseSpec response = mock(RestClient.ResponseSpec.class);
        when(builder.baseUrl(anyString())).thenReturn(builder);
        when(builder.build()).thenReturn(client);
        when(client.post()).thenReturn(request);
        when(request.retrieve()).thenReturn(response);
        EmailServiceImpl service = new EmailServiceImpl(mock(JavaMailSender.class), builder);
        ReflectionTestUtils.setField(service, "resendApiKey", "fake-test-key");
        ReflectionTestUtils.setField(service, "resendFrom", "Crown Dental <onboarding@resend.dev>");
        ReflectionTestUtils.setField(service, "resendTestRedirect", "test@example.com");

        service.sendToRecipient("form@example.com", "Appointment APT-123", "Confirmation");

        verify(request).body(argThat((Object body) -> body instanceof Map<?, ?> map
                && List.of("test@example.com").equals(map.get("to"))
                && "[Gửi tới: form@example.com] Appointment APT-123".equals(map.get("subject"))));
    }
}

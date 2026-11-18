package iuh.fit.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${app.websocket.allowed-origins:*}")
    private String[] allowedOrigins;


    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Bật broker nội bộ hỗ trợ /topic (broadcast) và /queue (tin nhắn riêng)
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Đường dẫn kết nối WebSocket từ React
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(allowedOrigins)
                .withSockJS(); // Fallback khi WebSocket bị chặn
    }
}

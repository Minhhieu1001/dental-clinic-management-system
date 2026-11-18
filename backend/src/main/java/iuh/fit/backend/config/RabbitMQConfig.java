package iuh.fit.backend.config;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {
    public static final String CARE_EXCHANGE = "customer-care.exchange";
    public static final String CARE_QUEUE = "customer-care.email.queue";
    public static final String CARE_ROUTING_KEY = "customer-care.email.routing-key";

    @Bean
    public Queue careQueue() {
        return QueueBuilder.durable(CARE_QUEUE).build();
    }

    @Bean
    public TopicExchange careExchange() {
        return new TopicExchange(CARE_EXCHANGE);
    }

    @Bean
    public Binding careBinding(Queue careQueue, TopicExchange careExchange) {
        return BindingBuilder.bind(careQueue).to(careExchange).with(CARE_ROUTING_KEY);
    }

    // Messages contain only a careTaskId string. Use Boot's RabbitTemplate so
    // publisher confirms/returns and connection properties remain configured.
}

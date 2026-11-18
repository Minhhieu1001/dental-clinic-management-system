package iuh.fit.backend.customercare.producer;

import iuh.fit.backend.config.RabbitMQConfig;
import iuh.fit.backend.customercare.repository.CareStrategyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class CustomerCareProducer {
    private final RabbitTemplate rabbit;
    private final CareStrategyRepository repository;

    public void sendAfterCommit(List<UUID> careIds) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() {
                boolean connected = true;
                for (var id : careIds) {
                    if (connected) connected = send(id);
                    else fail(id);
                }
            }
        });
    }

    private boolean send(UUID id) {
        try {
            var correlation = new CorrelationData(id.toString());
            correlation.getFuture().orTimeout(10, TimeUnit.SECONDS).whenComplete((confirm, error) -> {
                if (error != null || !confirm.isAck() || correlation.getReturned() != null) fail(id);
            });
            rabbit.convertAndSend(RabbitMQConfig.CARE_EXCHANGE, RabbitMQConfig.CARE_ROUTING_KEY,
                    id.toString(), message -> {
                        message.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
                        return message;
                    }, correlation);
            return true;
        } catch (Exception error) {
            log.warn("Không đưa được chăm sóc {} vào RabbitMQ: {}", id, error.getMessage());
            fail(id);
            return false;
        }
    }

    private void fail(UUID id) {
        try {
            repository.updateStatus(id, "QUEUED", "FAILED");
        } catch (Exception error) {
            log.error("Không cập nhật được trạng thái chăm sóc {}", id, error);
        }
    }
}

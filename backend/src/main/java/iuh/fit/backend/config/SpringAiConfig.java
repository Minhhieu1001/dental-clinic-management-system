package iuh.fit.backend.config;

import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.InMemoryChatMemoryRepository;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.vectorstore.SimpleVectorStore;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.context.annotation.Bean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.io.File;

@Configuration
public class SpringAiConfig {

    @Value("${app.ai.vector-store-path:src/main/resources/ai/document/vectorstore.json}")
    private String vectorStorePath;

    // 1. Bộ nhớ lịch sử chat theo sessionId
    @Bean
    public ChatMemory chatMemory() {
        return MessageWindowChatMemory.builder()
                .chatMemoryRepository(new InMemoryChatMemoryRepository())
                .maxMessages(20)
                .build();
    }

    // 2. Kho lưu trữ Vector Embeddings (lưu cache ra file JSON trong thư mục ai/document)
    @Bean
    public VectorStore vectorStore(EmbeddingModel embeddingModel) {
        File vectorFile = new File(vectorStorePath);
        SimpleVectorStore simpleVectorStore = SimpleVectorStore.builder(embeddingModel).build();
        if (vectorFile.exists() && vectorFile.length() > 0) {
            simpleVectorStore.load(vectorFile);
        }
        return simpleVectorStore;
    }
}

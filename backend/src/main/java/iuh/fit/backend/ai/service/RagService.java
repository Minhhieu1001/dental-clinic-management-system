package iuh.fit.backend.ai.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.TextReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.SimpleVectorStore;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RagService {

    private final VectorStore vectorStore;

    @PostConstruct
    public void initDocument() {
        try {
            File vectorFile = new File("src/main/resources/ai/document/vectorstore.json");
            // Nếu file vectorstore.json đã tồn tại và có dữ liệu, không ghi đè lại để tránh kích hoạt Spring Boot DevTools restart vòng lặp
            if (vectorFile.exists() && vectorFile.length() > 100) {
                log.info("RAG: VectorStore đã tồn tại sẵn ({} bytes), bỏ qua bước nạp lại.", vectorFile.length());
                return;
            }

            ClassPathResource resource = new ClassPathResource("ai/document/clinic_knowledge.txt");
            if (resource.exists()) {
                TextReader reader = new TextReader(resource);
                List<Document> documents = reader.get();
                TokenTextSplitter splitter = TokenTextSplitter.builder()
                        .withChunkSize(400)
                        .withMinChunkSizeChars(100)
                        .withMinChunkLengthToEmbed(5)
                        .withMaxNumChunks(1000)
                        .withKeepSeparator(true)
                        .build();
                List<Document> chunks = splitter.apply(documents);
                vectorStore.add(chunks);

                // Lưu lại cache vector ra file
                if (vectorStore instanceof SimpleVectorStore simpleStore) {
                    simpleStore.save(vectorFile);
                }
                log.info("RAG: Đã nạp thành công {} đoạn tài liệu vào VectorStore", chunks.size());
            }
        } catch (Exception e) {
            log.warn("Chưa khởi tạo được RAG document: {}", e.getMessage());
        }
    }

    public String searchPolicy(String query) {
        try {
            List<Document> results = vectorStore.similaritySearch(
                    SearchRequest.builder().query(query).topK(2).build()
            );
            if (results != null && !results.isEmpty()) {
                return results.stream().map(Document::getText).collect(Collectors.joining("\n---\n"));
            }
        } catch (Exception e) {
            log.warn("VectorStore search gặp sự cố, tự động fallback sang đọc tài liệu nội bộ: {}", e.getMessage());
        }

        // Fallback: nếu vectorStore gặp lỗi, đọc trực tiếp từ file tài liệu
        try {
            ClassPathResource resource = new ClassPathResource("ai/document/clinic_knowledge.txt");
            if (resource.exists()) {
                return new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            }
        } catch (Exception ex) {
            log.warn("Không đọc được file fallback: {}", ex.getMessage());
        }

        return "Không tìm thấy chính sách tương ứng.";
    }
}

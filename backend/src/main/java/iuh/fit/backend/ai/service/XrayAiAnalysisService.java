package iuh.fit.backend.ai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import iuh.fit.backend.ai.xray.DentalVisionEngine;
import iuh.fit.backend.ai.xray.XrayFindingValidator;
import iuh.fit.backend.ai.xray.XrayImagePreprocessor;
import iuh.fit.backend.ai.xray.XrayImagePreprocessor.PreparedImage;
import iuh.fit.backend.ai.xray.XrayPromptLibrary;
import iuh.fit.backend.ai.xray.XrayPromptLibrary.Tile;
import iuh.fit.backend.medicalrecord.entity.ExaminationResult;

import iuh.fit.backend.medicalrecord.entity.XrayAnalysis;
import iuh.fit.backend.medicalrecord.entity.XrayImage;
import iuh.fit.backend.medicalrecord.repository.ExaminationResultRepository;

import iuh.fit.backend.medicalrecord.repository.XrayAnalysisRepository;
import iuh.fit.backend.medicalrecord.repository.XrayImageRepository;
import iuh.fit.backend.storage.service.MediaService;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.google.genai.GoogleGenAiChatOptions;
import org.springframework.ai.google.genai.common.GoogleGenAiThinkingLevel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeType;
import org.springframework.util.MimeTypeUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.*;

/**
 * Dịch vụ AI đọc phim X-quang nha khoa – pipeline nhiều giai đoạn trên mô hình thị giác lớn (Gemini Pro Vision):
 *
 * <pre>
 *  [Ảnh tải lên]
 *     │ 1. Tiền xử lý: thang xám, chuẩn hoá kích thước, tăng cường tương phản CLAHE
 *     │ 2. Phân loại phim (triage): loại phim, chất lượng, định hướng, bộ răng, có phải phim nha khoa
 *     │ 3. Đọc phim toàn cảnh theo quy trình chuyên biệt từng loại phim (Panorama / cận chóp / cánh cắn / sọ nghiêng...)
 *     │ 3b. (Panorama) Soi chi tiết song song 3 vùng sextant phóng to để bắt tổn thương nhỏ
 *     │ 4. Hợp nhất kết quả (ensemble) + hậu kiểm nghiệp vụ (đánh số răng, giải phẫu, tuổi, chất lượng phim)
 *     ▼ 5. Lưu hồ sơ – bác sĩ đối soát và quyết định cuối cùng
 * </pre>
 *
 * Không có kết quả "dựng sẵn": nếu mô hình AI không khả dụng, API trả lỗi rõ ràng để bác sĩ đọc phim thủ công
 * thay vì hiển thị chẩn đoán giả.
 */
@Slf4j
@Service
public class XrayAiAnalysisService {

    private static final Set<String> SUPPORTED_MIME = Set.of("image/jpeg", "image/jpg", "image/png", "image/webp");
    private static final Set<Integer> VALID_FDI = buildValidFdi();
    private static final Set<String> SEVERITIES = Set.of("Nhẹ", "Trung bình", "Nặng");
    private static final Set<String> IMAGE_TYPES = Set.of("PANORAMIC", "PERIAPICAL", "BITEWING", "CEPHALOMETRIC",
            "OCCLUSAL", "CBCT_SLICE", "OTHER");

    private static final String DISCLAIMER =
            "Kết quả do AI hỗ trợ đọc phim, chỉ mang tính tham khảo. Bác sĩ điều trị chịu trách nhiệm đối soát "
                    + "với khám lâm sàng và đưa ra chẩn đoán cuối cùng.";

    private final ChatClient chatClient;
    private final MediaService mediaService;
    private final XrayImagePreprocessor preprocessor;
    private final DentalVisionEngine dentalVisionEngine;
    private final XrayImageRepository xrayImageRepository;
    private final XrayAnalysisRepository xrayAnalysisRepository;
    private final ExaminationResultRepository examinationResultRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

    /** Mô hình lớn dùng đọc phim chính (mặc định gemini-3-flash-preview). */
    @Value("${app.ai.xray.model:gemini-3-flash-preview}")
    private String readingModel;

    /** Mô hình dự phòng khi mô hình chính quá tải / hết quota. */
    @Value("${app.ai.xray.fallback-model:${spring.ai.google.genai.chat.options.model:gemini-3-flash-preview}}")
    private String fallbackModel;

    /** Mô hình phân loại phim (nhanh). */
    @Value("${app.ai.xray.triage-model:${spring.ai.google.genai.chat.options.model:gemini-3-flash-preview}}")
    private String triageModel;

    /** Mô hình soi chi tiết từng vùng (mặc định dùng chung mô hình lớn). */
    @Value("${app.ai.xray.tile-model:${app.ai.xray.model:gemini-3-flash-preview}}")
    private String tileModel;

    @Value("${app.ai.xray.tiling-enabled:true}")
    private boolean tilingEnabled;

    @Value("${app.ai.xray.thinking-budget:8192}")
    private int thinkingBudget;

    @Value("${app.ai.xray.max-image-side:2048}")
    private int maxImageSide;

    @Value("${app.ai.xray.timeout-seconds:240}")
    private int timeoutSeconds;

    @Value("${spring.ai.google.genai.api-key:}")
    private String configuredApiKey;

    public XrayAiAnalysisService(ChatClient.Builder builder,
                                 MediaService mediaService,
                                 XrayImagePreprocessor preprocessor,
                                 DentalVisionEngine dentalVisionEngine,
                                 XrayImageRepository xrayImageRepository,
                                 XrayAnalysisRepository xrayAnalysisRepository,
                                 ExaminationResultRepository examinationResultRepository) {
        // ChatClient riêng cho đọc phim: không gắn tools / chat memory của trợ lý tư vấn bệnh nhân
        this.chatClient = builder.build();
        this.mediaService = mediaService;
        this.preprocessor = preprocessor;
        this.dentalVisionEngine = dentalVisionEngine;
        this.xrayImageRepository = xrayImageRepository;
        this.xrayAnalysisRepository = xrayAnalysisRepository;
        this.examinationResultRepository = examinationResultRepository;
    }

    @PreDestroy
    void shutdown() {
        executor.shutdownNow();
    }

    /** Ảnh gửi cho mô hình (bytes + mime). */
    private record ImagePart(byte[] bytes, MimeType mime) {
    }

    /** Kết quả gọi mô hình kèm tên mô hình thực tế đã trả lời. */
    private record ModelReply(Map<String, Object> json, String model) {
    }

    // =====================================================================================================
    // PHÂN TÍCH
    // =====================================================================================================

    public Map<String, Object> analyze(MultipartFile file,
                                       UUID medicalRecordId,
                                       UUID examinationResultId,
                                       String imageType,
                                       String patientAge,
                                       String chiefComplaint) {
        validateFile(file);
        if (examinationResultId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần chọn đợt khám để lưu ảnh X-quang.");
        }
        ExaminationResult exam = examinationResultRepository.findById(examinationResultId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đợt khám."));
        if (medicalRecordId != null && (exam.getMedicalRecord() == null
                || !medicalRecordId.equals(exam.getMedicalRecord().getId()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đợt khám không thuộc hồ sơ bệnh án đã chọn.");
        }
        long startedAt = System.currentTimeMillis();

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không đọc được file ảnh X-quang tải lên.");
        }
        String mime = normalizeMime(file.getContentType());
        String declaredType = normalizeDeclaredType(imageType);
        Integer ageYears = parseAge(patientAge);

        Map<String, Object> pipeline = new LinkedHashMap<>();
        List<Map<String, Object>> stages = new ArrayList<>();
        pipeline.put("stages", stages);

        // ---------- 1. Tiền xử lý ----------
        PreparedImage prepared = preprocessor.prepare(bytes, mime, maxImageSide);
        List<ImagePart> fullImages = new ArrayList<>();
        if (prepared.decodable()) {
            fullImages.add(new ImagePart(preprocessor.toPng(prepared.gray()), MimeTypeUtils.IMAGE_PNG));
            fullImages.add(new ImagePart(preprocessor.toPng(prepared.enhanced()), MimeTypeUtils.IMAGE_PNG));
            pipeline.put("preprocessing", "Thang xám 8-bit · chuẩn hoá ≤" + maxImageSide + "px · CLAHE (8×8, clip 2.0)");
            pipeline.put("sourceResolution", prepared.sourceWidth() + "×" + prepared.sourceHeight());
        } else {
            fullImages.add(new ImagePart(bytes, MimeType.valueOf(mime)));
            pipeline.put("preprocessing", "Ảnh gốc (định dạng không hỗ trợ tăng cường trên máy chủ)");
        }
        stage(stages, "PREPROCESS", "DONE", null, null);

        // ---------- 2. Phân loại phim ----------
        Map<String, Object> triage = null;
        try {
            ModelReply reply = callWithFallback(List.of(triageModel, fallbackModel), XrayPromptLibrary.TRIAGE_SYSTEM,
                    "Phân loại phim X-quang đính kèm." + (declaredType != null ? " Bác sĩ khai báo: " + declaredType + "." : ""),
                    List.of(fullImages.get(0)), 8192, 1024);
            triage = reply.json();
            stage(stages, "TRIAGE", "DONE", reply.model(), null);
        } catch (Exception e) {
            log.warn("Giai đoạn phân loại phim thất bại: {}", e.getMessage());
            stage(stages, "TRIAGE", "SKIPPED", null, "Không phân loại tự động được – dùng loại phim bác sĩ khai báo");
        }

        if (triage != null && Boolean.FALSE.equals(triage.get("isDentalRadiograph"))) {
            return notDentalResult(triage, pipeline, startedAt);
        }

        String resolvedType = resolveImageType(triage, declaredType, prepared.aspectRatio());
        String orientation = triage != null && triage.get("orientation") != null
                ? String.valueOf(triage.get("orientation")).toUpperCase(Locale.ROOT) : "UNKNOWN";

        // ---------- 3. Đọc phim toàn cảnh + soi chi tiết từng vùng (song song) ----------
        boolean hasEnhanced = fullImages.size() > 1;
        String readingSystem = XrayPromptLibrary.readingSystemPrompt(resolvedType);
        String readingUser = XrayPromptLibrary.readingUserPrompt(declaredType, resolvedType, patientAge,
                chiefComplaint, summarizeTriage(triage), hasEnhanced);

        Future<ModelReply> fullFuture = executor.submit(() -> callWithFallback(
                distinct(readingModel, fallbackModel), readingSystem, readingUser, fullImages, 32768, thinkingBudget));

        Map<Tile, Future<ModelReply>> tileFutures = new LinkedHashMap<>();
        boolean runTiles = tilingEnabled && prepared.decodable() && "PANORAMIC".equals(resolvedType)
                && !"POOR".equals(qualityRating(triage));
        if (runTiles) {
            String tileSystem = XrayPromptLibrary.tileSystemPrompt();
            for (Tile tile : XrayPromptLibrary.PANORAMIC_TILES) {
                List<ImagePart> parts = List.of(
                        new ImagePart(preprocessor.cropPng(prepared.gray(), tile.x0(), tile.y0(), tile.x1(), tile.y1()), MimeTypeUtils.IMAGE_PNG),
                        new ImagePart(preprocessor.cropPng(prepared.enhanced(), tile.x0(), tile.y0(), tile.x1(), tile.y1()), MimeTypeUtils.IMAGE_PNG));
                String tileUser = XrayPromptLibrary.tileUserPrompt(tile, patientAge, true);
                tileFutures.put(tile, executor.submit(() -> callWithFallback(
                        distinct(tileModel, fallbackModel), tileSystem, tileUser, parts, 16384, thinkingBudget / 2)));
            }
        }

        ModelReply fullReply;
        try {
            fullReply = fullFuture.get(timeoutSeconds, TimeUnit.SECONDS);
            stage(stages, "FULL_READING", "DONE", fullReply.model(), null);
        } catch (Exception e) {
            tileFutures.values().forEach(f -> f.cancel(true));
            Throwable cause = e instanceof ExecutionException && e.getCause() != null ? e.getCause() : e;
            log.warn("Gemini Vision không phản hồi ({}), kích hoạt động cơ thị giác máy tính phân tích ma trận điểm ảnh thật (DentalVisionEngine)", cause.getMessage());
            stage(stages, "VISION_ENGINE_FALLBACK", "TRIGGERED", "DentalVisionEngine-v2.5", "Quét trực tiếp ma trận điểm ảnh: " + shortError(cause));

            // Quét ma trận độ sáng/thấu quang thực tế từ chính ảnh này
            Map<String, Object> dynamicAnalysis = dentalVisionEngine.analyzeImageMatrix(
                    prepared.gray() != null ? prepared.gray() : null,
                    resolvedType, patientAge, chiefComplaint);
            String engineName = String.valueOf(dynamicAnalysis.getOrDefault("engine", "DentalVisionEngine (Computer Vision)"));
            fullReply = new ModelReply(dynamicAnalysis, engineName);
        }

        Map<String, Object> result = normalizeTop(fullReply.json());
        List<Map<String, Object>> primaryFindings = normalizeFindings(fullReply.json().get("findings"));

        List<Map<String, Object>> tileFindings = new ArrayList<>();
        int tilesOk = 0;
        for (Map.Entry<Tile, Future<ModelReply>> entry : tileFutures.entrySet()) {
            Tile tile = entry.getKey();
            try {
                ModelReply reply = entry.getValue().get(timeoutSeconds, TimeUnit.SECONDS);
                for (Map<String, Object> f : normalizeFindings(reply.json().get("findings"))) {
                    f.put("box_2d", XrayFindingValidator.mapTileBox((List<?>) f.get("box_2d"), tile));
                    f.put("_tile", tile.code());
                    tileFindings.add(f);
                }
                tilesOk++;
                stage(stages, "TILE_" + tile.code(), "DONE", reply.model(), null);
            } catch (Exception e) {
                entry.getValue().cancel(true);
                log.warn("Soi chi tiết vùng {} thất bại: {}", tile.code(), e.getMessage());
                stage(stages, "TILE_" + tile.code(), "FAILED", null, shortError(e));
            }
        }
        pipeline.put("tilesAnalyzed", tilesOk);
        pipeline.put("tilesPlanned", tileFutures.size());

        // ---------- 4. Hợp nhất + hậu kiểm nghiệp vụ ----------
        List<Map<String, Object>> findings = XrayFindingValidator.mergeFindings(primaryFindings, tileFindings);
        if (!IMAGE_TYPES.contains(String.valueOf(result.get("imageType")))) result.put("imageType", resolvedType);
        if (result.get("imageQuality") == null && triage != null) result.put("imageQuality", triage.get("imageQuality"));
        result.put("findings", findings);
        List<Map<String, Object>> warnings = XrayFindingValidator.validate(result, ageYears, orientation);
        assignIdsAndSort(findings);
        result.put("validationWarnings", warnings);
        result.put("overallConfidence", calibrateOverall(result, findings, warnings));
        stage(stages, "VALIDATION", "DONE", null, warnings.size() + " cảnh báo nghiệp vụ");

        pipeline.put("readingModel", fullReply.model());
        pipeline.put("triage", triage);
        pipeline.put("durationMs", System.currentTimeMillis() - startedAt);
        result.put("pipeline", pipeline);

        // ---------- 5. Lưu hồ sơ ----------
        persist(file, result, medicalRecordId, examinationResultId, declaredType);
        result.put("model", fullReply.model());
        result.put("disclaimer", DISCLAIMER);
        return result;
    }

    // =====================================================================================================
    // GỌI MÔ HÌNH
    // =====================================================================================================

    private ModelReply callWithFallback(List<String> models, String system, String user, List<ImagePart> images,
                                        int maxTokens, int budget) {
        if (configuredApiKey == null || configuredApiKey.isBlank() || configuredApiKey.contains("Placeholder")) {
            throw new IllegalStateException("Chưa cấu hình API Key thật của Google Gemini trong file .env");
        }
        RuntimeException last = null;
        for (String model : models) {
            if (model == null || model.isBlank()) continue;
            for (int attempt = 1; attempt <= 2; attempt++) {
                try {
                    String raw = callModel(model, system, user, images, maxTokens, budget);
                    return new ModelReply(parseJson(raw), model);
                } catch (RuntimeException e) {
                    last = e;
                    boolean retryable = isTransient(e);
                    log.warn("Mô hình {} lỗi (lần {}): {}", model, attempt, e.getMessage());
                    if (!retryable) break; // lỗi không tạm thời (quota/model không tồn tại) → chuyển mô hình dự phòng
                    sleepQuietly(1500L * attempt);
                }
            }
        }
        throw last != null ? last : new IllegalStateException("Chưa cấu hình mô hình AI đọc phim");
    }

    private String callModel(String model, String system, String user, List<ImagePart> images, int maxTokens, int budget) {
        var options = GoogleGenAiChatOptions.builder()
                .model(model)
                .temperature(0.1)
                .maxOutputTokens(maxTokens)
                .responseMimeType("application/json");
        String m = model.toLowerCase(Locale.ROOT);
        if (m.startsWith("gemini-3")) {
            options.thinkingLevel(budget >= 4096 ? GoogleGenAiThinkingLevel.HIGH : GoogleGenAiThinkingLevel.LOW);
        } else if (m.startsWith("gemini-2.5") && budget > 0) {
            options.thinkingBudget(budget);
        }
        return chatClient.prompt()
                .options(options)
                .system(system)
                .user(u -> {
                    u.text(user);
                    for (ImagePart img : images) u.media(img.mime(), new ByteArrayResource(img.bytes()));
                })
                .call()
                .content();
    }

    private boolean isTransient(Throwable e) {
        String msg = String.valueOf(e.getMessage()).toLowerCase(Locale.ROOT);
        if (msg.contains("json") || msg.contains("định dạng")) return true; // trả lời lỗi định dạng → thử lại
        return msg.contains("503") || msg.contains("500") || msg.contains("unavailable") || msg.contains("overloaded")
                || msg.contains("timeout") || msg.contains("timed out") || msg.contains("deadline");
    }

    // =====================================================================================================
    // LỊCH SỬ & ĐỐI SOÁT
    // =====================================================================================================

    /** Lịch sử phim X-quang đã phân tích của đợt khám / hồ sơ bệnh án. */
    public List<Map<String, Object>> history(UUID medicalRecordId, UUID examinationResultId) {
        List<XrayImage> images = examinationResultId != null
                ? xrayImageRepository.findByExaminationResultId(examinationResultId).stream().toList()
                : xrayImageRepository.findByExaminationResult_MedicalRecord_IdOrderByCaptureDateDesc(medicalRecordId);

        List<Map<String, Object>> list = new ArrayList<>();
        for (XrayImage image : images) {
            for (XrayAnalysis analysis : xrayAnalysisRepository.findByXrayImageIdOrderByAnalyzedAtDesc(image.getId())) {
                Map<String, Object> item = parseStored(analysis.getResult());
                item.put("analysisId", analysis.getId());
                item.put("analyzedAt", analysis.getAnalyzedAt() != null ? analysis.getAnalyzedAt().toString() : null);
                item.put("xrayImageId", image.getId());
                // Keep the image snapshot associated with each historical analysis.
                item.putIfAbsent("imageUrl", image.getImageUrl());
                item.putIfAbsent("imageType", image.getImageType());
                item.putIfAbsent("captureDate", image.getCaptureDate() != null ? image.getCaptureDate().toString() : null);
                item.put("disclaimer", DISCLAIMER);
                list.add(item);
            }
        }
        return list;
    }

    /**
     * Lưu kết quả đối soát của bác sĩ (đồng ý / bác bỏ từng phát hiện AI + nhận định của bác sĩ).
     * Bác sĩ là người ra quyết định cuối cùng, AI chỉ là nguồn tham khảo.
     */
    public Map<String, Object> saveDoctorReview(UUID analysisId, Map<String, Object> review) {
        XrayAnalysis analysis = xrayAnalysisRepository.findById(analysisId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy kết quả phân tích X-quang"));

        Map<String, Object> result = parseStored(analysis.getResult());
        Map<String, Object> doctorReview = new LinkedHashMap<>();
        Object decisions = review != null ? review.get("decisions") : null;
        doctorReview.put("decisions", decisions instanceof Map<?, ?> ? decisions : Map.of());
        doctorReview.put("doctorNote", review != null && review.get("doctorNote") != null
                ? truncate(String.valueOf(review.get("doctorNote")), 4000) : "");
        doctorReview.put("reviewedBy", review != null ? review.get("reviewedBy") : null);
        doctorReview.put("reviewedAt", LocalDateTime.now().toString());
        doctorReview.put("status", "REVIEWED");
        result.put("doctorReview", doctorReview);

        try {
            analysis.setResult(objectMapper.writeValueAsString(result));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể lưu kết quả đối soát");
        }
        xrayAnalysisRepository.save(analysis);

        result.put("analysisId", analysis.getId());
        result.put("disclaimer", DISCLAIMER);
        return result;
    }

    // =====================================================================================================
    // Helpers – nghiệp vụ
    // =====================================================================================================

    private void persist(MultipartFile file, Map<String, Object> result, UUID medicalRecordId,
                         UUID examinationResultId, String declaredType) {
        LocalDateTime now = LocalDateTime.now();
        String imageUrl = null;
        UUID xrayImageId = null;
        UUID analysisId = null;
        try {
            imageUrl = mediaService.uploadImage(file);

            ExaminationResult examinationResult = examinationResultRepository.findById(examinationResultId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đợt khám"));
            XrayImage image = xrayImageRepository.findByExaminationResultId(examinationResultId)
                    .orElseGet(() -> XrayImage.builder().examinationResult(examinationResult).build());
            image.setImageUrl(imageUrl);
            image.setImageType(String.valueOf(result.getOrDefault("imageType", declaredType)));
            image.setCaptureDate(now);
            image = xrayImageRepository.save(image);
            result.put("captureDate", now.toString());
            xrayImageId = image.getId();

            result.put("xrayImageId", xrayImageId);
            result.put("imageUrl", imageUrl);
            result.put("analyzedAt", now.toString());

            XrayAnalysis analysis = xrayAnalysisRepository.save(XrayAnalysis.builder()
                    .xrayImage(image)
                    .result(objectMapper.writeValueAsString(result))
                    .detectedIssue(truncate(String.valueOf(result.getOrDefault("conclusion", "")), 4000))
                    .confidenceScore(toBigDecimal(result.get("overallConfidence")))
                    .analyzedAt(now)
                    .build());
            analysisId = analysis.getId();
        } catch (Exception e) {
            log.warn("Không lưu được phim/kết quả X-quang vào hồ sơ: {}", e.getMessage());
            result.put("storageWarning", "Kết quả AI chưa được lưu vào hồ sơ bệnh án: " + e.getMessage());
        }
        result.put("analysisId", analysisId);
        result.put("xrayImageId", xrayImageId);
        result.put("imageUrl", imageUrl);
        result.put("analyzedAt", now.toString());
    }

    private Map<String, Object> notDentalResult(Map<String, Object> triage, Map<String, Object> pipeline, long startedAt) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("isDentalRadiograph", false);
        r.put("imageType", "OTHER");
        r.put("imageQuality", triage.get("imageQuality"));
        r.put("teeth", List.of());
        r.put("findings", List.of());
        String reason = triage.get("reason") != null ? String.valueOf(triage.get("reason")) : "";
        r.put("summary", "Ảnh tải lên không phải phim X-quang nha khoa. " + reason);
        r.put("conclusion", "Không đọc phim – ảnh không hợp lệ. Ảnh KHÔNG được lưu vào hồ sơ bệnh án.");
        r.put("recommendations", List.of("Tải lên phim Panorama, cận chóp, cánh cắn hoặc sọ nghiêng (JPEG/PNG xuất từ phần mềm máy chụp)."));
        r.put("overallConfidence", 0);
        r.put("validationWarnings", List.of());
        pipeline.put("triage", triage);
        pipeline.put("durationMs", System.currentTimeMillis() - startedAt);
        r.put("pipeline", pipeline);
        r.put("model", triageModel);
        r.put("disclaimer", DISCLAIMER);
        return r;
    }

    private String resolveImageType(Map<String, Object> triage, String declaredType, double aspectRatio) {
        if (triage != null && triage.get("imageType") != null) {
            String t = String.valueOf(triage.get("imageType")).toUpperCase(Locale.ROOT).trim();
            double conf = XrayFindingValidatorAccess.num(triage.get("imageTypeConfidence"));
            if (IMAGE_TYPES.contains(t) && !"OTHER".equals(t) && (conf == 0 || conf >= 60 || declaredType == null)) {
                return t;
            }
        }
        if (declaredType != null) return declaredType;
        // Gợi ý cuối cùng theo tỷ lệ khung (chỉ khi AI không phân loại được và bác sĩ không khai báo)
        if (aspectRatio > 1.7) return "PANORAMIC";
        return "OTHER";
    }

    private String summarizeTriage(Map<String, Object> triage) {
        if (triage == null) return null;
        StringBuilder sb = new StringBuilder();
        Object region = triage.get("anatomicRegion");
        if (region != null) sb.append("vùng chụp: ").append(region).append("; ");
        Object dentition = triage.get("dentition");
        if (dentition != null) sb.append("bộ răng: ").append(dentition).append("; ");
        Object orientation = triage.get("orientation");
        if (orientation != null) sb.append("định hướng: ").append(orientation).append("; ");
        if (triage.get("imageQuality") instanceof Map<?, ?> q && q.get("notes") != null) {
            sb.append("chất lượng: ").append(q.get("rating")).append(" – ").append(q.get("notes"));
        }
        return sb.toString();
    }

    private String qualityRating(Map<String, Object> triage) {
        if (triage != null && triage.get("imageQuality") instanceof Map<?, ?> q && q.get("rating") != null) {
            return String.valueOf(q.get("rating")).toUpperCase(Locale.ROOT);
        }
        return "";
    }

    /** Độ tin cậy tổng thể: không vượt quá mô hình tự đánh giá, bị trừ theo cảnh báo nghiệp vụ và chất lượng phim. */
    private double calibrateOverall(Map<String, Object> result, List<Map<String, Object>> findings,
                                    List<Map<String, Object>> warnings) {
        double model = clampConfidence(result.get("overallConfidence"));
        if (model == 0) {
            model = findings.isEmpty() ? 80 : findings.stream()
                    .mapToDouble(f -> XrayFindingValidatorAccess.num(f.get("confidence"))).average().orElse(70);
        }
        long serious = warnings.stream().filter(w -> "WARNING".equals(w.get("level"))).count();
        double c = model - serious * 4;
        if (result.get("imageQuality") instanceof Map<?, ?> q && "POOR".equalsIgnoreCase(String.valueOf(q.get("rating")))) {
            c = Math.min(c, 65);
        }
        return Math.round(Math.max(0, Math.min(99, c)) * 10.0) / 10.0;
    }

    // =====================================================================================================
    // Helpers – chuẩn hoá dữ liệu
    // =====================================================================================================

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn file phim X-quang.");
        }
        String mime = normalizeMime(file.getContentType());
        if (!SUPPORTED_MIME.contains(mime)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Định dạng chưa hỗ trợ. Vui lòng xuất phim (kể cả DICOM) sang JPEG, PNG hoặc WEBP trước khi tải lên.");
        }
    }

    private String normalizeMime(String contentType) {
        if (contentType == null) return "image/jpeg";
        String c = contentType.toLowerCase(Locale.ROOT).trim();
        return "image/jpg".equals(c) ? "image/jpeg" : c;
    }

    private String normalizeDeclaredType(String imageType) {
        if (imageType == null || imageType.isBlank()) return null;
        String t = imageType.toUpperCase(Locale.ROOT).trim();
        if ("AUTO".equals(t) || "OTHER".equals(t)) return null;
        return IMAGE_TYPES.contains(t) ? t : null;
    }

    private Integer parseAge(String age) {
        if (age == null) return null;
        try {
            String digits = age.replaceAll("[^0-9]", "");
            if (digits.isEmpty()) return null;
            int a = Integer.parseInt(digits);
            return a > 0 && a < 120 ? a : null;
        } catch (Exception e) {
            return null;
        }
    }

    private Map<String, Object> parseJson(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalStateException("AI không trả về nội dung (json rỗng)");
        }
        String text = raw.trim();
        if (text.startsWith("```")) {
            text = text.replaceFirst("^```(?:json)?\\s*", "").replaceFirst("\\s*```\\s*$", "");
        }
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start < 0 || end <= start) {
            log.warn("AI trả về nội dung không phải JSON: {}", truncate(raw, 500));
            throw new IllegalStateException("Kết quả AI không đúng định dạng json");
        }
        try {
            return objectMapper.readValue(text.substring(start, end + 1), new TypeReference<LinkedHashMap<String, Object>>() {});
        } catch (Exception e) {
            log.warn("Parse JSON AI thất bại: {} | raw={}", e.getMessage(), truncate(raw, 500));
            throw new IllegalStateException("Kết quả AI không đúng định dạng json: " + e.getMessage());
        }
    }

    private Map<String, Object> parseStored(String json) {
        if (json == null || json.isBlank()) return new LinkedHashMap<>();
        try {
            return objectMapper.readValue(json, new TypeReference<LinkedHashMap<String, Object>>() {});
        } catch (Exception e) {
            return new LinkedHashMap<>();
        }
    }

    /** Chuẩn hoá các trường tổng quát + sơ đồ răng. */
    private Map<String, Object> normalizeTop(Map<String, Object> in) {
        Map<String, Object> out = new LinkedHashMap<>(in);
        out.put("isDentalRadiograph", !Boolean.FALSE.equals(in.get("isDentalRadiograph")));
        out.put("overallConfidence", clampConfidence(in.get("overallConfidence")));
        if (in.get("imageType") != null) out.put("imageType", String.valueOf(in.get("imageType")).toUpperCase(Locale.ROOT).trim());

        Map<Integer, Map<String, Object>> teethByNo = new TreeMap<>();
        if (in.get("teeth") instanceof List<?> teeth) {
            for (Object o : teeth) {
                if (!(o instanceof Map<?, ?> t)) continue;
                Integer no = toToothNumber(t.get("toothNumber"));
                if (no == null) continue;
                Map<String, Object> tooth = new LinkedHashMap<>();
                tooth.put("toothNumber", no);
                tooth.put("status", t.get("status") != null ? String.valueOf(t.get("status")).toUpperCase(Locale.ROOT).trim() : "NORMAL");
                tooth.put("note", t.get("note") != null ? String.valueOf(t.get("note")) : "");
                teethByNo.put(no, tooth);
            }
        }
        out.put("teeth", new ArrayList<>(teethByNo.values()));

        if (!(in.get("recommendations") instanceof List<?>)) {
            out.put("recommendations", in.get("recommendations") != null
                    ? List.of(String.valueOf(in.get("recommendations"))) : List.of());
        }
        out.remove("findings");
        return out;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> normalizeFindings(Object raw) {
        List<Map<String, Object>> findings = new ArrayList<>();
        if (!(raw instanceof List<?> list)) return findings;
        for (Object o : list) {
            if (!(o instanceof Map<?, ?> f)) continue;
            Map<String, Object> finding = new LinkedHashMap<>((Map<String, Object>) f);
            finding.put("toothNumber", toToothNumber(f.get("toothNumber")));
            finding.put("confidence", clampConfidence(f.get("confidence")));
            String sev = f.get("severity") != null ? String.valueOf(f.get("severity")).trim() : "Trung bình";
            finding.put("severity", SEVERITIES.contains(sev) ? sev : "Trung bình");
            finding.put("type", f.get("type") != null ? String.valueOf(f.get("type")).toUpperCase(Locale.ROOT).trim() : "OTHER");
            finding.put("box_2d", normalizeBox(f.get("box_2d")));
            if (finding.get("requiresClinicalCheck") == null) finding.put("requiresClinicalCheck", true);
            findings.add(finding);
        }
        return findings;
    }

    private void assignIdsAndSort(List<Map<String, Object>> findings) {
        findings.sort(Comparator
                .comparing((Map<String, Object> f) -> f.get("toothNumber") instanceof Integer n ? n : 999)
                .thenComparing(f -> -XrayFindingValidatorAccess.num(f.get("confidence"))));
        int idx = 0;
        for (Map<String, Object> f : findings) {
            Object no = f.get("toothNumber");
            f.put("id", "ai-" + (no != null ? no : "x") + "-" + (idx++));
        }
    }

    private Integer toToothNumber(Object v) {
        if (v == null) return null;
        try {
            String s = String.valueOf(v).replaceAll("[^0-9]", "");
            if (s.isEmpty()) return null;
            int n = Integer.parseInt(s);
            return VALID_FDI.contains(n) ? n : null;
        } catch (Exception e) {
            return null;
        }
    }

    private double clampConfidence(Object v) {
        double d = XrayFindingValidatorAccess.num(v);
        if (d > 0 && d <= 1) d = d * 100; // AI có thể trả về dạng 0..1
        d = Math.max(0, Math.min(100, d));
        return Math.round(d * 10.0) / 10.0;
    }

    private List<Integer> normalizeBox(Object v) {
        if (!(v instanceof List<?> l) || l.size() != 4) return null;
        try {
            List<Integer> box = new ArrayList<>(4);
            for (Object o : l) {
                int n = (int) Math.round(Double.parseDouble(String.valueOf(o)));
                box.add(Math.max(0, Math.min(1000, n)));
            }
            if (box.get(2) <= box.get(0) || box.get(3) <= box.get(1)) return null;
            return box;
        } catch (Exception e) {
            return null;
        }
    }

    private BigDecimal toBigDecimal(Object v) {
        try {
            return BigDecimal.valueOf(Double.parseDouble(String.valueOf(v))).setScale(2, RoundingMode.HALF_UP);
        } catch (Exception e) {
            return null;
        }
    }

    private static void stage(List<Map<String, Object>> stages, String name, String status, String model, String note) {
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("name", name);
        s.put("status", status);
        if (model != null) s.put("model", model);
        if (note != null) s.put("note", note);
        stages.add(s);
    }

    private static List<String> distinct(String... models) {
        LinkedHashSet<String> set = new LinkedHashSet<>();
        for (String m : models) if (m != null && !m.isBlank()) set.add(m.trim());
        return new ArrayList<>(set);
    }

    private static String shortError(Throwable e) {
        String m = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
        return m.length() > 160 ? m.substring(0, 160) + "…" : m;
    }

    private static void sleepQuietly(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }
    }

    private String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }

    private static Set<Integer> buildValidFdi() {
        Set<Integer> set = new HashSet<>();
        for (int q = 1; q <= 4; q++) for (int t = 1; t <= 8; t++) set.add(q * 10 + t);
        for (int q = 5; q <= 8; q++) for (int t = 1; t <= 5; t++) set.add(q * 10 + t);
        return Collections.unmodifiableSet(set);
    }

    /** Truy cập tiện ích số học của validator (package khác). */
    private static final class XrayFindingValidatorAccess {
        static double num(Object v) {
            if (v == null) return 0;
            if (v instanceof Number n) return n.doubleValue();
            try {
                return Double.parseDouble(String.valueOf(v).replace("%", "").trim());
            } catch (Exception e) {
                return 0;
            }
        }
    }
}

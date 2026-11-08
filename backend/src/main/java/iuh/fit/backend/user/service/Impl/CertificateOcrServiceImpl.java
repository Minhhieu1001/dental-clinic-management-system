package iuh.fit.backend.user.service.Impl;

import iuh.fit.backend.user.dto.OcrCertificateResponse;
import iuh.fit.backend.user.service.CertificateOcrService;
import lombok.extern.slf4j.Slf4j;
import net.sourceforge.tess4j.ITesseract;
import net.sourceforge.tess4j.Tesseract;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class CertificateOcrServiceImpl implements CertificateOcrService {

    @Override
    public OcrCertificateResponse scanCertificate(MultipartFile file, boolean isPracticeLicense) {
        if (file == null || file.isEmpty()) {
            return new OcrCertificateResponse(
                    false, "Tess4J", null, null, null, null, null,
                    false, null, null, null, "", "File ảnh không hợp lệ hoặc rỗng."
            );
        }

        Path tempFile = null;
        try {
            tempFile = Files.createTempFile("ocr_cert_", "_" + file.getOriginalFilename());
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, tempFile, StandardCopyOption.REPLACE_EXISTING);
            }

            // Khởi tạo Tess4J Tesseract instance
            ITesseract tesseract = new Tesseract();

            // Tìm thư mục tessdata
            File projectTessData = new File("tessdata");
            if (projectTessData.exists() && projectTessData.isDirectory()) {
                tesseract.setDatapath(projectTessData.getAbsolutePath());
            } else {
                File resTessData = new File("src/main/resources/tessdata");
                if (resTessData.exists() && resTessData.isDirectory()) {
                    tesseract.setDatapath(resTessData.getAbsolutePath());
                }
            }

            tesseract.setLanguage("vie+eng");

            BufferedImage image = ImageIO.read(tempFile.toFile());
            if (image == null) {
                return new OcrCertificateResponse(
                        false, "Tess4J", null, null, null, null, null,
                        false, null, null, null, "", "Không thể đọc định dạng hình ảnh."
                );
            }

            log.info("Bắt đầu xử lý nhận diện OCR bằng Tess4J cho ảnh: {}", file.getOriginalFilename());
            String rawText = tesseract.doOCR(image);
            log.info("Tess4J OCR hoàn tất thành công, độ dài văn bản nhận diện: {} ký tự", rawText != null ? rawText.length() : 0);

            return parseCertificateText(rawText, isPracticeLicense);

        } catch (Throwable t) {
            log.warn("Tess4J OCR không khả dụng trên môi trường máy chủ hiện tại: {}. Hệ thống sẽ sử dụng fallback Tesseract.js client.", t.getMessage());
            return new OcrCertificateResponse(
                    false,
                    "Tess4J",
                    null, null, null, null, null,
                    false, null, null, null,
                    "",
                    "Tess4J engine native runtime chưa sẵn sàng trên OS host: " + t.getMessage()
            );
        } finally {
            if (tempFile != null) {
                try {
                    Files.deleteIfExists(tempFile);
                } catch (Exception ignored) {}
            }
        }
    }

    private OcrCertificateResponse parseCertificateText(String text, boolean isPracticeLicense) {
        if (text == null || text.isBlank()) {
            return new OcrCertificateResponse(
                    false, "Tess4J", null, null, null, null, null,
                    false, null, null, null, "", "Không nhận diện được nội dung chữ trong ảnh."
            );
        }

        String certificateNumber = extractCertificateNumber(text);
        String doctorName = extractDoctorName(text);
        String issuedBy = extractIssuedBy(text);
        String issueDate = extractIssueDate(text);
        boolean isLifetime = checkIsLifetime(text);
        String expiryDate = isLifetime ? null : extractExpiryDate(text, issueDate);
        String qualification = extractQualification(text);
        String scopeOfPractice = extractScopeOfPractice(text);
        String identityCardNumber = extractIdentityCardNumber(text);

        return new OcrCertificateResponse(
                true,
                "Tess4J",
                certificateNumber,
                doctorName,
                issuedBy,
                issueDate,
                expiryDate,
                isLifetime,
                qualification,
                scopeOfPractice,
                identityCardNumber,
                text,
                "Nhận diện OCR bằng Tess4J thành công."
        );
    }

    private String extractCertificateNumber(String text) {
        Pattern pattern = Pattern.compile("(?:Số|SỐ|So|SO|CCHN)[\t :]*([0-9A-Za-z\\/\\-\\.\\_]{4,30})", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            String val = matcher.group(1).trim();
            if (val.length() >= 4) return val;
        }

        Pattern patternNum = Pattern.compile("(\\d{4,8}\\/[A-Za-z0-9\\-]+)");
        Matcher matcherNum = patternNum.matcher(text);
        if (matcherNum.find()) {
            return matcherNum.group(1).trim();
        }

        return "";
    }

    private String extractDoctorName(String text) {
        Pattern pattern = Pattern.compile("(?:Họ và tên|Họ tên|Bác sĩ|BS|Ông/bà|Ông\\/Bà|Bác sỹ)[\t :]*([\\p{L}\\s]{4,40})", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            String name = matcher.group(1).trim().replaceAll("\n", " ");
            if (name.split("\\s+").length >= 2) return cleanName(name);
        }
        return "";
    }

    private String cleanName(String name) {
        return name.replaceAll("[\\:\\;\\,\\.\\d]", "").trim();
    }

    private String extractIssuedBy(String text) {
        if (text.toUpperCase().contains("SỞ Y TẾ THÀNH PHỐ HỒ CHÍ MINH") || text.toUpperCase().contains("SỞ Y TẾ TP. HỒ CHÍ MINH") || text.toUpperCase().contains("SỞ Y TẾ TP.HCM")) {
            return "Sở Y Tế Thành phố Hồ Chí Minh";
        }
        if (text.toUpperCase().contains("SỞ Y TẾ HÀ NỘI") || text.toUpperCase().contains("SỞ Y TẾ THÀNH PHỐ HÀ NỘI")) {
            return "Sở Y Tế Thành phố Hà Nội";
        }
        if (text.toUpperCase().contains("BỘ Y TẾ")) {
            return "Bộ Y Tế";
        }

        Pattern pattern = Pattern.compile("(Sở Y tế[^\\n\\,]+)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        return "";
    }

    private String extractIssueDate(String text) {
        Pattern pattern = Pattern.compile("ngày[\\s]+(\\d{1,2})[\\s]+tháng[\\s]+(\\d{1,2})[\\s]+năm[\\s]+(\\d{4})", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            int d = Integer.parseInt(matcher.group(1));
            int m = Integer.parseInt(matcher.group(2));
            int y = Integer.parseInt(matcher.group(3));
            return String.format("%04d-%02d-%02d", y, m, d);
        }

        Pattern patternSlash = Pattern.compile("(\\d{1,2})[\\/\\-\\.](\\d{1,2})[\\/\\-\\.](\\d{4})");
        Matcher matcherSlash = patternSlash.matcher(text);
        if (matcherSlash.find()) {
            int d = Integer.parseInt(matcherSlash.group(1));
            int m = Integer.parseInt(matcherSlash.group(2));
            int y = Integer.parseInt(matcherSlash.group(3));
            return String.format("%04d-%02d-%02d", y, m, d);
        }

        return "";
    }

    private boolean checkIsLifetime(String text) {
        String lower = text.toLowerCase();
        return lower.contains("vô thời hạn") || lower.contains("không thời hạn") || lower.contains("vĩnh viễn") || lower.contains("chứng chỉ hành nghề");
    }

    private String extractExpiryDate(String text, String issueDate) {
        Pattern pattern = Pattern.compile("(?:hạn dùng|giá trị đến|có giá trị đến|hết hạn)[\\s:]*(\\d{1,2})[\\/\\-\\.](\\d{1,2})[\\/\\-\\.](\\d{4})", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            int d = Integer.parseInt(matcher.group(1));
            int m = Integer.parseInt(matcher.group(2));
            int y = Integer.parseInt(matcher.group(3));
            return String.format("%04d-%02d-%02d", y, m, d);
        }
        return "";
    }

    private String extractQualification(String text) {
        String upper = text.toUpperCase();
        if (upper.contains("CHUYÊN KHOA II") || upper.contains("CKII") || upper.contains("CK2")) {
            return "Bác sĩ Chuyên khoa II (CKII)";
        }
        if (upper.contains("CHUYÊN KHOA I") || upper.contains("CKI") || upper.contains("CK1")) {
            return "Bác sĩ Chuyên khoa I (CKI)";
        }
        if (upper.contains("TIẾN SĨ")) {
            return "Tiến sĩ - Bác sĩ";
        }
        if (upper.contains("THẠC SĨ")) {
            return "Thạc sĩ - Bác sĩ";
        }
        if (upper.contains("BÁC SĨ RĂNG HÀM MẶT") || upper.contains("BÁC SỸ RĂNG HÀM MẶT")) {
            return "Bác sĩ Răng Hàm Mặt";
        }
        if (upper.contains("BÁC SĨ") || upper.contains("BÁC SỸ")) {
            return "Bác sĩ";
        }
        if (upper.contains("Y SĨ") || upper.contains("Y SỸ")) {
            return "Y sĩ";
        }

        Pattern pattern = Pattern.compile("(?:Văn bằng chuyên môn|Văn bằng|Trình độ)[\t :]*([^\\n\\,]+)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        return "Bác sĩ";
    }

    private String extractScopeOfPractice(String text) {
        String upper = text.toUpperCase();
        if (upper.contains("RĂNG HÀM MẶT") || upper.contains("CHUYÊN KHOA RĂNG")) {
            return "Khám bệnh, chữa bệnh chuyên khoa Răng hàm mặt";
        }
        if (upper.contains("CHỈNH HÌNH RĂNG MẶT")) {
            return "Khám bệnh, chữa bệnh chuyên khoa Răng hàm mặt (Chỉnh hình răng mặt)";
        }
        if (upper.contains("IMPLANT")) {
            return "Cấy ghép Nha khoa (Dental Implant)";
        }

        Pattern pattern = Pattern.compile("(?:Phạm vi hoạt động chuyên môn|Phạm vi hành nghề|Phạm vi hoạt động)[\t :]*([^\\n\\.]+)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        return "Khám bệnh, chữa bệnh chuyên khoa Răng hàm mặt";
    }

    private String extractIdentityCardNumber(String text) {
        Pattern pattern = Pattern.compile("(?:Số CMND|Số CCCD|CMND|CCCD|Số định danh)[\t :]*(\\d{9,12})", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }

        Pattern patternNum = Pattern.compile("\\b(\\d{9}|\\d{12})\\b");
        Matcher matcherNum = patternNum.matcher(text);
        if (matcherNum.find()) {
            return matcherNum.group(1).trim();
        }
        return "";
    }
}

package iuh.fit.backend.user.service;

import iuh.fit.backend.user.dto.OcrCertificateResponse;
import org.springframework.web.multipart.MultipartFile;

public interface CertificateOcrService {
    OcrCertificateResponse scanCertificate(MultipartFile file, boolean isPracticeLicense);
}

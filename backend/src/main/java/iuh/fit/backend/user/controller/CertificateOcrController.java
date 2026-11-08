package iuh.fit.backend.user.controller;

import iuh.fit.backend.user.dto.OcrCertificateResponse;
import iuh.fit.backend.user.service.CertificateOcrService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/ocr")
@RequiredArgsConstructor
public class CertificateOcrController {

    private final CertificateOcrService certificateOcrService;

    @PostMapping(value = "/certificate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<OcrCertificateResponse> scanCertificate(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "isPracticeLicense", defaultValue = "true") boolean isPracticeLicense
    ) {
        OcrCertificateResponse response = certificateOcrService.scanCertificate(file, isPracticeLicense);
        return ResponseEntity.ok(response);
    }
}

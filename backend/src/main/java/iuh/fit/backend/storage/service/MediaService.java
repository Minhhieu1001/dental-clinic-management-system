package iuh.fit.backend.storage.service;

import org.springframework.web.multipart.MultipartFile;

public interface MediaService {
    String uploadImage(MultipartFile file);
    void deleteImage(String publicId);
}

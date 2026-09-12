package iuh.fit.backend.medicalrecord.controller;

import iuh.fit.backend.common.response.ApiResponse;
import iuh.fit.backend.medicalrecord.dto.ToothRecordDTO;
import iuh.fit.backend.medicalrecord.dto.ToothRecordRequest;
import iuh.fit.backend.medicalrecord.service.ToothRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tooth-records")
@RequiredArgsConstructor
public class ToothRecordController {

    private final ToothRecordService toothRecordService;

    @GetMapping("/examination-result/{examinationResultId}")
    public ResponseEntity<ApiResponse<List<ToothRecordDTO>>> getByExaminationResultId(
            @PathVariable UUID examinationResultId) {
        List<ToothRecordDTO> records = toothRecordService.getToothRecordsByExaminationResultId(examinationResultId);
        return ResponseEntity.ok(
                ApiResponse.<List<ToothRecordDTO>>builder()
                        .status(200)
                        .message("Lấy danh sách ghi nhận răng thành công")
                        .data(records)
                        .build()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ToothRecordDTO>> getById(@PathVariable UUID id) {
        ToothRecordDTO record = toothRecordService.getToothRecordById(id);
        return ResponseEntity.ok(
                ApiResponse.<ToothRecordDTO>builder()
                        .status(200)
                        .message("Lấy thông tin ghi nhận răng thành công")
                        .data(record)
                        .build()
        );
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ToothRecordDTO>> create(
            @Valid @RequestBody ToothRecordRequest request) {
        ToothRecordDTO created = toothRecordService.createToothRecord(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<ToothRecordDTO>builder()
                        .status(201)
                        .message("Tạo ghi nhận răng thành công")
                        .data(created)
                        .build()
        );
    }

    @PostMapping("/batch/{examinationResultId}")
    public ResponseEntity<ApiResponse<List<ToothRecordDTO>>> batchSave(
            @PathVariable UUID examinationResultId,
            @RequestBody List<ToothRecordRequest> requests) {
        List<ToothRecordDTO> saved = toothRecordService.batchSaveToothRecords(examinationResultId, requests);
        return ResponseEntity.ok(
                ApiResponse.<List<ToothRecordDTO>>builder()
                        .status(200)
                        .message("Lưu đồng loạt sơ đồ răng thành công")
                        .data(saved)
                        .build()
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ToothRecordDTO>> update(
            @PathVariable UUID id,
            @RequestBody ToothRecordRequest request) {
        ToothRecordDTO updated = toothRecordService.updateToothRecord(id, request);
        return ResponseEntity.ok(
                ApiResponse.<ToothRecordDTO>builder()
                        .status(200)
                        .message("Cập nhật ghi nhận răng thành công")
                        .data(updated)
                        .build()
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        toothRecordService.deleteToothRecord(id);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .status(200)
                        .message("Xóa ghi nhận răng thành công")
                        .build()
        );
    }
}

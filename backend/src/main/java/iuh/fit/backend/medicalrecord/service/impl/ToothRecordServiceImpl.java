package iuh.fit.backend.medicalrecord.service.impl;

import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.exception.ErrorCode;
import iuh.fit.backend.medicalrecord.dto.ToothRecordDTO;
import iuh.fit.backend.medicalrecord.dto.ToothRecordRequest;
import iuh.fit.backend.medicalrecord.entity.ExaminationResult;
import iuh.fit.backend.medicalrecord.entity.ToothRecord;
import iuh.fit.backend.medicalrecord.repository.ExaminationResultRepository;
import iuh.fit.backend.medicalrecord.repository.ToothRecordRepository;
import iuh.fit.backend.medicalrecord.service.ToothRecordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ToothRecordServiceImpl implements ToothRecordService {

    private final ToothRecordRepository toothRecordRepository;
    private final ExaminationResultRepository examinationResultRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ToothRecordDTO> getToothRecordsByExaminationResultId(UUID examinationResultId) {
        return toothRecordRepository.findByExaminationResultId(examinationResultId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ToothRecordDTO getToothRecordById(UUID id) {
        ToothRecord record = toothRecordRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy ghi nhận răng với ID: " + id));
        return mapToDTO(record);
    }

    @Override
    @Transactional
    public ToothRecordDTO createToothRecord(ToothRecordRequest request) {
        if (request.getExaminationResultId() == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "examinationResultId không được để trống");
        }

        ExaminationResult examResult = examinationResultRepository.findById(request.getExaminationResultId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy kết quả khám ID: " + request.getExaminationResultId()));

        if (Boolean.FALSE.equals(examResult.getDisabled())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Đợt khám này đã được xác nhận và khóa hồ sơ. Không thể thêm/sửa ghi nhận răng!");
        }

        Optional<ToothRecord> existingOpt = toothRecordRepository.findByExaminationResultIdAndToothNumber(
                request.getExaminationResultId(), request.getToothNumber()
        );

        ToothRecord record;
        if (existingOpt.isPresent()) {
            record = existingOpt.get();
            record.setToothStatus(request.getToothStatus());
            record.setSeverity(request.getSeverity());
            record.setHasCaries(request.getHasCaries());
            record.setCariesLocation(request.getCariesLocation());
            record.setPainType(request.getPainType());
            record.setCariesDepth(request.getCariesDepth());
            record.setGingivalCondition(request.getGingivalCondition());
            record.setShake(request.getShake());
        } else {
            record = ToothRecord.builder()
                    .examinationResult(examResult)
                    .toothNumber(request.getToothNumber())
                    .toothStatus(request.getToothStatus())
                    .severity(request.getSeverity())
                    .hasCaries(request.getHasCaries())
                    .cariesLocation(request.getCariesLocation())
                    .painType(request.getPainType())
                    .cariesDepth(request.getCariesDepth())
                    .gingivalCondition(request.getGingivalCondition())
                    .shake(request.getShake())
                    .build();
        }

        record = toothRecordRepository.save(record);
        log.info("Đã tạo/cập nhật ghi nhận răng: răng {} cho kết quả khám {}", record.getToothNumber(), examResult.getId());
        return mapToDTO(record);
    }

    @Override
    @Transactional
    public ToothRecordDTO updateToothRecord(UUID id, ToothRecordRequest request) {
        ToothRecord record = toothRecordRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy ghi nhận răng với ID: " + id));

        if (record.getExaminationResult() != null && Boolean.FALSE.equals(record.getExaminationResult().getDisabled())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Đợt khám này đã được xác nhận và khóa hồ sơ. Không thể chỉnh sửa ghi nhận răng!");
        }

        if (request.getToothNumber() != null && !request.getToothNumber().trim().isEmpty()) {
            record.setToothNumber(request.getToothNumber().trim());
        }
        if (request.getToothStatus() != null) {
            record.setToothStatus(request.getToothStatus());
        }
        if (request.getSeverity() != null) {
            record.setSeverity(request.getSeverity());
        }
        if (request.getHasCaries() != null) {
            record.setHasCaries(request.getHasCaries());
        }
        if (request.getCariesLocation() != null) {
            record.setCariesLocation(request.getCariesLocation());
        }
        if (request.getPainType() != null) {
            record.setPainType(request.getPainType());
        }
        if (request.getCariesDepth() != null) {
            record.setCariesDepth(request.getCariesDepth());
        }
        if (request.getGingivalCondition() != null) {
            record.setGingivalCondition(request.getGingivalCondition());
        }
        if (request.getShake() != null) {
            record.setShake(request.getShake());
        }
        record = toothRecordRepository.save(record);
        log.info("Đã cập nhật ghi nhận răng ID: {}", id);
        return mapToDTO(record);
    }

    @Override
    @Transactional
    public List<ToothRecordDTO> batchSaveToothRecords(UUID examinationResultId, List<ToothRecordRequest> requests) {
        ExaminationResult examResult = examinationResultRepository.findById(examinationResultId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy kết quả khám ID: " + examinationResultId));

        if (Boolean.FALSE.equals(examResult.getDisabled())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Đợt khám này đã được xác nhận và khóa hồ sơ. Không thể thêm/sửa ghi nhận răng!");
        }

        if (requests == null || requests.isEmpty()) {
            return new ArrayList<>();
        }

        List<ToothRecord> savedRecords = new ArrayList<>();
        for (ToothRecordRequest req : requests) {
            Optional<ToothRecord> existingOpt = toothRecordRepository.findByExaminationResultIdAndToothNumber(
                    examinationResultId, req.getToothNumber()
            );

            ToothRecord record;
            if (existingOpt.isPresent()) {
                record = existingOpt.get();
                record.setToothStatus(req.getToothStatus());
                record.setSeverity(req.getSeverity());
                record.setHasCaries(req.getHasCaries());
                record.setCariesLocation(req.getCariesLocation());
                record.setPainType(req.getPainType());
                record.setCariesDepth(req.getCariesDepth());
                record.setGingivalCondition(req.getGingivalCondition());
                record.setShake(req.getShake());
            } else {
                record = ToothRecord.builder()
                        .examinationResult(examResult)
                        .toothNumber(req.getToothNumber())
                        .toothStatus(req.getToothStatus())
                        .severity(req.getSeverity())
                        .hasCaries(req.getHasCaries())
                        .cariesLocation(req.getCariesLocation())
                        .painType(req.getPainType())
                        .cariesDepth(req.getCariesDepth())
                        .gingivalCondition(req.getGingivalCondition())
                        .shake(req.getShake())
                        .build();
            }
            savedRecords.add(toothRecordRepository.save(record));
        }

        log.info("Đã lưu đồng loạt {} ghi nhận răng cho kết quả khám {}", savedRecords.size(), examinationResultId);
        return savedRecords.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteToothRecord(UUID id) {
        ToothRecord record = toothRecordRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy ghi nhận răng với ID: " + id));

        if (record.getExaminationResult() != null && Boolean.FALSE.equals(record.getExaminationResult().getDisabled())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Đợt khám này đã được xác nhận và khóa hồ sơ. Không thể xóa ghi nhận răng!");
        }

        toothRecordRepository.delete(record);
        log.info("Đã xóa ghi nhận răng ID: {}", id);
    }

    private ToothRecordDTO mapToDTO(ToothRecord record) {
        return ToothRecordDTO.builder()
                .id(record.getId())
                .examinationResultId(record.getExaminationResult() != null ? record.getExaminationResult().getId() : null)
                .toothNumber(record.getToothNumber())
                .toothStatus(record.getToothStatus())
                .severity(record.getSeverity())
                .hasCaries(record.getHasCaries())
                .cariesLocation(record.getCariesLocation())
                .painType(record.getPainType())
                .cariesDepth(record.getCariesDepth())
                .gingivalCondition(record.getGingivalCondition())
                .shake(record.getShake())
                .build();
    }
}

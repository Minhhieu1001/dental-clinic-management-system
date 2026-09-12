package iuh.fit.backend.medicalrecord.service;

import iuh.fit.backend.medicalrecord.dto.ToothRecordDTO;
import iuh.fit.backend.medicalrecord.dto.ToothRecordRequest;

import java.util.List;
import java.util.UUID;

public interface ToothRecordService {

    List<ToothRecordDTO> getToothRecordsByExaminationResultId(UUID examinationResultId);

    ToothRecordDTO getToothRecordById(UUID id);

    ToothRecordDTO createToothRecord(ToothRecordRequest request);

    ToothRecordDTO updateToothRecord(UUID id, ToothRecordRequest request);

    List<ToothRecordDTO> batchSaveToothRecords(UUID examinationResultId, List<ToothRecordRequest> requests);

    void deleteToothRecord(UUID id);
}

package iuh.fit.backend.patient.service;

import iuh.fit.backend.patient.dto.*;
import java.util.UUID;
import java.util.List;

public interface PatientRelationshipService {
    List<PatientRelationshipProfileResponse> getMyProfiles();

    List<PatientRelationshipProfileResponse> getProfilesByPatientId(UUID patientId);

    List<PatientRelationshipResponse> getAllActiveRelationships();

    PatientRelationshipCodeResponse requestCode(PatientRelationshipRequest request);

    PatientRelationshipResponse verify(PatientRelationshipVerifyRequest request);

    void deleteRelationship(UUID relationshipId);
}

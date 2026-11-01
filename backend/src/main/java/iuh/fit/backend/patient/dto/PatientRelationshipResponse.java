package iuh.fit.backend.patient.dto;

import iuh.fit.backend.patient.enums.RelationshipType;
import java.util.UUID;

public record PatientRelationshipResponse(UUID id, UUID patientId, UUID relatedPatientId,
                                          RelationshipType relationshipType, boolean status) {}

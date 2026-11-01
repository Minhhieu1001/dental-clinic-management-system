package iuh.fit.backend.patient;

import iuh.fit.backend.common.response.ApiResponse;
import iuh.fit.backend.patient.dto.PatientRelationshipProfileResponse;
import iuh.fit.backend.patient.enums.RelationshipType;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class PatientRelationshipProfileResponseTest {
    @Test
    void responseMatchesFrontendListContract() {
        UUID ownerId = UUID.randomUUID();
        UUID childId = UUID.randomUUID();
        UUID relationshipId = UUID.randomUUID();
        var owner = new PatientRelationshipProfileResponse(ownerId, null, true,
                "Parent", "PA-PARENT", LocalDate.of(1990, 1, 1), "0901234567",
                "0123456789", null, null, null, true);
        var child = new PatientRelationshipProfileResponse(childId, relationshipId, false,
                "Child", "PA-CHILD", LocalDate.of(2015, 3, 12), "0912345678",
                null, "0901234567", RelationshipType.CHILD,
                LocalDateTime.of(2026, 10, 31, 9, 0), true);
        var mapper = JsonMapper.builder().findAndAddModules().build();
        var json = mapper.readTree(mapper.writeValueAsString(ApiResponse.success(List.of(owner, child))));
        var profiles = json.get("data");
        assertTrue(profiles.isArray());
        assertEquals(2, profiles.size());
        assertTrue(profiles.get(0).get("isPrimary").asBoolean());
        assertFalse(profiles.get(1).get("isPrimary").asBoolean());
        assertTrue(profiles.get(0).get("status").asBoolean());
        assertTrue(profiles.get(1).get("status").asBoolean());
        assertEquals(childId.toString(), profiles.get(1).get("patientId").asText());
        assertEquals(relationshipId.toString(), profiles.get(1).get("relationshipId").asText());
        assertEquals("CHILD", profiles.get(1).get("relationshipType").asText());
        assertEquals("2015-03-12", profiles.get(1).get("dateOfBirth").asText());
        assertFalse(json.has("linkedCount"));
        assertEquals("0901234567", profiles.get(0).get("phoneMasked").asText());
        assertEquals("0123456789", profiles.get(0).get("cccdMasked").asText());
    }
}

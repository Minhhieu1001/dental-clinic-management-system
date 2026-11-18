package iuh.fit.backend.customercare.dto;

import iuh.fit.backend.customercare.enums.CareSuggestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerCareSuggestionResponse {
    private UUID patientId;
    private String patientCode;
    private String patientName;
    private String phone;
    private CareSuggestionType type;
    private String suggestedContent;
    private LocalDate suggestedDate;
}

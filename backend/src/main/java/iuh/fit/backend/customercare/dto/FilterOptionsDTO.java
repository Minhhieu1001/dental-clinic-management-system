package iuh.fit.backend.customercare.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FilterOptionsDTO {
    private List<NamedOptionDTO> dentists;
    private List<NamedOptionDTO> employees;
    private List<String> procedureGroups;
    private List<String> procedures;
    private List<String> customerGroups;
    private List<String> customerSources;
    private List<String> cities;
    private List<String> districts;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class NamedOptionDTO {
        private String id;
        private String name;
    }
}

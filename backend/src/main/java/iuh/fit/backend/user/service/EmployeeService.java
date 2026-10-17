package iuh.fit.backend.user.service;

import iuh.fit.backend.user.dto.EmployeeRequest;
import iuh.fit.backend.user.dto.EmployeeResponse;
import iuh.fit.backend.user.dto.EmployeeListResponse;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface EmployeeService {
    List<EmployeeResponse> getAllEmployees();

    List<EmployeeListResponse> getEmployeesList();

    EmployeeResponse getEmployeeById(UUID id);

    EmployeeListResponse getEmployeeWithBranchById(UUID id);

    EmployeeResponse createEmployee(EmployeeRequest request);

    EmployeeResponse updateEmployee(UUID id, EmployeeRequest request);

    void deleteEmployee(UUID id);

    long countAllEmployees();

    Map<String, Long> getEmployeeStats();
}



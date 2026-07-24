package iuh.fit.backend.user.service.Impl;

import iuh.fit.backend.user.dto.EmployeeRequest;
import iuh.fit.backend.user.dto.EmployeeResponse;
import iuh.fit.backend.user.dto.EmployeeListResponse;
import iuh.fit.backend.user.entity.Employee;
import iuh.fit.backend.user.entity.User;
import iuh.fit.backend.user.enums.StatusUser;
import iuh.fit.backend.user.repository.EmployeeRepository;
import iuh.fit.backend.user.repository.UserRepository;
import iuh.fit.backend.user.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class EmployeeServiceImpl implements EmployeeService {
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    @Override
    public List<EmployeeResponse> getAllEmployees() {
        return employeeRepository.findAllWithUser()
                .stream()
                .map(this::toEmployeeResponse)
                .toList();
    }

    @Override
    public List<EmployeeListResponse> getEmployeesList() {
        return employeeRepository.findAllWithUser()
                .stream()
                .map(this::toEmployeeListResponse)
                .toList();
    }

    @Override
    public EmployeeResponse getEmployeeById(UUID id) {
        return toEmployeeResponse(findEmployee(id));
    }

    @Override
    public EmployeeResponse createEmployee(EmployeeRequest request) {
        Employee employee = new Employee();
        applyEmployeeRequest(employee, request, null);
        return toEmployeeResponse(employeeRepository.save(employee));
    }

    @Override
    public EmployeeResponse updateEmployee(UUID id, EmployeeRequest request) {
        Employee employee = findEmployee(id);
        applyEmployeeRequest(employee, request, id);
        return toEmployeeResponse(employeeRepository.save(employee));
    }

    @Override
    public void deleteEmployee(UUID id) {
        Employee employee = findEmployee(id);
        try {
            employeeRepository.delete(employee);
            employeeRepository.flush();
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot delete employee because it is referenced by other data.",
                    exception
            );
        }
    }

    @Override
    public long countAllEmployees() {
        return employeeRepository.count();
    }

    @Override
    public Map<String, Long> getEmployeeStats() {
        List<Employee> allEmployees = employeeRepository.findAllWithUser();
        long total = allEmployees.size();
        long active = 0;
        long blocked = 0;
        long inactive = 0;

        for (Employee emp : allEmployees) {
            User user = emp.getUser();
            if (user != null && user.getStatus() != null) {
                switch (user.getStatus()) {
                    case ACTIVE -> active++;
                    case BLOCK -> blocked++;
                    case INACTIVE -> inactive++;
                }
            } else {
                inactive++;
            }
        }

        Map<String, Long> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("active", active);
        stats.put("blocked", blocked);
        stats.put("inactive", inactive);
        return stats;
    }

    private void applyEmployeeRequest(Employee employee, EmployeeRequest request, UUID currentEmployeeId) {
        validateEmployeeUserIsAvailable(request.userId(), currentEmployeeId);
        employee.setUser(resolveUser(request.userId()));
        employee.setPosition(request.position());
        employee.setSalary(request.salary());
        employee.setHireDate(request.hireDate());
        employee.setStatus(request.status());
        employee.setGender(request.gender());
        employee.setAddress(request.address());
    }

    private User resolveUser(UUID userId) {
        if (userId == null) {
            return null;
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userId));
    }

    private void validateEmployeeUserIsAvailable(UUID userId, UUID currentEmployeeId) {
        if (userId == null) {
            return;
        }
        employeeRepository.findByUserId(userId)
                .filter(employee -> !employee.getId().equals(currentEmployeeId))
                .ifPresent(employee -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "User is already assigned to another employee.");
                });
    }

    private Employee findEmployee(UUID id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found: " + id));
    }

    private EmployeeResponse toEmployeeResponse(Employee employee) {
        User user = employee.getUser();
        return new EmployeeResponse(
                employee.getId(),
                user != null ? user.getId() : null,
                user != null ? user.getUsername() : null,
                user != null ? user.getEmail() : null,
                employee.getPosition(),
                employee.getSalary(),
                employee.getHireDate(),
                employee.getStatus()
        );
    }

    private EmployeeListResponse toEmployeeListResponse(Employee employee) {
        User user = employee.getUser();
        return new EmployeeListResponse(
                employee.getId(),
                user != null ? user.getId() : null,
                user != null ? user.getAvatarUrl() : null,
                user != null ? user.getUsername() : null,
                user != null ? user.getEmail() : null,
                user != null ? user.getPhone() : null,
                user != null ? user.getRole() : null,
                employee.getPosition(),
                user != null ? user.getCreatedAt() : null,
                employee.getStatus(),
                user != null ? user.getStatus() : null,
                employee.getGender(),
                employee.getAddress()
        );
    }
}

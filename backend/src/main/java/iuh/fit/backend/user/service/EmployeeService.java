package iuh.fit.backend.user.service;

import iuh.fit.backend.user.dto.EmployeeRequest;
import iuh.fit.backend.user.dto.EmployeeResponse;
import iuh.fit.backend.user.entity.Employee;
import iuh.fit.backend.user.entity.User;
import iuh.fit.backend.user.repository.EmployeeRepository;
import iuh.fit.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class EmployeeService {
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    public List<EmployeeResponse> getAllEmployees() {
        return employeeRepository.findAll()
                .stream()
                .map(this::toEmployeeResponse)
                .toList();
    }

    public EmployeeResponse getEmployeeById(UUID id) {
        return toEmployeeResponse(findEmployee(id));
    }

    public EmployeeResponse createEmployee(EmployeeRequest request) {
        Employee employee = new Employee();
        applyEmployeeRequest(employee, request, null);
        return toEmployeeResponse(employeeRepository.save(employee));
    }

    public EmployeeResponse updateEmployee(UUID id, EmployeeRequest request) {
        Employee employee = findEmployee(id);
        applyEmployeeRequest(employee, request, id);
        return toEmployeeResponse(employeeRepository.save(employee));
    }

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

    public long countAllEmployees(){
        return employeeRepository.count();
    }

    private void applyEmployeeRequest(Employee employee, EmployeeRequest request, UUID currentEmployeeId) {
        validateEmployeeUserIsAvailable(request.userId(), currentEmployeeId);
        employee.setUser(resolveUser(request.userId()));
        employee.setPosition(request.position());
        employee.setSalary(request.salary());
        employee.setHireDate(request.hireDate());
        employee.setStatus(request.status());
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

}



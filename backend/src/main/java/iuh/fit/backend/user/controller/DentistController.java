package iuh.fit.backend.user.controller;

import iuh.fit.backend.user.dto.DentistListResponse;
import iuh.fit.backend.user.dto.DentistRequest;
import iuh.fit.backend.user.dto.DentistResponse;
import iuh.fit.backend.user.service.DentistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/dentists")
@RequiredArgsConstructor
public class DentistController {
    private final DentistService dentistService;

    @GetMapping
    public List<DentistResponse> getAllDentists() {
        return dentistService.getAllDentists();
    }

    @GetMapping("/list")
    public List<DentistListResponse> getDentistsList() {
        return dentistService.getDentistsList();
    }

    @GetMapping("/stats")
    public Map<String, Long> getDentistStats() {
        return dentistService.getDentistStats();
    }


    @GetMapping("/{id}")
    public DentistListResponse getDentistById(@PathVariable UUID id) {
        return dentistService.getDentistById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DentistResponse createDentist(@RequestBody DentistRequest request) {
        return dentistService.createDentist(request);
    }

    @PutMapping("/{id}")
    public DentistListResponse updateDentist(@PathVariable UUID id, @RequestBody DentistRequest request) {
        return dentistService.updateDentist(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDentist(@PathVariable UUID id) {
        dentistService.deleteDentist(id);
    }
}

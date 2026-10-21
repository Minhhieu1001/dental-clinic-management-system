package iuh.fit.backend.auth.service;

import iuh.fit.backend.auth.dto.AuthResponse;
import iuh.fit.backend.auth.dto.LoginRequest;
import iuh.fit.backend.auth.dto.PatientLoginRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public interface AuthService {

    AuthResponse login(LoginRequest request, HttpServletResponse response);

    AuthResponse patientLogin(PatientLoginRequest request, HttpServletResponse response);

    void logout(HttpServletResponse response);

    AuthResponse refreshToken(HttpServletRequest request, HttpServletResponse response);

    AuthResponse getCurrentUser();
}

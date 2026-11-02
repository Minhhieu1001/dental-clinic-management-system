package iuh.fit.backend.auth.service;

import iuh.fit.backend.auth.dto.AuthResponse;
import iuh.fit.backend.auth.dto.LoginRequest;
import iuh.fit.backend.auth.dto.PatientLoginRequest;
import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.exception.ErrorCode;
import iuh.fit.backend.common.security.*;
import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.patient.repository.PatientRepository;
import iuh.fit.backend.user.entity.User;
import iuh.fit.backend.user.enums.Role;
import iuh.fit.backend.user.enums.StatusUser;
import iuh.fit.backend.user.repository.EmployeeRepository;
import iuh.fit.backend.user.repository.DentistRepository;
import iuh.fit.backend.user.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final CookieUtils cookieUtils;
    private final CustomUserDetailsService userDetailsService;
    private final EmployeeRepository employeeRepository;
    private final DentistRepository dentistRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public AuthResponse login(LoginRequest request, HttpServletResponse response) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.email(),
                            request.password()));

            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            User user = userDetails.getUser();

            if (user.getRole() != Role.ADMIN && user.getRole() != Role.DENTIST
                    && user.getRole() != Role.EMPLOYEE) {
                throw new AppException(ErrorCode.STAFF_LOGIN_ROLE_REQUIRED);
            }
            validateAccountStatus(user);

            String accessToken = jwtTokenProvider.generateAccessToken(userDetails);
            String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

            ResponseCookie accessCookie = cookieUtils.createAccessTokenCookie(accessToken);
            ResponseCookie refreshCookie = cookieUtils.createRefreshTokenCookie(refreshToken);

            response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
            response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

            SecurityContextHolder.getContext().setAuthentication(authentication);

            log.info("User logged in successfully: {}", user.getEmail());

            return toAuthResponse(user);

        } catch (BadCredentialsException ex) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }
    }

    @Override
    public AuthResponse patientLogin(PatientLoginRequest request, HttpServletResponse response) {
        String code = request.patientCode().trim().toUpperCase();
        String rawPhone = request.phone().trim().replaceAll("[^0-9]", "");

        // 1. Tìm tài khoản User theo codeName trên bảng users (ưu tiên Role PATIENT)
        User user = userRepository.findByCodeNameAndRole(code, Role.PATIENT)
                .or(() -> userRepository.findByCodeName(code))
                .or(() -> userRepository.findByUsername(code))
                .orElseThrow(() -> new AppException(ErrorCode.PATIENT_INVALID_CREDENTIALS,
                        "Không tìm thấy tài khoản bệnh nhân với mã " + code));

        // Đảm bảo đúng role bệnh nhân
        if (user.getRole() != Role.PATIENT) {
            throw new AppException(ErrorCode.PATIENT_LOGIN_ROLE_REQUIRED);
        }

        // 2. Đối chiếu số điện thoại trực tiếp trong bảng users
        String userPhone = user.getPhone() != null ? user.getPhone().trim().replaceAll("[^0-9]", "") : "";
        if (!normalizePhone(userPhone).equals(normalizePhone(rawPhone))) {
            throw new AppException(ErrorCode.PATIENT_INVALID_CREDENTIALS,
                    "Số điện thoại không khớp với tài khoản bệnh nhân " + code);
        }

        // 3. Kiểm tra trạng thái tài khoản
        validateAccountStatus(user);

        // 4. Kiểm tra mật khẩu
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new AppException(ErrorCode.PATIENT_INVALID_CREDENTIALS, "Mật khẩu không chính xác");
        }

        // 5. Lấy thông tin hồ sơ bệnh nhân đi kèm (nếu có)
        Patient patient = user.getPatient();
        if (patient == null) {
            patient = patientRepository.findByUserId(user.getId())
                    .or(() -> patientRepository.findByPatientCode(code))
                    .orElse(null);
        }

        UUID patientId = patient != null ? patient.getId() : null;
        String fullName = patient != null && patient.getFullName() != null
                ? patient.getFullName()
                : (user.getUsername() != null ? user.getUsername() : user.getCodeName());

        // 6. Tạo CustomUserDetails và sinh Tokens
        CustomUserDetails userDetails = new CustomUserDetails(user);
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());

        String accessToken = jwtTokenProvider.generateAccessToken(userDetails);
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        ResponseCookie accessCookie = cookieUtils.createAccessTokenCookie(accessToken);
        ResponseCookie refreshCookie = cookieUtils.createRefreshTokenCookie(refreshToken);

        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

        SecurityContextHolder.getContext().setAuthentication(authentication);

        log.info("Patient logged in successfully: {} (code: {})", user.getEmail(), code);

        String phoneResult = user.getPhone() != null && !user.getPhone().trim().isEmpty()
                ? user.getPhone().trim()
                : (patient != null && patient.getPhoneNumber() != null && !patient.getPhoneNumber().trim().isEmpty()
                        ? patient.getPhoneNumber().trim()
                        : rawPhone);

        return new AuthResponse(
                user.getId(),
                user.getEmail(),
                fullName,
                user.getRole().name(),
                user.getAvatarUrl(),
                null,
                null,
                patientId,
                phoneResult);
    }

    private String normalizePhone(String p) {
        if (p == null) return "";
        p = p.replaceAll("[^0-9]", "");
        if (p.startsWith("84")) p = "0" + p.substring(2);
        return p;
    }

    @Override
    public void logout(HttpServletResponse response) {
        ResponseCookie cleanAccess = cookieUtils.createCleanAccessTokenCookie();
        ResponseCookie cleanRefresh = cookieUtils.createCleanRefreshTokenCookie();

        response.addHeader(HttpHeaders.SET_COOKIE, cleanAccess.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, cleanRefresh.toString());

        SecurityContextHolder.clearContext();

        log.info("User logged out successfully");
    }

    @Override
    public AuthResponse refreshToken(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = extractTokenFromCookie(request, "refresh_token");

        if (refreshToken == null) {
            clearAuthCookies(response);
            throw new AppException(ErrorCode.REFRESH_TOKEN_NOT_FOUND);
        }

        if (!jwtTokenProvider.validateToken(refreshToken)) {
            clearAuthCookies(response);
            throw new AppException(ErrorCode.INVALID_TOKEN);
        }

        if (!jwtTokenProvider.isRefreshToken(refreshToken)) {
            clearAuthCookies(response);
            throw new AppException(ErrorCode.INVALID_TOKEN,
                    "Token không phải là Refresh Token");
        }

        String email = jwtTokenProvider.getEmailFromToken(refreshToken);
        CustomUserDetails userDetails = (CustomUserDetails) userDetailsService.loadUserByUsername(email);
        try {
            validateAccountStatus(userDetails.getUser());
        } catch (AppException ex) {
            clearAuthCookies(response);
            throw ex;
        }

        String newAccessToken = jwtTokenProvider.generateAccessToken(userDetails);

        ResponseCookie accessCookie = cookieUtils.createAccessTokenCookie(newAccessToken);
        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());

        log.info("Access token refreshed for user: {}", email);

        return toAuthResponse(userDetails.getUser());
    }

    private void clearAuthCookies(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, cookieUtils.createCleanAccessTokenCookie().toString());
        response.addHeader(HttpHeaders.SET_COOKIE, cookieUtils.createCleanRefreshTokenCookie().toString());
        SecurityContextHolder.clearContext();
    }

    @Override
    public AuthResponse getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return toAuthResponse(userDetails.getUser());
    }

    private AuthResponse toAuthResponse(User user) {
        UUID patientId = null;
        String displayName = user.getUsername();
        String phoneResult = user.getPhone();

        if (user.getRole() == Role.PATIENT) {
            Patient patient = user.getPatient();
            if (patient == null) {
                patient = patientRepository.findByUserId(user.getId())
                        .or(() -> (user.getCodeName() != null && !user.getCodeName().isEmpty())
                                ? patientRepository.findByPatientCode(user.getCodeName())
                                : java.util.Optional.empty())
                        .orElse(null);
            }

            if (patient != null) {
                patientId = patient.getId();
                if (patient.getFullName() != null && !patient.getFullName().trim().isEmpty()) {
                    displayName = patient.getFullName();
                }
                if (patient.getPhoneNumber() != null && !patient.getPhoneNumber().trim().isEmpty()) {
                    phoneResult = patient.getPhoneNumber().trim();
                }
            }
        }

        return new AuthResponse(
                user.getId(),
                user.getEmail(),
                displayName,
                user.getRole().name(),
                user.getAvatarUrl(),
                employeeRepository.findByUserId(user.getId())
                        .map(employee -> employee.getId())
                        .orElse(null),
                dentistRepository.findByUserId(user.getId())
                        .map(dentist -> dentist.getId())
                        .orElse(null),
                patientId,
                phoneResult);
    }

    private void validateAccountStatus(User user) {
        if (user.getStatus() == StatusUser.BLOCK) {
            throw new AppException(ErrorCode.ACCOUNT_LOCKED);
        }
        if (user.getStatus() == StatusUser.INACTIVE) {
            throw new AppException(ErrorCode.ACCOUNT_INACTIVE);
        }
    }

    private String extractTokenFromCookie(HttpServletRequest request, String cookieName) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookieName.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}

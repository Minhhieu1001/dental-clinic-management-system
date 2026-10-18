package iuh.fit.backend.auth.service;

import iuh.fit.backend.auth.dto.AuthResponse;
import iuh.fit.backend.auth.dto.LoginRequest;
import iuh.fit.backend.common.exception.AppException;
import iuh.fit.backend.common.exception.ErrorCode;
import iuh.fit.backend.common.security.*;
import iuh.fit.backend.user.entity.User;
import iuh.fit.backend.user.enums.StatusUser;
import iuh.fit.backend.user.repository.EmployeeRepository;
import iuh.fit.backend.user.repository.DentistRepository;
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
import org.springframework.stereotype.Service;

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

    @Override
    public AuthResponse login(LoginRequest request, HttpServletResponse response) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.email(),
                            request.password()));

            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            User user = userDetails.getUser();

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
        return new AuthResponse(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getRole().name(),
                user.getAvatarUrl(),
                employeeRepository.findByUserId(user.getId())
                        .map(employee -> employee.getId())
                        .orElse(null),
                dentistRepository.findByUserId(user.getId())
                        .map(dentist -> dentist.getId())
                        .orElse(null));
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

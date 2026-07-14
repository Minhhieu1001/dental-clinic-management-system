package iuh.fit.backend.common.security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CookieUtils {

    private final JwtProperties jwtProperties;

    @Value("${app.cookie.domain}")
    private String domain;

    @Value("${app.cookie.secure}")
    private boolean secure;

    @Value("${app.cookie.same-site}")
    private String sameSite;

    private static final String ACCESS_TOKEN_COOKIE = "access_token";
    private static final String REFRESH_TOKEN_COOKIE = "refresh_token";

    public ResponseCookie createAccessTokenCookie(String token) {
        return ResponseCookie.from(ACCESS_TOKEN_COOKIE, token)
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(jwtProperties.getAccessTokenExpirationMs() / 1000)
                .sameSite(sameSite)
                .build();
    }

    public ResponseCookie createRefreshTokenCookie(String token) {
        return ResponseCookie.from(REFRESH_TOKEN_COOKIE, token)
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(jwtProperties.getRefreshTokenExpirationMs() / 1000)
                .sameSite(sameSite)
                .build();
    }

    public ResponseCookie createCleanAccessTokenCookie() {
        return ResponseCookie.from(ACCESS_TOKEN_COOKIE, "")
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(0)
                .sameSite(sameSite)
                .build();
    }

    public ResponseCookie createCleanRefreshTokenCookie() {
        return ResponseCookie.from(REFRESH_TOKEN_COOKIE, "")
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(0)
                .sameSite(sameSite)
                .build();
    }
}

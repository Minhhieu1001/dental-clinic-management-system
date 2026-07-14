package iuh.fit.backend.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import iuh.fit.backend.common.response.ApiResponse;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException, ServletException {
        log.warn("Unauthorized request to: {} - {}", request.getRequestURI(), authException.getMessage());

        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.setStatus(HttpStatus.UNAUTHORIZED.value());

        ApiResponse<Void> apiResponse = ApiResponse.error(
                HttpStatus.UNAUTHORIZED.value(),
                "Chưa xác thực. Vui lòng đăng nhập"
        );

        objectMapper.findAndRegisterModules();
        objectMapper.writeValue(response.getOutputStream(), apiResponse);
    }
}

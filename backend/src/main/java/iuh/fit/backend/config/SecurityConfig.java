package iuh.fit.backend.config;

import iuh.fit.backend.common.security.JwtAccessDeniedHandler;
import iuh.fit.backend.common.security.JwtAuthenticationEntryPoint;
import iuh.fit.backend.common.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:8081}")
        private String[] allowedOrigins;

        private final JwtAuthenticationFilter jwtAuthenticationFilter;
        private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
        private final JwtAccessDeniedHandler jwtAccessDeniedHandler;

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration)
                        throws Exception {
                return authenticationConfiguration.getAuthenticationManager();
        }

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                http
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .csrf(AbstractHttpConfigurer::disable)
                                .exceptionHandling(exception -> exception
                                                .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                                                .accessDeniedHandler(jwtAccessDeniedHandler))
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(HttpMethod.POST,
                                                                "/api/v1/patient-relationships/request-otp",
                                                                "/api/v1/patient-relationships/verify")
                                                .hasAnyRole("PATIENT", "EMPLOYEE", "ADMIN")
                                                .requestMatchers(HttpMethod.GET,
                                                                "/api/v1/patient-relationships/patient/**")
                                                .hasAnyRole("PATIENT", "EMPLOYEE", "DENTIST", "ADMIN")
                                                .requestMatchers(HttpMethod.GET, "/api/v1/patient-relationships/linked")
                                                .hasAnyRole("EMPLOYEE", "DENTIST", "ADMIN")
                                                .requestMatchers(HttpMethod.DELETE, "/api/v1/patient-relationships/*")
                                                .hasAnyRole("PATIENT", "EMPLOYEE", "ADMIN")
                                                .requestMatchers(HttpMethod.GET, "/api/v1/patients", "/api/v1/medical-records")
                                                .hasAnyRole("ADMIN", "EMPLOYEE", "DENTIST")
                                                .requestMatchers("/api/v1/patient-relationships/**").hasRole("PATIENT")
                                                // Patients can read X-rays only through the endpoint that verifies record ownership.
                                                .requestMatchers(HttpMethod.GET, "/api/v1/ai/xray/patient-history").hasRole("PATIENT")
                                                // Other X-ray endpoints remain restricted to dentists and admins.
                                                .requestMatchers("/api/v1/ai/xray/**").hasAnyRole("DENTIST", "ADMIN")
                                                .requestMatchers(
                                                                "/api/v1/auth/login",
                                                                "/api/v1/auth/patient/login",
                                                                "/api/v1/auth/patient/activate",
                                                                "/api/v1/auth/patient/activate/resend",
                                                                "/api/v1/auth/patient/activate/verify",
                                                                "/api/v1/auth/patient/activate/complete",
                                                                "/api/v1/auth/patient/register",
                                                                "/api/v1/auth/patient/register/resend",
                                                                "/api/v1/auth/patient/register/verify",
                                                                "/api/v1/auth/forgot-password",
                                                                "/api/v1/auth/forgot-password/resend",
                                                                "/api/v1/auth/forgot-password/verify",
                                                                "/api/v1/auth/reset-password",
                                                                "/api/v1/auth/refresh",
                                                                "/api/services/**",
                                                                "/api/v1/services/**",
                                                                "/api/media/**",
                                                                "/api/v1/media/**",
                                                                "/uploads/**",
                                                                "/api/promotions/**",
                                                                "/api/v1/promotions/**",
                                                                "/api/dentists/**",
                                                                "/api/v1/dentists/**",
                                                                "/api/reviews/**",
                                                                "/api/v1/reviews/**",
                                                                "/api/appointments/**",
                                                                "/api/v1/appointments/**",
                                                                "/api/v1/public/appointments/**",
                                                                "/api/v1/patients/**",
                                                                "/api/v1/medical-records/**",
                                                                "/api/v1/examination-results/**",
                                                                "/api/v1/tooth-records/**",
                                                                "/api/v1/treatment-plans/**",
                                                                "/api/v1/medicines/**",
                                                                "/api/v1/prescriptions/**",
                                                                "/api/v1/follow-up-appointments/**",
                                                                "/api/v1/notifications/**",
                                                                "/api/v1/invoices/**",
                                                                "/api/invoices/**",
                                                                "/api/v1/payments/**",
                                                                "/api/v1/shift-closings/**",
                                                                "/api/v1/sms/**",
                                                                "/api/v1/data-fix/**",
                                                                "/v3/api-docs/**",
                                                                "/swagger-ui/**",
                                                                "/swagger-ui.html",
                                                                "/version.json",
                                                                "/favicon.ico",
                                                                "/icon/**",
                                                                "/api/v1/dashboard/**",
                                                                "/api/v1/admin/dashboard/**",
                                                                "/ws/**",
                                                                "/ws",
                                                                "/api/v1/ai/**",
                                                                "/api/v1/ocr/**",
                                                                "/api/v1/chat/**")
                                                .permitAll()
                                                .requestMatchers(HttpMethod.GET,
                                                                "/api/v1/clinics",
                                                                "/api/v1/clinics/**",
                                                                "/api/v1/branches",
                                                                "/api/v1/branches/**",
                                                                "/api/v1/primary-diagnoses/**",
                                                                "/api/v1/tooth-statuses/**")
                                                .permitAll()
                                                .requestMatchers("/api/v1/payment-transactions/**")
                                                .hasAnyRole("ADMIN", "EMPLOYEE")
                                                .requestMatchers(HttpMethod.POST, "/api/v1/appointmentrequest")
                                                .permitAll()
                                                .requestMatchers(HttpMethod.GET, "/api/v1/dentists/**")
                                                .permitAll()
                                                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                                                .requestMatchers("/api/v1/dentist/**").hasRole("DENTIST")
                                                .requestMatchers("/api/v1/employee/**").hasRole("EMPLOYEE")
                                                .requestMatchers("/api/v1/patient/**").hasRole("PATIENT")
                                                .anyRequest().authenticated())
                                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        @Bean
        CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();
                configuration.setAllowedOrigins(Arrays.asList(allowedOrigins));
                configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With",
                                "X-Client-Type", "X-Refresh-Token", "Accept", "Origin",
                                "Access-Control-Request-Method", "Access-Control-Request-Headers"));
                configuration.setExposedHeaders(
                                List.of("Access-Control-Allow-Origin", "Access-Control-Allow-Credentials"));
                configuration.setAllowCredentials(true);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }
}

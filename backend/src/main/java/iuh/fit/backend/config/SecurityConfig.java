package iuh.fit.backend.config;

import iuh.fit.backend.common.security.JwtAccessDeniedHandler;
import iuh.fit.backend.common.security.JwtAuthenticationEntryPoint;
import iuh.fit.backend.common.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
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

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final JwtAccessDeniedHandler jwtAccessDeniedHandler;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                        .accessDeniedHandler(jwtAccessDeniedHandler)
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/v1/auth/login",
                                "/api/v1/auth/patient/login",
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
                                "/api/dentists/**",
                                "/api/reviews/**",
                                "/api/appointments/**",
                                "/api/v1/appointments/**",
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
                                "/ws"
                        ).permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/clinics/**", "/api/v1/branches/**")
                        .permitAll()
                        .requestMatchers("/api/v1/payment-transactions/**")
                        .hasAnyRole("ADMIN", "EMPLOYEE")
                        .requestMatchers(HttpMethod.POST, "/api/v1/appointmentrequest").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/dentists/**")
                        .permitAll()
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/v1/dentist/**").hasRole("DENTIST")
                        .requestMatchers("/api/v1/employee/**").hasRole("EMPLOYEE")
                        .requestMatchers("/api/v1/patient/**").hasRole("PATIENT")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"));
        configuration.setExposedHeaders(List.of("Access-Control-Allow-Origin", "Access-Control-Allow-Credentials"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

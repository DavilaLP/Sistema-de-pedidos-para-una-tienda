package com.tienda.pedidos.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;

import java.time.LocalDateTime;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // API stateless: sin sesiones ni cookies, por eso CSRF no aplica
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .httpBasic(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/", "/error").permitAll()
                        // ADMIN y CLIENTE: consultar catálogo y pedidos, y crear pedidos
                        .requestMatchers(HttpMethod.GET, "/api/products/**", "/api/orders/**").hasAnyRole("ADMIN", "CLIENTE")
                        .requestMatchers(HttpMethod.POST, "/api/orders").hasAnyRole("ADMIN", "CLIENTE")
                        // Solo ADMIN: gestionar catálogo y ciclo de vida de pedidos
                        .requestMatchers("/api/products/**").hasRole("ADMIN")
                        .requestMatchers("/api/orders/**").hasRole("ADMIN")
                        // Todo lo demás: denegado por defecto
                        .anyRequest().denyAll())
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(unauthorizedHandler())
                        .accessDeniedHandler(forbiddenHandler()));
        return http.build();
    }

    /** 401: no se presentó autenticación válida. */
    private AuthenticationEntryPoint unauthorizedHandler() {
        return (request, response, ex) -> writeError(response, 401, "Unauthorized",
                "Autenticación requerida o credenciales inválidas");
    }

    /** 403: autenticado, pero sin el rol necesario. */
    private AccessDeniedHandler forbiddenHandler() {
        return (request, response, ex) -> writeError(response, 403, "Forbidden",
                "No tienes permisos para realizar esta acción");
    }

    private void writeError(HttpServletResponse response, int status, String error, String message)
            throws java.io.IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(String.format(
                "{\"timestamp\":\"%s\",\"status\":%d,\"error\":\"%s\",\"message\":\"%s\"}",
                LocalDateTime.now(), status, error, message));
    }
}

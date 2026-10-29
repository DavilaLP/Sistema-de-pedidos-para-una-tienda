package com.tienda.pedidos.config;

import com.tienda.pedidos.security.JwtAuthFilter;
import com.tienda.pedidos.security.JwtService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.time.LocalDateTime;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtService jwtService,
                                                   UserDetailsService userDetailsService) throws Exception {
        http
                // API stateless con JWT: sin sesiones ni cookies, por eso CSRF no aplica
                .csrf(AbstractHttpConfigurer::disable)
                // CORS: permitir peticiones desde el frontend React (localhost:5173)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        // Público: raíz, login y preflight CORS
                        .requestMatchers("/", "/error").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/login").permitAll()
                        // ADMIN y CLIENTE: ver el catálogo y crear pedidos
                        .requestMatchers(HttpMethod.GET, "/api/products/**").hasAnyRole("ADMIN", "CLIENTE")
                        .requestMatchers(HttpMethod.POST, "/api/orders").hasAnyRole("ADMIN", "CLIENTE")
                        // Solo ADMIN: gestionar catálogo y consultar/administrar todos los pedidos
                        .requestMatchers("/api/products/**").hasRole("ADMIN")
                        .requestMatchers("/api/orders/**").hasRole("ADMIN")
                        // Todo lo demás: denegado por defecto
                        .anyRequest().denyAll())
                .addFilterBefore(new JwtAuthFilter(jwtService, userDetailsService),
                        UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(unauthorizedHandler())
                        .accessDeniedHandler(forbiddenHandler()));
        return http.build();
    }

    /** CORS: permite al frontend React (localhost:5173) llamar al backend. */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    /** 401: no se presentó autenticación válida. */
    private AuthenticationEntryPoint unauthorizedHandler() {
        return (request, response, ex) -> writeError(response, 401, "Unauthorized",
                "Autenticación requerida o token inválido");
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

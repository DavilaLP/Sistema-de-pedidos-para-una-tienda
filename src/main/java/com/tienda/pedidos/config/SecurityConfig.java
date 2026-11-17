
package com.tienda.pedidos.config;

import com.tienda.pedidos.security.JwtAuthFilter;
import com.tienda.pedidos.security.JwtService;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
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

import org.springframework.boot.autoconfigure.security.servlet.PathRequest;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.time.LocalDateTime;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // Cifrado de contraseñas
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Administrador de autenticación
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config
    ) throws Exception {
        return config.getAuthenticationManager();
    }

    // ==========================================
    // SEGURIDAD DE H2 CONSOLE
    // Solo disponible con el perfil "h2"
    // ==========================================

    @Bean
    @Profile("h2")
    @Order(1)
    public SecurityFilterChain h2ConsoleSecurityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
            .securityMatcher(
                PathRequest.toH2Console()
            )
            .authorizeHttpRequests(auth ->
                auth.anyRequest().permitAll()
            )
            .csrf(AbstractHttpConfigurer::disable)
            .headers(headers ->
                headers.frameOptions(frame ->
                    frame.sameOrigin()
                )
            );

        return http.build();
    }

    // ==========================================
    // SEGURIDAD PRINCIPAL DE LA API
    // Autenticación mediante JWT
    // ==========================================

    @Bean
    @Order(2)
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtService jwtService,
            UserDetailsService userDetailsService
    ) throws Exception {

        http
            // API REST sin sesiones
            .csrf(AbstractHttpConfigurer::disable)

            // Permitir comunicación con React
            .cors(cors ->
                cors.configurationSource(
                    corsConfigurationSource()
                )
            )

            // JWT: sesiones stateless
            .sessionManagement(session ->
                session.sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
                )
            )

            .httpBasic(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable)

            // Permisos de acceso
            .authorizeHttpRequests(auth -> auth

                // Rutas públicas
                .requestMatchers(
                    "/",
                    "/error"
                ).permitAll()

                // Peticiones CORS
                .requestMatchers(
                    HttpMethod.OPTIONS,
                    "/**"
                ).permitAll()

                // Inicio de sesión
                .requestMatchers(
                    HttpMethod.POST,
                    "/auth/login"
                ).permitAll()

                // ADMIN y CLIENTE pueden ver productos
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/products/**"
                ).hasAnyRole(
                    "ADMIN",
                    "CLIENTE"
                )

                // ADMIN y CLIENTE pueden crear pedidos
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/orders"
                ).hasAnyRole(
                    "ADMIN",
                    "CLIENTE"
                )

                // Solo ADMIN administra productos
                .requestMatchers(
                    "/api/products/**"
                ).hasRole("ADMIN")

                // Solo ADMIN administra pedidos
                .requestMatchers(
                    "/api/orders/**"
                ).hasRole("ADMIN")

                // Denegar cualquier otra ruta
                .anyRequest().denyAll()
            )

            // Filtro de autenticación JWT
            .addFilterBefore(
                new JwtAuthFilter(
                    jwtService,
                    userDetailsService
                ),
                UsernamePasswordAuthenticationFilter.class
            )

            // Manejo de errores 401 y 403
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(
                    unauthorizedHandler()
                )
                .accessDeniedHandler(
                    forbiddenHandler()
                )
            );

        return http.build();
    }

    // ==========================================
    // CONFIGURACIÓN CORS
    // ==========================================

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config =
                new CorsConfiguration();

        config.setAllowedOrigins(
            List.of("http://localhost:5173")
        );

        config.setAllowedMethods(
            List.of(
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "OPTIONS"
            )
        );

        config.setAllowedHeaders(
            List.of("*")
        );

        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
            "/**",
            config
        );

        return source;
    }

    // ==========================================
    // ERROR 401 - NO AUTORIZADO
    // ==========================================

    private AuthenticationEntryPoint unauthorizedHandler() {

        return (request, response, ex) ->
            writeError(
                response,
                401,
                "Unauthorized",
                "Autenticación requerida o token inválido"
            );
    }

    // ==========================================
    // ERROR 403 - ACCESO PROHIBIDO
    // ==========================================

    private AccessDeniedHandler forbiddenHandler() {

        return (request, response, ex) ->
            writeError(
                response,
                403,
                "Forbidden",
                "No tienes permisos para realizar esta acción"
            );
    }

    // ==========================================
    // RESPUESTAS JSON DE ERROR
    // ==========================================

    private void writeError(
            HttpServletResponse response,
            int status,
            String error,
            String message
    ) throws java.io.IOException {

        response.setStatus(status);

        response.setContentType(
            MediaType.APPLICATION_JSON_VALUE
        );

        response.setCharacterEncoding("UTF-8");

        response.getWriter().write(
            String.format(
                "{\"timestamp\":\"%s\"," +
                "\"status\":%d," +
                "\"error\":\"%s\"," +
                "\"message\":\"%s\"}",
                LocalDateTime.now(),
                status,
                error,
                message
            )
        );
    }
}

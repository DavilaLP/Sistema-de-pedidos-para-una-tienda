package com.tienda.pedidos.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Login JWT y control de acceso por rol con usuarios reales (H2): 200/201 permitido, 401 sin token válido, 403 sin permiso. */
@SpringBootTest
@AutoConfigureMockMvc
class SecurityAccessTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Value("${jwt.secret}") private String jwtSecret;

    private static final String PRODUCT_JSON = "{\"name\":\"Monitor\",\"price\":300,\"stock\":5}";

    private String login(String username, String password) throws Exception {
        String body = objectMapper.writeValueAsString(java.util.Map.of("username", username, "password", password));
        String response = mockMvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String token = objectMapper.readTree(response).get("token").asText();
        assertNotNull(token);
        return "Bearer " + token;
    }

    private String adminToken() throws Exception { return login("admin", "test-admin-pass"); }
    private String clienteToken() throws Exception { return login("cliente", "test-cliente-pass"); }

    private String tokenWithKey(String key, String user, long expiresInMs) {
        SecretKey k = Keys.hmacShaKeyFor(key.getBytes(StandardCharsets.UTF_8));
        long now = System.currentTimeMillis();
        return "Bearer " + Jwts.builder().subject(user).claim("role", "ADMIN")
                .issuedAt(new Date(now - 10_000))
                .expiration(new Date(now + expiresInMs))
                .signWith(k, Jwts.SIG.HS256).compact();
    }

    // ---------- Login ----------

    @Test
    void login_correcto_devuelveTokenBearer() throws Exception {
        String body = "{\"username\":\"admin\",\"password\":\"test-admin-pass\"}";
        mockMvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    void login_conPasswordIncorrecta_devuelve401() throws Exception {
        mockMvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"incorrecta\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Credenciales inválidas"));
    }

    @Test
    void login_conUsuarioInexistente_devuelve401() throws Exception {
        mockMvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"fantasma\",\"password\":\"x\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_conInyeccionSql_devuelve401_noError500() throws Exception {
        mockMvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin' OR '1'='1' --\",\"password\":\"' OR '1'='1\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_conCamposVacios_devuelve400() throws Exception {
        mockMvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"\",\"password\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    // ---------- 401: sin token válido ----------

    @Test
    void sinToken_devuelve401() throws Exception {
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void tokenBasura_devuelve401() throws Exception {
        mockMvc.perform(get("/api/products").header("Authorization", "Bearer esto.no.es.un.jwt"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tokenFirmadoConOtraClave_devuelve401() throws Exception {
        String forged = tokenWithKey("otra-clave-falsa-de-atacante-0123456789-abcdef", "admin", 60_000);
        mockMvc.perform(get("/api/products").header("Authorization", forged))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tokenVencido_devuelve401() throws Exception {
        String expired = tokenWithKey(jwtSecret, "admin", -5_000);
        mockMvc.perform(get("/api/products").header("Authorization", expired))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tokenDeUsuarioInexistente_devuelve401() throws Exception {
        String ghost = tokenWithKey(jwtSecret, "usuario-borrado", 60_000);
        mockMvc.perform(get("/api/products").header("Authorization", ghost))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void httpBasic_yaNoSeAcepta_devuelve401() throws Exception {
        mockMvc.perform(get("/api/products").header("Authorization", "Basic YWRtaW46dGVzdC1hZG1pbi1wYXNz"))
                .andExpect(status().isUnauthorized());
    }

    // ---------- 200 / 201: rol permitido ----------

    @Test
    void cliente_puedeVerProductos_200() throws Exception {
        mockMvc.perform(get("/api/products").header("Authorization", clienteToken()))
                .andExpect(status().isOk());
    }

    @Test
    void admin_puedeCrearProductos_201() throws Exception {
        mockMvc.perform(post("/api/products").header("Authorization", adminToken())
                        .contentType(MediaType.APPLICATION_JSON).content(PRODUCT_JSON))
                .andExpect(status().isCreated());
    }

    @Test
    void admin_puedeVerPedidos_200() throws Exception {
        mockMvc.perform(get("/api/orders").header("Authorization", adminToken()))
                .andExpect(status().isOk());
    }

    // ---------- 403: autenticado pero sin permiso ----------

    @Test
    void cliente_noPuedeCrearProductos_403() throws Exception {
        mockMvc.perform(post("/api/products").header("Authorization", clienteToken())
                        .contentType(MediaType.APPLICATION_JSON).content(PRODUCT_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    void cliente_noPuedeEliminarProductos_403() throws Exception {
        mockMvc.perform(delete("/api/products/1").header("Authorization", clienteToken()))
                .andExpect(status().isForbidden());
    }

    @Test
    void cliente_noPuedeVerListaDePedidos_403() throws Exception {
        mockMvc.perform(get("/api/orders").header("Authorization", clienteToken()))
                .andExpect(status().isForbidden());
    }

    @Test
    void cliente_noPuedeCancelarPedidos_403() throws Exception {
        mockMvc.perform(post("/api/orders/1/cancel").header("Authorization", clienteToken()))
                .andExpect(status().isForbidden());
    }

    // ---------- Público ----------

    @Test
    void rutaRaiz_esPublica() throws Exception {
        mockMvc.perform(get("/")).andExpect(status().isOk());
    }
}

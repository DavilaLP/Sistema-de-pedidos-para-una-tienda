package com.tienda.pedidos.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Control de acceso por rol con usuarios reales (H2): 200 permitido, 401 sin credenciales, 403 sin permiso. */
@SpringBootTest
@AutoConfigureMockMvc
class SecurityAccessTest {

    @Autowired private MockMvc mockMvc;

    @Test
    void sinCredenciales_devuelve401() throws Exception {
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void credencialesInvalidas_devuelve401() throws Exception {
        mockMvc.perform(get("/api/products").with(httpBasic("admin", "clave-incorrecta")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void cliente_puedeVerProductos_200() throws Exception {
        mockMvc.perform(get("/api/products").with(httpBasic("cliente", "test-cliente-pass")))
                .andExpect(status().isOk());
    }

    @Test
    void cliente_noPuedeCrearProductos_403() throws Exception {
        mockMvc.perform(post("/api/products").with(httpBasic("cliente", "test-cliente-pass"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"X\",\"price\":1,\"stock\":1}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    void cliente_noPuedeEliminarProductos_403() throws Exception {
        mockMvc.perform(delete("/api/products/1").with(httpBasic("cliente", "test-cliente-pass")))
                .andExpect(status().isForbidden());
    }

    @Test
    void admin_puedeCrearProductos_201() throws Exception {
        mockMvc.perform(post("/api/products").with(httpBasic("admin", "test-admin-pass"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Monitor\",\"price\":300,\"stock\":5}"))
                .andExpect(status().isCreated());
    }

    @Test
    void rutaRaiz_esPublica() throws Exception {
        mockMvc.perform(get("/")).andExpect(status().isOk());
    }
}

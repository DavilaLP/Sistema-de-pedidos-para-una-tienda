package com.tienda.pedidos.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tienda.pedidos.model.Order;
import com.tienda.pedidos.model.OrderItem;
import com.tienda.pedidos.model.Product;
import com.tienda.pedidos.service.OrderService;
import com.tienda.pedidos.service.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class ValidationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProductService productService;

    @MockBean
    private OrderService orderService;

    @Test
    @WithMockUser(roles = "ADMIN")
    public void createProduct_WhenInvalid_ShouldReturnBadRequest() throws Exception {
        Product invalidProduct = Product.builder()
                .name("") // NotBlank
                .price(-10.0) // Positive
                .stock(-5) // Min(0)
                .build();

        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidProduct)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Error"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("El nombre del producto no puede estar vacío")))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("El precio debe ser un valor positivo")))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("El stock no puede ser negativo")));
    }

    @Test
    @WithMockUser(roles = "CLIENTE")
    public void createOrder_WhenInvalid_ShouldReturnBadRequest() throws Exception {
        Order invalidOrder = Order.builder()
                .clientName("") // NotBlank
                .items(new ArrayList<>()) // NotEmpty
                .build();

        mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidOrder)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Error"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("El nombre del cliente no puede estar vacío")))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("El pedido debe contener al menos un producto")));
    }

    @Test
    @WithMockUser(roles = "CLIENTE")
    public void createOrder_WhenItemInvalid_ShouldReturnBadRequest() throws Exception {
        OrderItem invalidItem = OrderItem.builder()
                .productId(null) // NotNull
                .quantity(0) // Positive
                .build();

        Order order = Order.builder()
                .clientName("Test Client")
                .items(java.util.List.of(invalidItem))
                .build();

        mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(order)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Error"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("El ID del producto es obligatorio")))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("La cantidad debe ser mayor que cero")));
    }
}

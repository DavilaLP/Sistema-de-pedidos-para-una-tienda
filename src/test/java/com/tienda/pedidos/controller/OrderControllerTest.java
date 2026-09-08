package com.tienda.pedidos.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tienda.pedidos.exception.InsufficientStockException;
import com.tienda.pedidos.model.Order;
import com.tienda.pedidos.model.OrderItem;
import com.tienda.pedidos.service.OrderService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(OrderController.class)
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OrderService orderService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testCreateOrder_Success_Returns201() throws Exception {
        // Arrange
        OrderItem item = OrderItem.builder()
                .productId(1L)
                .quantity(2)
                .build();

        Order orderRequest = Order.builder()
                .clientName("Maria Gomez")
                .items(Collections.singletonList(item))
                .build();

        Order savedOrder = Order.builder()
                .id(1L)
                .clientName("Maria Gomez")
                .items(Collections.singletonList(item))
                .total(100.0)
                .status("PENDIENTE")
                .build();

        when(orderService.createOrder(any(Order.class))).thenReturn(savedOrder);

        // Act & Assert
        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.clientName").value("Maria Gomez"))
                .andExpect(jsonPath("$.total").value(100.0))
                .andExpect(jsonPath("$.status").value("PENDIENTE"));
    }

    @Test
    void testCreateOrder_InsufficientStock_Returns400() throws Exception {
        // Arrange
        OrderItem item = OrderItem.builder()
                .productId(1L)
                .quantity(10)
                .build();

        Order orderRequest = Order.builder()
                .clientName("Maria Gomez")
                .items(Collections.singletonList(item))
                .build();

        when(orderService.createOrder(any(Order.class)))
                .thenThrow(new InsufficientStockException("Stock insuficiente para el producto solicitado"));

        // Act & Assert
        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Stock insuficiente para el producto solicitado"));
    }
}

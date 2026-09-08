package com.tienda.pedidos.service;

import com.tienda.pedidos.exception.InsufficientStockException;
import com.tienda.pedidos.model.Order;
import com.tienda.pedidos.model.OrderItem;
import com.tienda.pedidos.model.Product;
import com.tienda.pedidos.repository.OrderRepository;
import com.tienda.pedidos.repository.ProductRepository;
import com.tienda.pedidos.service.impl.OrderServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private OrderServiceImpl orderService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testCreateOrder_Success() {
        // Arrange
        Product product = Product.builder()
                .id(1L)
                .name("Producto Demo")
                .price(50.0)
                .stock(10)
                .build();

        OrderItem item = OrderItem.builder()
                .productId(1L)
                .quantity(3)
                .build();

        Order orderRequest = Order.builder()
                .clientName("Juan Perez")
                .items(Collections.singletonList(item))
                .build();

        Order savedOrder = Order.builder()
                .id(1L)
                .clientName("Juan Perez")
                .items(Collections.singletonList(item))
                .total(150.0)
                .status("PENDIENTE")
                .build();

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);

        // Act
        Order result = orderService.createOrder(orderRequest);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals(150.0, result.getTotal());
        assertEquals("PENDIENTE", result.getStatus());
        assertEquals(7, product.getStock()); // Verificamos que se restó el stock del producto

        verify(productRepository, times(1)).save(product);
        verify(orderRepository, times(1)).save(orderRequest);
    }

    @Test
    void testCreateOrder_InsufficientStock() {
        // Arrange
        Product product = Product.builder()
                .id(1L)
                .name("Producto Demo")
                .price(50.0)
                .stock(2) // Stock es 2, pero solicitamos 5
                .build();

        OrderItem item = OrderItem.builder()
                .productId(1L)
                .quantity(5)
                .build();

        Order orderRequest = Order.builder()
                .clientName("Juan Perez")
                .items(Collections.singletonList(item))
                .build();

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        // Act & Assert
        InsufficientStockException exception = assertThrows(InsufficientStockException.class, () -> {
            orderService.createOrder(orderRequest);
        });

        assertTrue(exception.getMessage().contains("Stock insuficiente"));
        assertEquals(2, product.getStock()); // El stock no debió haber cambiado

        verify(productRepository, never()).save(any(Product.class));
        verify(orderRepository, never()).save(any(Order.class));
    }
}

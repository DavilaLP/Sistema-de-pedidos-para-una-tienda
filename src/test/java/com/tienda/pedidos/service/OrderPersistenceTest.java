package com.tienda.pedidos.service;

import com.tienda.pedidos.exception.InsufficientStockException;
import com.tienda.pedidos.model.Order;
import com.tienda.pedidos.model.OrderItem;
import com.tienda.pedidos.model.Product;
import com.tienda.pedidos.repository.OrderRepository;
import com.tienda.pedidos.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/** Pruebas de integración contra H2 en memoria: persistencia real, JPQL y rollback transaccional. */
@SpringBootTest
class OrderPersistenceTest {

    @Autowired private OrderService orderService;
    @Autowired private OrderRepository orderRepository;
    @Autowired private ProductRepository productRepository;

    private Product laptop;
    private Product mouse;

    @BeforeEach
    void setUp() {
        orderRepository.deleteAll();
        productRepository.deleteAll();
        laptop = productRepository.save(Product.builder().name("Laptop").price(1000.0).stock(5).build());
        mouse = productRepository.save(Product.builder().name("Mouse").price(50.0).stock(2).build());
    }

    private Order orderWith(OrderItem... items) {
        return Order.builder().clientName("Cliente Test").items(new ArrayList<>(List.of(items))).build();
    }

    private OrderItem item(Product p, int qty) {
        return OrderItem.builder().productId(p.getId()).quantity(qty).build();
    }

    @Test
    void createOrder_persisteYDescuentaStock() {
        Order saved = orderService.createOrder(orderWith(item(laptop, 2)));

        assertNotNull(saved.getId());
        assertEquals(2000.0, saved.getTotal());
        assertEquals(3, productRepository.findById(laptop.getId()).orElseThrow().getStock());
        assertEquals(1, orderService.getOrderById(saved.getId()).getItems().size());
    }

    @Test
    void createOrder_conFalloALaMitad_hacerRollbackDelStock() {
        // laptop alcanza (2 de 5) pero mouse no (3 de 2): debe revertirse TAMBIÉN el stock de laptop
        assertThrows(InsufficientStockException.class,
                () -> orderService.createOrder(orderWith(item(laptop, 2), item(mouse, 3))));

        assertEquals(5, productRepository.findById(laptop.getId()).orElseThrow().getStock());
        assertEquals(2, productRepository.findById(mouse.getId()).orElseThrow().getStock());
        assertEquals(0, orderRepository.count());
    }

    @Test
    void cancelOrder_reponeStock() {
        Order saved = orderService.createOrder(orderWith(item(laptop, 2)));
        orderService.cancelOrder(saved.getId());

        assertEquals(5, productRepository.findById(laptop.getId()).orElseThrow().getStock());
        assertEquals("CANCELADO", orderService.getOrderById(saved.getId()).getStatus());
    }

    @Test
    void jpql_filtraPedidosPorEstado() {
        Order a = orderService.createOrder(orderWith(item(laptop, 1)));
        orderService.createOrder(orderWith(item(mouse, 1)));
        orderService.updateOrderStatus(a.getId(), "pagado");

        assertEquals(1, orderService.getOrdersByStatus("PAGADO").size());
        assertEquals(1, orderService.getOrdersByStatus("PENDIENTE").size());
        assertEquals(0, orderService.getOrdersByStatus("CANCELADO").size());
    }

    @Test
    void jpql_inyeccionEnEstado_esRechazada() {
        assertThrows(IllegalArgumentException.class,
                () -> orderService.getOrdersByStatus("PENDIENTE' OR '1'='1"));
        assertTrue(orderRepository.findByStatusWithItems("PENDIENTE' OR '1'='1").isEmpty());
    }

    @Test
    void updateOrderStatus_rechazaEstadoInvalido() {
        Order saved = orderService.createOrder(orderWith(item(laptop, 1)));
        assertThrows(IllegalArgumentException.class,
                () -> orderService.updateOrderStatus(saved.getId(), "HACKEADO"));
    }
}

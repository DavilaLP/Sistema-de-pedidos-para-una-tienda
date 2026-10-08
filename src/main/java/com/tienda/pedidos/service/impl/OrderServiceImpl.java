package com.tienda.pedidos.service.impl;

import com.tienda.pedidos.exception.InsufficientStockException;
import com.tienda.pedidos.exception.ResourceNotFoundException;
import com.tienda.pedidos.model.Order;
import com.tienda.pedidos.model.OrderItem;
import com.tienda.pedidos.model.Product;
import com.tienda.pedidos.repository.OrderRepository;
import com.tienda.pedidos.repository.ProductRepository;
import com.tienda.pedidos.service.OrderService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
public class OrderServiceImpl implements OrderService {

    private static final Set<String> VALID_STATUSES = Set.of("PENDIENTE", "PAGADO", "CANCELADO");

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    // Inyección por constructor explícita
    public OrderServiceImpl(OrderRepository orderRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Order> getOrdersByStatus(String status) {
        return orderRepository.findByStatusWithItems(normalizeStatus(status));
    }

    @Override
    @Transactional(readOnly = true)
    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado con ID: " + id));
    }

    private String normalizeStatus(String status) {
        String normalized = status == null ? "" : status.trim().toUpperCase();
        if (!VALID_STATUSES.contains(normalized)) {
            throw new IllegalArgumentException("Estado inválido. Valores permitidos: PENDIENTE, PAGADO, CANCELADO");
        }
        return normalized;
    }

    /**
     * Transacción atómica: descuenta stock de varios productos y guarda el pedido.
     * Si falla cualquier ítem (stock insuficiente, producto inexistente), se hace
     * ROLLBACK de todo y no queda stock descontado a medias.
     */
    @Override
    @Transactional
    public Order createOrder(Order order) {
        if (order.getItems() == null || order.getItems().isEmpty()) {
            throw new IllegalArgumentException("El pedido debe contener al menos un producto.");
        }

        order.setId(null); // nunca aceptar un id enviado por el cliente
        order.setOrderDate(LocalDateTime.now());
        order.setStatus("PENDIENTE");

        double total = 0.0;

        // Validar stock y calcular total
        for (OrderItem item : order.getItems()) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con ID: " + item.getProductId()));

            if (product.getStock() < item.getQuantity()) {
                throw new InsufficientStockException("Stock insuficiente para el producto: " + product.getName()
                        + " (Disponible: " + product.getStock() + ", Solicitado: " + item.getQuantity() + ")");
            }

            // Descontar stock
            product.setStock(product.getStock() - item.getQuantity());
            productRepository.save(product);

            // Completar detalles del ítem y vincularlo a su pedido
            item.setId(null);
            item.setOrder(order);
            item.setProductName(product.getName());
            item.setUnitPrice(product.getPrice());

            total += item.getQuantity() * product.getPrice();
        }

        order.setTotal(total);
        return orderRepository.save(order);
    }

    @Override
    @Transactional
    public Order updateOrderStatus(Long id, String status) {
        Order order = getOrderById(id);
        order.setStatus(normalizeStatus(status));
        return orderRepository.save(order);
    }

    /** Transacción: repone el stock de todos los ítems y marca el pedido CANCELADO como una sola unidad. */
    @Override
    @Transactional
    public void cancelOrder(Long id) {
        Order order = getOrderById(id);

        if ("CANCELADO".equalsIgnoreCase(order.getStatus())) {
            return; // Ya cancelado
        }

        // Devolver el stock
        for (OrderItem item : order.getItems()) {
            productRepository.findById(item.getProductId()).ifPresent(product -> {
                product.setStock(product.getStock() + item.getQuantity());
                productRepository.save(product);
            });
        }

        order.setStatus("CANCELADO");
        orderRepository.save(order);
    }
}

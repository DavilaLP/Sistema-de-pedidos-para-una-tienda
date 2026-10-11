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

    private static final Set<String> VALID_STATUSES =
            Set.of("PENDIENTE", "PAGADO", "CANCELADO");

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public OrderServiceImpl(
            OrderRepository orderRepository,
            ProductRepository productRepository
    ) {
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
        return orderRepository.findByStatusWithItems(
                normalizeStatus(status)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Pedido no encontrado con ID: " + id
                ));
    }

    private String normalizeStatus(String status) {
        String normalized = status == null
                ? ""
                : status.trim().toUpperCase(java.util.Locale.ROOT);

        if (!VALID_STATUSES.contains(normalized)) {
            throw new IllegalArgumentException(
                    "Estado inválido. Valores permitidos: "
                            + "PENDIENTE, PAGADO, CANCELADO"
            );
        }

        return normalized;
    }

    /**
     * Descuenta el stock y guarda el pedido en una sola transacción.
     * Si falla algún ítem, se revierten todos los cambios.
     */
    @Override
    @Transactional
    public Order createOrder(Order order) {
        if (order.getItems() == null || order.getItems().isEmpty()) {
            throw new IllegalArgumentException(
                    "El pedido debe contener al menos un producto."
            );
        }

        order.setId(null);
        order.setOrderDate(LocalDateTime.now());
        order.setStatus("PENDIENTE");

        double total = 0.0;

        for (OrderItem item : order.getItems()) {
            Product product = productRepository
                    .findById(item.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Producto no encontrado con ID: "
                                    + item.getProductId()
                    ));

            if (product.getStock() < item.getQuantity()) {
                throw new InsufficientStockException(
                        "Stock insuficiente para el producto: "
                                + product.getName()
                                + " (Disponible: " + product.getStock()
                                + ", Solicitado: " + item.getQuantity()
                                + ")"
                );
            }

            product.setStock(
                    product.getStock() - item.getQuantity()
            );
            productRepository.save(product);

            item.setId(null);
            item.setOrder(order);
            item.setProductName(product.getName());
            item.setUnitPrice(product.getPrice());

            total += item.getQuantity() * product.getPrice();
        }

        order.setTotal(total);
        return orderRepository.save(order);
    }

    /**
     * Cambia el estado del pedido.
     * Si se solicita CANCELADO, devuelve también el stock.
     * Los pedidos cancelados no pueden reactivarse.
     */
    @Override
    @Transactional
    public Order updateOrderStatus(Long id, String status) {
        String normalizedStatus = normalizeStatus(status);
        Order order = getOrderById(id);

        if ("CANCELADO".equals(normalizedStatus)) {
            cancelOrder(id);
            return getOrderById(id);
        }

        if ("CANCELADO".equalsIgnoreCase(order.getStatus())) {
            throw new IllegalArgumentException(
                    "No se puede cambiar el estado de un pedido cancelado."
            );
        }

        order.setStatus(normalizedStatus);
        return orderRepository.save(order);
    }

    /**
     * Devuelve el stock y marca el pedido como CANCELADO.
     * Si ya estaba cancelado, no vuelve a devolver el stock.
     */
    @Override
    @Transactional
    public void cancelOrder(Long id) {
        Order order = getOrderById(id);

        if ("CANCELADO".equalsIgnoreCase(order.getStatus())) {
            return;
        }

        for (OrderItem item : order.getItems()) {
            productRepository.findById(item.getProductId())
                    .ifPresent(product -> {
                        product.setStock(
                                product.getStock() + item.getQuantity()
                        );
                        productRepository.save(product);
                    });
        }

        order.setStatus("CANCELADO");
        orderRepository.save(order);
    }
}

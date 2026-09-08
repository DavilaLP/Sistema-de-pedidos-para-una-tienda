package com.tienda.pedidos.service;

import com.tienda.pedidos.model.Order;

import java.util.List;

public interface OrderService {
    List<Order> getAllOrders();
    Order getOrderById(Long id);
    Order createOrder(Order order);
    Order updateOrderStatus(Long id, String status);
    void cancelOrder(Long id);
}

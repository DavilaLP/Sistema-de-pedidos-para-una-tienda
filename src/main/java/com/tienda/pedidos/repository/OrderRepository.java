package com.tienda.pedidos.repository;

import com.tienda.pedidos.model.Order;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    /**
     * Consulta JPQL de negocio: pedidos por estado (PENDIENTE, PAGADO, CANCELADO),
     * del más reciente al más antiguo. Usa parámetro nombrado (no concatena texto),
     * por lo que es inmune a inyección SQL. JOIN FETCH carga los ítems en la misma consulta.
     */
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items " +
           "WHERE o.status = :status ORDER BY o.orderDate DESC")
    List<Order> findByStatusWithItems(@Param("status") String status);

    @Override
    @EntityGraph(attributePaths = "items")
    List<Order> findAll();

    @Override
    @EntityGraph(attributePaths = "items")
    Optional<Order> findById(Long id);
}

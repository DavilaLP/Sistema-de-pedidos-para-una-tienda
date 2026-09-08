package com.tienda.pedidos.repository.impl;

import com.tienda.pedidos.model.Product;
import com.tienda.pedidos.repository.ProductRepository;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Repository
public class InMemoryProductRepository implements ProductRepository {

    private final Map<Long, Product> products = new ConcurrentHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(1);

    public InMemoryProductRepository() {
        // Inicializar catálogo inicial con productos semilla
        save(Product.builder().name("Laptop Gamer").price(1200.0).stock(15).build());
        save(Product.builder().name("Teclado Mecánico RGB").price(85.0).stock(30).build());
        save(Product.builder().name("Mouse Inalámbrico").price(45.0).stock(50).build());
        save(Product.builder().name("Auriculares Gamer con Micro").price(120.0).stock(20).build());
    }

    @Override
    public List<Product> findAll() {
        return new ArrayList<>(products.values());
    }

    @Override
    public Optional<Product> findById(Long id) {
        return Optional.ofNullable(products.get(id));
    }

    @Override
    public Product save(Product product) {
        if (product.getId() == null) {
            product.setId(idGenerator.getAndIncrement());
        }
        products.put(product.getId(), product);
        return product;
    }

    @Override
    public void deleteById(Long id) {
        products.remove(id);
    }
}

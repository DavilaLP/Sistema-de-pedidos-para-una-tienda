package com.tienda.pedidos.config;

import com.tienda.pedidos.model.Product;
import com.tienda.pedidos.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.util.List;

@Configuration
@Profile("!test")
public class DataInitializer {

    @Bean
    CommandLineRunner seedProducts(ProductRepository productRepository) {
        return args -> {
            if (productRepository.count() == 0) {
                productRepository.saveAll(List.of(
                        Product.builder().name("Laptop Gamer").price(1200.0).stock(15).build(),
                        Product.builder().name("Teclado Mecánico RGB").price(85.0).stock(30).build(),
                        Product.builder().name("Mouse Inalámbrico").price(45.0).stock(50).build(),
                        Product.builder().name("Auriculares Gamer con Micro").price(120.0).stock(20).build()
                ));
            }
        };
    }
}

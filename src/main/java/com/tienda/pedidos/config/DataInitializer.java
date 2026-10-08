package com.tienda.pedidos.config;

import com.tienda.pedidos.model.Product;
import com.tienda.pedidos.model.Role;
import com.tienda.pedidos.model.User;
import com.tienda.pedidos.repository.ProductRepository;
import com.tienda.pedidos.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Configuration
@Profile("!test")
public class DataInitializer {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

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

    /**
     * Crea los usuarios de prueba solo si no existen y solo si su contraseña fue definida
     * por variable de entorno (ADMIN_PASSWORD / CLIENTE_PASSWORD). Se guarda el hash BCrypt.
     */
    @Bean
    CommandLineRunner seedUsers(UserRepository userRepository, PasswordEncoder encoder,
                                @Value("${app.seed.admin-password:}") String adminPassword,
                                @Value("${app.seed.cliente-password:}") String clientePassword) {
        return args -> {
            createIfMissing(userRepository, encoder, "admin", adminPassword, Role.ADMIN);
            createIfMissing(userRepository, encoder, "cliente", clientePassword, Role.CLIENTE);
        };
    }

    private void createIfMissing(UserRepository repo, PasswordEncoder encoder,
                                 String username, String rawPassword, Role role) {
        if (rawPassword == null || rawPassword.isBlank()) {
            log.warn("Usuario '{}' NO procesado: falta definir su contraseña", username);
            return;
        }
        
        repo.findByUsername(username).ifPresentOrElse(
            user -> {
                // Si existe, actualizamos la contraseña para asegurarnos de que coincida con el properties actual
                user.setPassword(encoder.encode(rawPassword));
                repo.save(user);
                log.info("Contraseña del usuario '{}' actualizada a la configuración actual", username);
            },
            () -> {
                // Si no existe, lo creamos
                repo.save(User.builder().username(username).password(encoder.encode(rawPassword)).role(role).build());
                log.info("Usuario '{}' creado con rol {}", username, role);
            }
        );
    }
}

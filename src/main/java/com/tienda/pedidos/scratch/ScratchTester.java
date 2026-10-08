package com.tienda.pedidos.scratch;

import com.tienda.pedidos.model.User;
import com.tienda.pedidos.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class ScratchTester implements CommandLineRunner {

    @Autowired
    UserRepository repo;
    
    @Autowired
    PasswordEncoder encoder;

    @Override
    public void run(String... args) throws Exception {
        User u = repo.findByUsername("admin").orElse(null);
        if (u != null) {
            System.out.println("====== DB PASSWORD HASH: " + u.getPassword());
            boolean match = encoder.matches("admin123", u.getPassword());
            System.out.println("====== MATCHES 'admin123'? " + match);
        } else {
            System.out.println("====== ADMIN NOT FOUND IN DB!");
        }
    }
}

package com.tienda.pedidos.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class RootController {

    @GetMapping("/")
    public Map<String, Object> home() {
        return Map.of(
                "estado", "Online / Activo",
                "sistema", "Sistema de Gestión de Inventario y Pedidos",
                "version", "APF2 - Semana 10",
                "endpoints_disponibles", Map.of(
                        "pedidos", "/api/orders",
                        "productos", "/api/products"
                )
        );
    }
}

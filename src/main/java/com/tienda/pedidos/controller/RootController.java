package com.tienda.pedidos.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class RootController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> index() {
        Map<String, Object> response = new HashMap<>();
        response.put("sistema", "Sistema de Gestión de Inventario y Pedidos");
        response.put("estado", "Online / Activo");
        response.put("version", "APF1 - Semana 5");
        
        Map<String, String> endpoints = new HashMap<>();
        endpoints.put("productos", "/api/products");
        endpoints.put("pedidos", "/api/orders");
        response.put("endpoints_disponibles", endpoints);
        
        return ResponseEntity.ok(response);
    }
}

@echo off
title Sistema de Pedidos - Backend (Spring Boot)
echo ==========================================
echo    INICIANDO BACKEND (Spring Boot 3)
echo ==========================================
mvn spring-boot:run "-Dspring-boot.run.profiles=h2"
pause

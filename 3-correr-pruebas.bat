@echo off
title Sistema de Pedidos - Pruebas Automatizadas
echo ==========================================
echo 1. EJECUTANDO PRUEBAS DEL BACKEND (JUnit 5)
echo ==========================================
call mvn test
if %errorlevel% neq 0 (
    echo [ERROR] Las pruebas del backend fallaron.
    pause
    exit /b %errorlevel%
)

echo.
echo ==========================================
echo 2. EJECUTANDO PRUEBAS DEL FRONTEND (Vitest)
echo ==========================================
cd tienda-frontend
call npm test
if %errorlevel% neq 0 (
    echo [ERROR] Las pruebas del frontend fallaron.
    pause
    exit /b %errorlevel%
)

echo.
echo ==========================================
echo    TODAS LAS PRUEBAS PASARON AL 100%%
echo ==========================================
pause

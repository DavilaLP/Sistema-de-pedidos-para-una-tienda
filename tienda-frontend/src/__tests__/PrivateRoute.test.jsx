import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, test, expect, beforeEach } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import PrivateRoute from '../components/PrivateRoute';

function iniciarSesion(role) {
  localStorage.setItem('token', 'token-de-prueba');
  localStorage.setItem('username', role.toLowerCase());
  localStorage.setItem('role', role);
}

function renderizarEn(ruta) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="/login" element={<div>Pantalla de login</div>} />
          <Route path="/forbidden" element={<div>Pantalla 403</div>} />
          <Route
            path="/products"
            element={
              <PrivateRoute>
                <div>Catalogo protegido</div>
              </PrivateRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <PrivateRoute adminOnly>
                <div>Modulo de pedidos</div>
              </PrivateRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

describe('PrivateRoute - Rutas protegidas por sesion y rol', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('sin sesion redirige a /login desde una ruta protegida', () => {
    renderizarEn('/products');
    expect(screen.getByText('Pantalla de login')).toBeInTheDocument();
    expect(screen.queryByText('Catalogo protegido')).not.toBeInTheDocument();
  });

  test('sin sesion redirige a /login desde la ruta de administrador', () => {
    renderizarEn('/orders');
    expect(screen.getByText('Pantalla de login')).toBeInTheDocument();
  });

  test('un CLIENTE accede al catalogo', () => {
    iniciarSesion('CLIENTE');
    renderizarEn('/products');
    expect(screen.getByText('Catalogo protegido')).toBeInTheDocument();
  });

  test('un CLIENTE en la ruta de pedidos es enviado a /forbidden', () => {
    iniciarSesion('CLIENTE');
    renderizarEn('/orders');
    expect(screen.getByText('Pantalla 403')).toBeInTheDocument();
    expect(screen.queryByText('Modulo de pedidos')).not.toBeInTheDocument();
  });

  test('un ADMIN accede al modulo de pedidos', () => {
    iniciarSesion('ADMIN');
    renderizarEn('/orders');
    expect(screen.getByText('Modulo de pedidos')).toBeInTheDocument();
  });
});

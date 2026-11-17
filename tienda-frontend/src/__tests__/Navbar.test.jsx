import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, test, expect, beforeEach } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/Navbar';

function iniciarSesion(role) {
  localStorage.setItem('token', 'token-de-prueba');
  localStorage.setItem('username', role.toLowerCase());
  localStorage.setItem('role', role);
}

function renderizarNavbar() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/products']}>
        <Routes>
          <Route path="/products" element={<Navbar />} />
          <Route path="/login" element={<div>Pantalla de login</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

describe('Navbar - Navegacion segun el rol', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('el ADMIN ve los enlaces Productos y Pedidos', () => {
    iniciarSesion('ADMIN');
    renderizarNavbar();
    expect(screen.getByRole('link', { name: 'Productos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pedidos' })).toBeInTheDocument();
  });

  test('el CLIENTE ve Productos pero no Pedidos', () => {
    iniciarSesion('CLIENTE');
    renderizarNavbar();
    expect(screen.getByRole('link', { name: 'Productos' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Pedidos' })).not.toBeInTheDocument();
  });

  test('cerrar sesion limpia el almacenamiento y vuelve a /login', () => {
    iniciarSesion('ADMIN');
    renderizarNavbar();
    fireEvent.click(screen.getByRole('button', { name: /salir/i }));
    expect(screen.getByText('Pantalla de login')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('role')).toBeNull();
  });
});

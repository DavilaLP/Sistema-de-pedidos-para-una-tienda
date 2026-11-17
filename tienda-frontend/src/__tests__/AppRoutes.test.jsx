import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import App from '../App';

vi.mock('../pages/LoginPage', () => ({ default: () => <div>Pagina login</div> }));
vi.mock('../pages/ProductsPage', () => ({ default: () => <div>Pagina productos</div> }));
vi.mock('../pages/OrdersPage', () => ({ default: () => <div>Pagina pedidos</div> }));
vi.mock('../pages/ForbiddenPage', () => ({ default: () => <div>Pagina 403</div> }));

function iniciarSesion(role) {
  localStorage.setItem('token', 'token-de-prueba');
  localStorage.setItem('username', role.toLowerCase());
  localStorage.setItem('role', role);
}

function abrir(ruta) {
  window.history.pushState({}, '', ruta);
  return render(<App />);
}

describe('App - Configuracion de rutas principales', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('/login es publica', () => {
    abrir('/login');
    expect(screen.getByText('Pagina login')).toBeInTheDocument();
  });

  test('una ruta inexistente redirige a /login (redireccion por defecto)', () => {
    abrir('/ruta-que-no-existe');
    expect(screen.getByText('Pagina login')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
  });

  test('/products sin sesion redirige a /login', () => {
    abrir('/products');
    expect(screen.getByText('Pagina login')).toBeInTheDocument();
  });

  test('/products con sesion muestra el catalogo', () => {
    iniciarSesion('CLIENTE');
    abrir('/products');
    expect(screen.getByText('Pagina productos')).toBeInTheDocument();
  });

  test('/orders con un CLIENTE redirige a /forbidden', () => {
    iniciarSesion('CLIENTE');
    abrir('/orders');
    expect(screen.getByText('Pagina 403')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/forbidden');
  });

  test('/orders con un ADMIN muestra el modulo de pedidos', () => {
    iniciarSesion('ADMIN');
    abrir('/orders');
    expect(screen.getByText('Pagina pedidos')).toBeInTheDocument();
  });
});

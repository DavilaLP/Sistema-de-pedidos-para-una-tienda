import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import ProductsPage from '../pages/ProductsPage';
import * as productService from '../services/productService';

vi.mock('../services/productService');
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { username: 'admin', role: 'ADMIN' }, logoutUser: vi.fn() }),
  AuthProvider: ({ children }) => children,
}));

const mockProducts = [
  { id: 1, name: 'Laptop Gamer', price: 1200, stock: 10 },
  { id: 2, name: 'Mouse USB', price: 25, stock: 0 },
];

describe('ProductsPage - Pruebas de CRUD y Validaciones', () => {
  beforeEach(() => {
    productService.getProducts.mockResolvedValue({ data: mockProducts });
  });

  test('renderiza la lista de productos y botones de administración', async () => {
    render(
      <BrowserRouter>
        <ProductsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Laptop Gamer')).toBeInTheDocument();
      expect(screen.getByText('Mouse USB')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /\+ nuevo producto/i })).toBeInTheDocument();
  });

  test('valida campos obligatorios y rechaza stock decimal o negativo', async () => {
    render(
      <BrowserRouter>
        <ProductsPage />
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getByText('Laptop Gamer')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /\+ nuevo producto/i }));

    // Guardar vacío
    fireEvent.click(screen.getByRole('button', { name: /crear/i }));

    expect(screen.getByText(/El nombre es obligatorio/i)).toBeInTheDocument();
    expect(screen.getByText(/El precio debe ser un número mayor a 0/i)).toBeInTheDocument();
    expect(screen.getByText(/El stock debe ser un número entero mayor o igual a 0/i)).toBeInTheDocument();

    // Probar stock decimal 2.5
    const nameInput = screen.getByLabelText(/Nombre/i);
    const priceInput = screen.getByLabelText(/Precio/i);
    const stockInput = screen.getByLabelText(/Stock/i);

    fireEvent.change(nameInput, { target: { value: 'Teclado Mecanico' } });
    fireEvent.change(priceInput, { target: { value: '80' } });
    fireEvent.change(stockInput, { target: { value: '2.5' } });

    fireEvent.click(screen.getByRole('button', { name: /crear/i }));

    expect(screen.getByText(/El stock debe ser un número entero mayor o igual a 0/i)).toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, test, expect, vi } from 'vitest';
import OrdersPage from '../pages/OrdersPage';
import * as orderService from '../services/orderService';
import * as productService from '../services/productService';
import * as authContext from '../context/AuthContext';

vi.mock('../services/orderService');
vi.mock('../services/productService');
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { username: 'admin', role: 'ADMIN' }, logoutUser: vi.fn() }),
  AuthProvider: ({ children }) => children,
}));

const mockOrders = [{
  id: 1,
  clientName: 'Juan Perez',
  status: 'PENDIENTE',
  items: [{ productName: 'Laptop Gamer', quantity: 1, unitPrice: 1500 }],
  total: 1500,
}];

const mockProducts = [{ id: 1, name: 'Laptop Gamer', stock: 5, price: 1500 }];

describe('OrdersPage - Pruebas de Rúbrica Frontend', () => {
  beforeEach(() => {
    orderService.getOrders.mockResolvedValue({ data: mockOrders });
    productService.getProducts.mockResolvedValue({ data: mockProducts });
  });

  test('renderiza la lista de pedidos y productos correctamente', async () => {
    render(
      <BrowserRouter>
        <OrdersPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    });
    expect(screen.getByText(/PENDIENTE/i)).toBeInTheDocument();
  });

  test('valida y rechaza cantidades decimales (2.5) o menores a 1 en pedidos', async () => {
    render(
      <BrowserRouter>
        <OrdersPage />
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getByText('Juan Perez')).toBeInTheDocument());

    // Abrir modal de nuevo pedido
    const newBtn = screen.getByRole('button', { name: /\+ nuevo pedido/i });
    fireEvent.click(newBtn);

    // Seleccionar producto y poner cliente
    const clientInput = screen.getByPlaceholderText(/Nombre completo/i);
    fireEvent.change(clientInput, { target: { value: 'Carlos' } });

    const prodSelect = screen.getByRole('combobox');
    fireEvent.change(prodSelect, { target: { value: '1' } });

    // Ingresar cantidad decimal 2.5
    const qtyInput = document.getElementById('order-qty-0');
    fireEvent.change(qtyInput, { target: { value: '2.5' } });

    // Intentar crear pedido
    const createBtn = screen.getByRole('button', { name: /crear pedido/i });
    fireEvent.click(createBtn);

    // Debe mostrar error de cantidad
    expect(screen.getByText(/La cantidad debe ser un entero mayor a 0/i)).toBeInTheDocument();
  });
});

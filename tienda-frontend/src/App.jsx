import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import LoginPage    from './pages/LoginPage';
import ProductsPage from './pages/ProductsPage';
import OrdersPage   from './pages/OrdersPage';
import ForbiddenPage from './pages/ForbiddenPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Pública */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protegidas (cualquier usuario autenticado) */}
          <Route path="/products" element={
            <PrivateRoute><ProductsPage /></PrivateRoute>
          } />

          {/* Solo ADMIN */}
          <Route path="/orders" element={
            <PrivateRoute adminOnly><OrdersPage /></PrivateRoute>
          } />

          {/* Acceso denegado */}
          <Route path="/forbidden" element={<ForbiddenPage />} />

          {/* Redirigir raíz al login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

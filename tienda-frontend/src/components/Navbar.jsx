import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">📦</span>
        <span className="navbar-title">TiendaTech</span>
      </div>

      <div className="navbar-links">
        <Link to="/products" className="nav-link">Productos</Link>
        {user?.role === 'ADMIN' && (
          <Link to="/orders" className="nav-link">Pedidos</Link>
        )}
      </div>

      <div className="navbar-user">
        <span className="user-badge">
          <span className={`role-dot ${user?.role === 'ADMIN' ? 'admin' : 'cliente'}`} />
          {user?.username}
          <span className="role-tag">{user?.role}</span>
        </span>
        <button className="btn-logout" onClick={handleLogout}>Salir</button>
      </div>
    </nav>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/authService';
import './LoginPage.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors]     = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading]   = useState(false);

  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!username.trim()) e.username = 'El usuario es obligatorio';
    if (!password)         e.password = 'La contraseña es obligatoria';
    if (password && password.length < 4) e.password = 'Mínimo 4 caracteres';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await login(username, password);
      loginUser(res.data);
      navigate('/products');
    } catch (err) {
      setServerError(err.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-header">
          <span className="login-icon">📦</span>
          <h1 className="login-title">TiendaTech</h1>
          <p className="login-sub">Sistema de Pedidos · Inicia sesión para continuar</p>
        </div>

        {serverError && <div className="alert alert-error">{serverError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="username">Usuario</label>
            <input
              id="username"
              className={`form-control ${errors.username ? 'error' : ''}`}
              placeholder="admin / cliente"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
            {errors.username && <span className="form-error">{errors.username}</span>}
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              className={`form-control ${errors.password ? 'error' : ''}`}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <button id="btn-login" type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'0.7rem' }} disabled={loading}>
            {loading ? 'Ingresando…' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="login-hint">
          <p>🔑 <strong>admin</strong> / admin123 &nbsp;·&nbsp; <strong>cliente</strong> / cliente123</p>
        </div>
      </div>
    </div>
  );
}

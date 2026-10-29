import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';

export default function ForbiddenPage() {
  return (
    <>
      <Navbar />
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'calc(100vh - 64px)', gap:'1rem', textAlign:'center', padding:'2rem' }}>
        <span style={{ fontSize:'5rem' }}>🚫</span>
        <h1 style={{ fontSize:'2rem', fontWeight:800, color:'var(--red)' }}>403 — Acceso Denegado</h1>
        <p style={{ color:'var(--text-muted)', maxWidth:380 }}>No tienes permisos para ver esta página. Solo los administradores pueden acceder aquí.</p>
        <Link to="/products" className="btn btn-primary" style={{ marginTop:'0.5rem' }}>← Volver al catálogo</Link>
      </div>
    </>
  );
}

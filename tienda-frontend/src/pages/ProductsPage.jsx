import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/productService';
import { useAuth } from '../context/AuthContext';

const EMPTY = { name: '', price: '', stock: '' };

export default function ProductsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [alert, setAlert]       = useState(null);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null); // null = crear, obj = editar
  const [form, setForm]           = useState(EMPTY);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving]       = useState(false);

  // Confirm delete
  const [deleteId, setDeleteId] = useState(null);

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await getProducts();
      setProducts(res.data);
    } catch (e) {
      showAlert(e.message || 'Error al cargar productos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setFormErrors({}); setShowModal(true); };
  const openEdit   = (p)  => { setEditing(p);   setForm({ name: p.name, price: p.price, stock: p.stock }); setFormErrors({}); setShowModal(true); };
  const closeModal = ()   => { setShowModal(false); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())           e.name  = 'El nombre es obligatorio';
    if (!form.price || form.price <= 0) e.price = 'El precio debe ser mayor a 0';
    if (form.stock === '' || form.stock < 0) e.stock = 'El stock no puede ser negativo';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setFormErrors(e); return; }
    setFormErrors({});
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), price: parseFloat(form.price), stock: parseInt(form.stock) };
      if (editing) {
        await updateProduct(editing.id, payload);
        showAlert('Producto actualizado correctamente');
      } else {
        await createProduct(payload);
        showAlert('Producto creado correctamente');
      }
      closeModal();
      load();
    } catch (err) {
      showAlert(err.message || 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProduct(deleteId);
      showAlert('Producto eliminado');
      setDeleteId(null);
      load();
    } catch (err) {
      showAlert(err.message || 'Error al eliminar', 'error');
      setDeleteId(null);
    }
  };

  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        <div className="page-header">
          <h1>🛒 <span className="page-title-accent">Productos</span></h1>
          {isAdmin && (
            <button id="btn-new-product" className="btn btn-primary" onClick={openCreate}>
              + Nuevo Producto
            </button>
          )}
        </div>

        {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

        {loading ? <div className="spinner" /> : (
          <div className="card table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  {isAdmin && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {products.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign:'center', color:'var(--text-muted)', padding:'2rem' }}>No hay productos registrados</td></tr>
                )}
                {products.map(p => (
                  <tr key={p.id}>
                    <td style={{ color:'var(--text-muted)' }}>#{p.id}</td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ color:'var(--cyan)' }}>S/ {p.price.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${p.stock === 0 ? 'badge-canceled' : p.stock < 5 ? 'badge-pending' : 'badge-paid'}`}>
                        {p.stock} uds
                      </span>
                    </td>
                    {isAdmin && (
                      <td>
                        <div style={{ display:'flex', gap:'0.5rem' }}>
                          <button className="btn btn-ghost" style={{ padding:'0.3rem 0.7rem' }} onClick={() => openEdit(p)}>✏️ Editar</button>
                          <button className="btn btn-danger" style={{ padding:'0.3rem 0.7rem' }} onClick={() => setDeleteId(p.id)}>🗑️ Eliminar</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editing ? '✏️ Editar Producto' : '+ Nuevo Producto'}</h2>

            <div style={{ display:'flex', flexDirection:'column', gap:'0.9rem' }}>
              <div className="form-group">
                <label>Nombre</label>
                <input id="product-name" className={`form-control ${formErrors.name ? 'error' : ''}`}
                  placeholder="Ej: Laptop Gamer" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                {formErrors.name && <span className="form-error">{formErrors.name}</span>}
              </div>
              <div className="form-group">
                <label>Precio (S/)</label>
                <input id="product-price" type="number" min="0" step="0.01"
                  className={`form-control ${formErrors.price ? 'error' : ''}`}
                  placeholder="0.00" value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                {formErrors.price && <span className="form-error">{formErrors.price}</span>}
              </div>
              <div className="form-group">
                <label>Stock</label>
                <input id="product-stock" type="number" min="0"
                  className={`form-control ${formErrors.stock ? 'error' : ''}`}
                  placeholder="0" value={form.stock}
                  onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
                {formErrors.stock && <span className="form-error">{formErrors.stock}</span>}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
              <button id="btn-save-product" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando…' : editing ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <h2 className="modal-title">🗑️ Eliminar Producto</h2>
            <p style={{ color:'var(--text-secondary)', marginBottom:'0.5rem' }}>¿Estás seguro? Esta acción no se puede deshacer.</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancelar</button>
              <button id="btn-confirm-delete" className="btn btn-danger" onClick={handleDelete}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { getOrders, createOrder, updateStatus, cancelOrder } from '../services/orderService';
import { getProducts } from '../services/productService';

const STATUS_BADGE = {
  PENDIENTE: 'badge-pending',
  PAGADO:    'badge-paid',
  CANCELADO: 'badge-canceled',
};

const EMPTY_FORM = { clientName: '', items: [{ productId: '', quantity: 1 }] };

export default function OrdersPage() {
  const [orders, setOrders]     = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [alert, setAlert]       = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving]       = useState(false);
  const [detail, setDetail]       = useState(null); // order detail modal

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [oRes, pRes] = await Promise.all([getOrders(), getProducts()]);
      setOrders(oRes.data);
      setProducts(pRes.data);
    } catch (e) {
      showAlert(e.message || 'Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ---- Form helpers ----
  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { productId: '', quantity: 1 }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const setItem = (i, field, val) => setForm(f => {
    const items = [...f.items];
    items[i] = { ...items[i], [field]: val };
    return { ...f, items };
  });

  const validate = () => {
    const e = {};
    if (!form.clientName.trim()) e.clientName = 'El nombre del cliente es obligatorio';
    if (form.items.length === 0) e.items = 'Agrega al menos un producto';
    form.items.forEach((it, i) => {
      if (!it.productId)        e[`item_${i}_prod`] = 'Selecciona un producto';
      if (!it.quantity || it.quantity < 1) e[`item_${i}_qty`] = 'Cantidad mínima: 1';
    });
    return e;
  };

  const handleCreate = async () => {
    const e = validate();
    if (Object.keys(e).length) { setFormErrors(e); return; }
    setFormErrors({});
    setSaving(true);
    try {
      const payload = {
        clientName: form.clientName.trim(),
        items: form.items.map(it => ({ productId: parseInt(it.productId), quantity: parseInt(it.quantity) })),
      };
      await createOrder(payload);
      showAlert('Pedido creado exitosamente');
      setShowModal(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      showAlert(err.message || 'Error al crear pedido', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePay = async (id) => {
    try {
      await updateStatus(id, 'PAGADO');
      showAlert('Pedido marcado como PAGADO');
      load();
    } catch (err) {
      showAlert(err.message || 'Error al actualizar estado', 'error');
    }
  };

  const handleCancel = async (id) => {
    try {
      await cancelOrder(id);
      showAlert('Pedido cancelado y stock repuesto', 'error');
      load();
    } catch (err) {
      showAlert(err.message || 'Error al cancelar', 'error');
    }
  };

  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        <div className="page-header">
          <h1>📦 <span className="page-title-accent">Pedidos</span></h1>
          <button id="btn-new-order" className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setFormErrors({}); setShowModal(true); }}>
            + Nuevo Pedido
          </button>
        </div>

        {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

        {loading ? <div className="spinner" /> : (
          <div className="card table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign:'center', color:'var(--text-muted)', padding:'2rem' }}>No hay pedidos registrados</td></tr>
                )}
                {orders.map(o => (
                  <tr key={o.id}>
                    <td style={{ color:'var(--text-muted)' }}>#{o.id}</td>
                    <td style={{ fontWeight:600 }}>{o.clientName}</td>
                    <td style={{ color:'var(--text-muted)', fontSize:'0.83rem' }}>
                      {new Date(o.orderDate).toLocaleDateString('es-PE')}
                    </td>
                    <td style={{ color:'var(--cyan)', fontWeight:700 }}>S/ {o.total?.toFixed(2)}</td>
                    <td><span className={`badge ${STATUS_BADGE[o.status] || ''}`}>{o.status}</span></td>
                    <td>
                      <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
                        <button className="btn btn-ghost" style={{ padding:'0.28rem 0.65rem', fontSize:'0.8rem' }}
                          onClick={() => setDetail(o)}>👁 Ver</button>
                        {o.status === 'PENDIENTE' && (
                          <>
                            <button className="btn btn-success" style={{ padding:'0.28rem 0.65rem', fontSize:'0.8rem' }}
                              onClick={() => handlePay(o.id)}>💳 Pagar</button>
                            <button className="btn btn-danger" style={{ padding:'0.28rem 0.65rem', fontSize:'0.8rem' }}
                              onClick={() => handleCancel(o.id)}>✖ Cancelar</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal nuevo pedido */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <h2 className="modal-title">+ Nuevo Pedido</h2>

            <div style={{ display:'flex', flexDirection:'column', gap:'0.9rem' }}>
              <div className="form-group">
                <label>Nombre del Cliente</label>
                <input id="order-client" className={`form-control ${formErrors.clientName ? 'error' : ''}`}
                  placeholder="Nombre completo" value={form.clientName}
                  onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} />
                {formErrors.clientName && <span className="form-error">{formErrors.clientName}</span>}
              </div>

              <div>
                <label style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:'0.5rem' }}>
                  Productos
                </label>
                {formErrors.items && <span className="form-error">{formErrors.items}</span>}
                {form.items.map((it, i) => (
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 100px auto', gap:'0.5rem', marginBottom:'0.5rem', alignItems:'start' }}>
                    <div>
                      <select id={`order-product-${i}`}
                        className={`form-control ${formErrors[`item_${i}_prod`] ? 'error' : ''}`}
                        value={it.productId}
                        onChange={e => setItem(i, 'productId', e.target.value)}>
                        <option value="">Seleccionar…</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} — S/{p.price.toFixed(2)} (stock: {p.stock})</option>
                        ))}
                      </select>
                      {formErrors[`item_${i}_prod`] && <span className="form-error">{formErrors[`item_${i}_prod`]}</span>}
                    </div>
                    <div>
                      <input id={`order-qty-${i}`} type="number" min="1"
                        className={`form-control ${formErrors[`item_${i}_qty`] ? 'error' : ''}`}
                        value={it.quantity}
                        onChange={e => setItem(i, 'quantity', e.target.value)} />
                      {formErrors[`item_${i}_qty`] && <span className="form-error">{formErrors[`item_${i}_qty`]}</span>}
                    </div>
                    <button className="btn btn-danger" style={{ padding:'0.38rem 0.6rem' }}
                      onClick={() => removeItem(i)} disabled={form.items.length === 1}>✖</button>
                  </div>
                ))}
                <button className="btn btn-ghost" style={{ fontSize:'0.82rem', marginTop:'0.25rem' }} onClick={addItem}>
                  + Agregar producto
                </button>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button id="btn-save-order" className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? 'Creando…' : 'Crear Pedido'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle de pedido */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <h2 className="modal-title">📋 Detalle del Pedido #{detail.id}</h2>
            <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', marginBottom:'0.3rem' }}>
              Cliente: <strong style={{ color:'var(--text-primary)' }}>{detail.clientName}</strong>
            </p>
            <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', marginBottom:'1rem' }}>
              Estado: <span className={`badge ${STATUS_BADGE[detail.status] || ''}`}>{detail.status}</span>
            </p>

            <div className="card table-wrapper" style={{ marginBottom:'1rem' }}>
              <table>
                <thead><tr><th>Producto</th><th>Cant.</th><th>Precio Unit.</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {detail.items?.map((it, i) => (
                    <tr key={i}>
                      <td>{it.productName}</td>
                      <td>{it.quantity}</td>
                      <td>S/ {it.unitPrice?.toFixed(2)}</td>
                      <td style={{ color:'var(--cyan)' }}>S/ {(it.quantity * it.unitPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ textAlign:'right', fontSize:'1.1rem', fontWeight:800, color:'var(--cyan)' }}>
              Total: S/ {detail.total?.toFixed(2)}
            </div>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDetail(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import {
  getOrders,
  createOrder,
  updateStatus,
  cancelOrder,
} from '../services/orderService';
import { getProducts } from '../services/productService';

const STATUS_BADGE = {
  PENDIENTE: 'badge-pending',
  PAGADO: 'badge-paid',
  CANCELADO: 'badge-canceled',
};

const newForm = () => ({
  clientName: '',
  items: [{ productId: '', quantity: 1 }],
});

function getErrorMessage(err, fallback) {
  const data = err?.response?.data;

  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (data?.message) {
    return data.message;
  }

  return err?.message || fallback;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [alert, setAlert] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(newForm);
  const [formErrors, setFormErrors] = useState({});
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [detail, setDetail] = useState(null);

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type });
  };

  const load = async () => {
    setLoading(true);

    try {
      const [oRes, pRes] = await Promise.all([
        getOrders(),
        getProducts(),
      ]);

      setOrders(oRes.data);
      setProducts(pRes.data);
    } catch (err) {
      showAlert(
        getErrorMessage(err, 'Error al cargar datos'),
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Abrir y cerrar formulario
  const openModal = () => {
    setForm(newForm());
    setFormErrors({});
    setModalError('');
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setModalError('');
    setFormErrors({});
  };

  // Agregar producto al pedido
  const addItem = () => {
    if (saving) return;
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { productId: '', quantity: 1 },
      ],
    }));

    setModalError('');
  };

  // Eliminar producto del formulario
  const removeItem = (index) => {
    if (saving) return;
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));

    setModalError('');
    setFormErrors({});
  };

  // Actualizar producto o cantidad
  const setItem = (index, field, value) => {
    if (saving) return;
    setForm((prev) => {
      const items = [...prev.items];

      items[index] = {
        ...items[index],
        [field]: value,
      };

      return {
        ...prev,
        items,
      };
    });

    setModalError('');
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[`item_${index}_prod`];
      delete next[`item_${index}_qty`];
      return next;
    });
  };

  // Validaciones del formulario
  const validate = () => {
    const errors = {};

    if (!form.clientName.trim()) {
      errors.clientName =
        'El nombre del cliente es obligatorio';
    }

    if (form.items.length === 0) {
      errors.items = 'Agrega al menos un producto';
    }

    const quantities = {};

    form.items.forEach((item, index) => {
      const quantity = Number(item.quantity);

      if (!item.productId) {
        errors[`item_${index}_prod`] =
          'Selecciona un producto';
      }

      if (
        item.quantity === '' ||
        !Number.isFinite(quantity) ||
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        errors[`item_${index}_qty`] =
          'La cantidad debe ser un entero mayor a 0';
      }

      if (
        item.productId &&
        Number.isInteger(quantity) &&
        quantity > 0
      ) {
        const id = String(item.productId);

        quantities[id] =
          (quantities[id] || 0) + quantity;
      }
    });

    // Comprobar stock disponible
    Object.entries(quantities).forEach(
      ([productId, requested]) => {
        const product = products.find(
          (p) => String(p.id) === productId
        );

        if (
          product &&
          requested > product.stock
        ) {
          form.items.forEach((item, index) => {
            if (String(item.productId) === productId) {
              errors[`item_${index}_qty`] =
                `Stock insuficiente para ${product.name}. ` +
                `Disponible: ${product.stock}, ` +
                `solicitado: ${requested}`;
            }
          });
        }
      }
    );

    return errors;
  };

  // Crear pedido
  const handleCreate = async () => {
    if (saving) return;

    setModalError('');

    const errors = validate();

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setSaving(true);

    try {
      const payload = {
        clientName: form.clientName.trim(),
        items: form.items.map((item) => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity),
        })),
      };

      await createOrder(payload);

      setShowModal(false);
      setForm(newForm());
      setModalError('');

      showAlert(
        'Pedido creado exitosamente',
        'success'
      );

      await load();
    } catch (err) {
      const message = getErrorMessage(
        err,
        'No se pudo crear el pedido'
      );

      setModalError(message);

      // Actualizar el stock visible si cambió
      try {
        const response = await getProducts();
        setProducts(response.data);
      } catch {
        // Conservamos el mensaje original del error
      }
    } finally {
      setSaving(false);
    }
  };

  // Marcar pedido como pagado
  const handlePay = async (id) => {
    if (processingId !== null) return;
    setProcessingId(id);
    try {
      await updateStatus(id, 'PAGADO');

      showAlert(
        'Pedido marcado como PAGADO',
        'success'
      );

      await load();
    } catch (err) {
      showAlert(
        getErrorMessage(
          err,
          'Error al actualizar estado'
        ),
        'error'
      );
    } finally {
      setProcessingId(null);
    }
  };

  // Cancelar pedido
  const handleCancel = async (id) => {
    if (processingId !== null) return;
    setProcessingId(id);
    try {
      await cancelOrder(id);

      showAlert(
        'Pedido cancelado y stock repuesto',
        'success'
      );

      await load();
    } catch (err) {
      showAlert(
        getErrorMessage(
          err,
          'Error al cancelar pedido'
        ),
        'error'
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <>
      <Navbar />

      <div className="page-wrapper">
        <div className="page-header">
          <h1>
            📦{' '}
            <span className="page-title-accent">
              Pedidos
            </span>
          </h1>

          <button
            id="btn-new-order"
            className="btn btn-primary"
            onClick={openModal}
          >
            + Nuevo Pedido
          </button>
        </div>

        {alert && (
          <div
            className={`alert alert-${alert.type}`}
            role="alert"
          >
            {alert.msg}
          </div>
        )}

        {loading ? (
          <div className="spinner" />
        ) : (
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
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        padding: '2rem',
                      }}
                    >
                      No hay pedidos registrados
                    </td>
                  </tr>
                )}

                {orders.map((order) => (
                  <tr key={order.id}>
                    <td
                      style={{
                        color: 'var(--text-muted)',
                      }}
                    >
                      #{order.id}
                    </td>

                    <td style={{ fontWeight: 600 }}>
                      {order.clientName}
                    </td>

                    <td
                      style={{
                        color: 'var(--text-muted)',
                        fontSize: '0.83rem',
                      }}
                    >
                      {new Date(
                        order.orderDate
                      ).toLocaleDateString('es-PE')}
                    </td>

                    <td
                      style={{
                        color: 'var(--cyan)',
                        fontWeight: 700,
                      }}
                    >
                      S/ {Number(order.total ?? 0).toFixed(2)}
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          STATUS_BADGE[order.status] || ''
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td>
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.4rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <button
                          className="btn btn-ghost"
                          style={{
                            padding: '0.28rem 0.65rem',
                            fontSize: '0.8rem',
                          }}
                          onClick={() => setDetail(order)}
                        >
                          👁 Ver
                        </button>

                        {order.status === 'PENDIENTE' && (
                          <>
                            <button
                              className="btn btn-success"
                              style={{
                                padding: '0.28rem 0.65rem',
                                fontSize: '0.8rem',
                              }}
                              onClick={() =>
                                handlePay(order.id)
                              }
                              disabled={processingId !== null}
                            >
                              💳 Pagar
                            </button>

                            <button
                              className="btn btn-danger"
                              style={{
                                padding: '0.28rem 0.65rem',
                                fontSize: '0.8rem',
                              }}
                              onClick={() =>
                                handleCancel(order.id)
                              }
                              disabled={processingId !== null}
                            >
                              ✖ Cancelar
                            </button>
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

      {/* Formulario para crear pedido */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={closeModal}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 580 }}
          >
            <h2 className="modal-title">
              + Nuevo Pedido
            </h2>

            {/* Mensaje de error dentro del modal */}
            {modalError && (
              <div
                className="alert alert-error"
                role="alert"
                style={{ marginBottom: '1rem' }}
              >
                ⚠️ {modalError}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.9rem',
              }}
            >
              <div className="form-group">
                <label htmlFor="order-client">
                  Nombre del Cliente
                </label>

                <input
                  id="order-client"
                  className={`form-control ${
                    formErrors.clientName
                      ? 'error'
                      : ''
                  }`}
                  placeholder="Nombre completo"
                  value={form.clientName}
                    disabled={saving}
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      clientName: e.target.value,
                    }));

                    setModalError('');
                    setFormErrors((prev) => ({
                      ...prev,
                      clientName: '',
                    }));
                  }}
                />

                {formErrors.clientName && (
                  <span className="form-error">
                    {formErrors.clientName}
                  </span>
                )}
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    display: 'block',
                    marginBottom: '0.5rem',
                  }}
                >
                  Productos
                </label>

                {formErrors.items && (
                  <span className="form-error">
                    {formErrors.items}
                  </span>
                )}

                {form.items.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        '1fr 100px auto',
                      gap: '0.5rem',
                      marginBottom: '0.5rem',
                      alignItems: 'start',
                    }}
                  >
                    <div>
                      <select
                        id={`order-product-${index}`}
                        className={`form-control ${
                          formErrors[
                            `item_${index}_prod`
                          ]
                            ? 'error'
                            : ''
                        }`}
                        value={item.productId}
                        disabled={saving}
                        onChange={(e) =>
                          setItem(
                            index,
                            'productId',
                            e.target.value
                          )
                        }
                      >
                        <option value="">
                          Seleccionar…
                        </option>

                        {products.map((product) => (
                          <option
                            key={product.id}
                            value={product.id}
                          >
                            {product.name} — S/
                            {Number(product.price).toFixed(2)}
                            {' '}(stock: {product.stock})
                          </option>
                        ))}
                      </select>

                      {formErrors[
                        `item_${index}_prod`
                      ] && (
                        <span className="form-error">
                          {
                            formErrors[
                              `item_${index}_prod`
                            ]
                          }
                        </span>
                      )}
                    </div>

                    <div>
                      <input
                        id={`order-qty-${index}`}
                        type="number"
                        min="1"
                        step="1"
                        className={`form-control ${
                          formErrors[
                            `item_${index}_qty`
                          ]
                            ? 'error'
                            : ''
                        }`}
                        value={item.quantity}
                        disabled={saving}
                        onChange={(e) =>
                          setItem(
                            index,
                            'quantity',
                            e.target.value
                          )
                        }
                      />

                      {formErrors[
                        `item_${index}_qty`
                      ] && (
                        <span className="form-error">
                          {
                            formErrors[
                              `item_${index}_qty`
                            ]
                          }
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="btn btn-danger"
                      style={{
                        padding: '0.38rem 0.6rem',
                      }}
                      onClick={() =>
                        removeItem(index)
                      }
                      disabled={
                        form.items.length === 1 || saving
                      }
                    >
                      ✖
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{
                    fontSize: '0.82rem',
                    marginTop: '0.25rem',
                  }}
                  onClick={addItem}
                  disabled={saving}
                >
                  + Agregar producto
                </button>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-ghost"
                onClick={closeModal}
                disabled={saving}
              >
                Cancelar
              </button>

              <button
                id="btn-save-order"
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={saving}
              >
                {saving
                  ? 'Creando…'
                  : 'Crear Pedido'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detalle del pedido */}
      {detail && (
        <div
          className="modal-overlay"
          onClick={() => setDetail(null)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 520 }}
          >
            <h2 className="modal-title">
              📋 Detalle del Pedido #{detail.id}
            </h2>

            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                marginBottom: '0.3rem',
              }}
            >
              Cliente:{' '}
              <strong
                style={{
                  color: 'var(--text-primary)',
                }}
              >
                {detail.clientName}
              </strong>
            </p>

            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                marginBottom: '1rem',
              }}
            >
              Estado:{' '}
              <span
                className={`badge ${
                  STATUS_BADGE[detail.status] || ''
                }`}
              >
                {detail.status}
              </span>
            </p>

            <div
              className="card table-wrapper"
              style={{ marginBottom: '1rem' }}
            >
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>Precio Unit.</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>

                <tbody>
                  {detail.items?.map((item, index) => (
                    <tr key={index}>
                      <td>{item.productName}</td>
                      <td>{item.quantity}</td>
                      <td>
                        S/ {Number(item.unitPrice ?? 0).toFixed(2)}
                      </td>
                      <td
                        style={{
                          color: 'var(--cyan)',
                        }}
                      >
                        S/{' '}
                        {(
                          item.quantity *
                          item.unitPrice
                        ).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              style={{
                textAlign: 'right',
                fontSize: '1.1rem',
                fontWeight: 800,
                color: 'var(--cyan)',
              }}
            >
              Total: S/ {Number(detail.total ?? 0).toFixed(2)}
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-ghost"
                onClick={() => setDetail(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


import { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from '../services/productService';
import { useAuth } from '../context/AuthContext';

const EMPTY = { name: '', price: '', stock: '' };

export default function ProductsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const alertTimer = useRef(null);

  // Formulario
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Eliminación
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const showAlert = (msg, type = 'success') => {
    if (alertTimer.current) {
      clearTimeout(alertTimer.current);
    }

    setAlert({ msg, type });

    alertTimer.current = setTimeout(() => {
      setAlert(null);
    }, 3500);
  };

  useEffect(() => {
    return () => {
      if (alertTimer.current) {
        clearTimeout(alertTimer.current);
      }
    };
  }, []);

  // Cargar productos
  const load = async () => {
    setLoading(true);

    try {
      const res = await getProducts();
      setProducts(res.data);
    } catch (err) {
      showAlert(
        err.message || 'Error al cargar productos',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Abrir formulario de creación
  const openCreate = () => {
    if (!isAdmin) return;

    setEditing(null);
    setForm({ ...EMPTY });
    setFormErrors({});
    setShowModal(true);
  };

  // Abrir formulario de edición
  const openEdit = (product) => {
    if (!isAdmin) return;

    setEditing(product);
    setForm({
      name: product.name,
      price: String(product.price),
      stock: String(product.stock)
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Cerrar formulario
  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setFormErrors({});
  };

  // Actualizar campos
  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value
    }));

    setFormErrors((previous) => ({
      ...previous,
      [field]: ''
    }));
  };

  // Validaciones
  const validate = () => {
    const errors = {};

    const name = form.name.trim();
    const price = Number(form.price);
    const stock = Number(form.stock);

    if (!name) {
      errors.name = 'El nombre es obligatorio';
    }

    if (
      form.price === '' ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      errors.price =
        'El precio debe ser un número mayor a 0';
    }

    if (
      form.stock === '' ||
      !Number.isFinite(stock) ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      errors.stock =
        'El stock debe ser un número entero mayor o igual a 0';
    }

    return errors;
  };

  // Crear o actualizar producto
  const handleSave = async () => {
    if (!isAdmin || saving) return;

    const errors = validate();

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        stock: Number(form.stock)
      };

      if (editing) {
        await updateProduct(editing.id, payload);

        showAlert(
          'Producto actualizado correctamente'
        );
      } else {
        await createProduct(payload);

        showAlert(
          'Producto creado correctamente'
        );
      }

      setShowModal(false);
      setEditing(null);
      setForm({ ...EMPTY });

      await load();
    } catch (err) {
      showAlert(
        err.message || 'Error al guardar el producto',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  // Eliminar producto
  const handleDelete = async () => {
    if (!isAdmin || deleteId === null || deleting) {
      return;
    }

    setDeleting(true);

    try {
      await deleteProduct(deleteId);

      showAlert('Producto eliminado correctamente');

      setDeleteId(null);
      await load();
    } catch (err) {
      showAlert(
        err.message || 'Error al eliminar el producto',
        'error'
      );

      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="page-wrapper">
        <div className="page-header">
          <h1>
            🛒{' '}
            <span className="page-title-accent">
              Productos
            </span>
          </h1>

          {isAdmin && (
            <button
              id="btn-new-product"
              className="btn btn-primary"
              onClick={openCreate}
            >
              + Nuevo Producto
            </button>
          )}
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
                  <th>Nombre</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  {isAdmin && <th>Acciones</th>}
                </tr>
              </thead>

              <tbody>
                {products.length === 0 && (
                  <tr>
                    <td
                      colSpan={isAdmin ? 5 : 4}
                      style={{
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        padding: '2rem'
                      }}
                    >
                      No hay productos registrados
                    </td>
                  </tr>
                )}

                {products.map((product) => (
                  <tr key={product.id}>
                    <td
                      style={{
                        color: 'var(--text-muted)'
                      }}
                    >
                      #{product.id}
                    </td>

                    <td style={{ fontWeight: 600 }}>
                      {product.name}
                    </td>

                    <td style={{ color: 'var(--cyan)' }}>
                      S/ {Number(product.price).toFixed(2)}
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          product.stock === 0
                            ? 'badge-canceled'
                            : product.stock < 5
                              ? 'badge-pending'
                              : 'badge-paid'
                        }`}
                      >
                        {product.stock} uds
                      </span>
                    </td>

                    {isAdmin && (
                      <td>
                        <div
                          style={{
                            display: 'flex',
                            gap: '0.5rem'
                          }}
                        >
                          <button
                            className="btn btn-ghost"
                            style={{
                              padding: '0.3rem 0.7rem'
                            }}
                            onClick={() => openEdit(product)}
                          >
                            ✏️ Editar
                          </button>

                          <button
                            className="btn btn-danger"
                            style={{
                              padding: '0.3rem 0.7rem'
                            }}
                            onClick={() =>
                              setDeleteId(product.id)
                            }
                          >
                            🗑️ Eliminar
                          </button>
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

      {/* Modal de creación y edición */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={closeModal}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="product-modal-title"
              className="modal-title"
            >
              {editing
                ? '✏️ Editar Producto'
                : '+ Nuevo Producto'}
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              noValidate
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.9rem'
                }}
              >
                <div className="form-group">
                  <label htmlFor="product-name">
                    Nombre
                  </label>

                  <input
                    id="product-name"
                    className={`form-control ${
                      formErrors.name ? 'error' : ''
                    }`}
                    placeholder="Ej: Laptop Gamer"
                    value={form.name}
                    disabled={saving}
                    aria-invalid={Boolean(formErrors.name)}
                    onChange={(e) =>
                      updateField('name', e.target.value)
                    }
                  />

                  {formErrors.name && (
                    <span className="form-error">
                      {formErrors.name}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="product-price">
                    Precio (S/)
                  </label>

                  <input
                    id="product-price"
                    type="number"
                    min="0"
                    step="0.01"
                    className={`form-control ${
                      formErrors.price ? 'error' : ''
                    }`}
                    placeholder="0.00"
                    value={form.price}
                    disabled={saving}
                    aria-invalid={Boolean(formErrors.price)}
                    onChange={(e) =>
                      updateField('price', e.target.value)
                    }
                  />

                  {formErrors.price && (
                    <span className="form-error">
                      {formErrors.price}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="product-stock">
                    Stock
                  </label>

                  <input
                    id="product-stock"
                    type="number"
                    min="0"
                    step="1"
                    className={`form-control ${
                      formErrors.stock ? 'error' : ''
                    }`}
                    placeholder="0"
                    value={form.stock}
                    disabled={saving}
                    aria-invalid={Boolean(formErrors.stock)}
                    onChange={(e) =>
                      updateField('stock', e.target.value)
                    }
                  />

                  {formErrors.stock && (
                    <span className="form-error">
                      {formErrors.stock}
                    </span>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  id="btn-save-product"
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving
                    ? 'Guardando…'
                    : editing
                      ? 'Actualizar'
                      : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {deleteId !== null && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!deleting) setDeleteId(null);
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 380 }}
          >
            <h2
              id="delete-modal-title"
              className="modal-title"
            >
              🗑️ Eliminar Producto
            </h2>

            <p
              style={{
                color: 'var(--text-secondary)',
                marginBottom: '0.5rem'
              }}
            >
              ¿Estás seguro? Esta acción no se puede
              deshacer.
            </p>

            <div className="modal-actions">
              <button
                className="btn btn-ghost"
                onClick={() => setDeleteId(null)}
                disabled={deleting}
              >
                Cancelar
              </button>

              <button
                id="btn-confirm-delete"
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting
                  ? 'Eliminando…'
                  : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

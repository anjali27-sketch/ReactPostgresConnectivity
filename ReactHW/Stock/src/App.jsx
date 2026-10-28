import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5001/api/products";

const initialForm = {
  productName: "",
  category: "",
  supplier: "",
  price: "",
  quantity: "",
  minimumStock: "",
  description: "",
};

// Convert PostgreSQL row into form field names.
function productToForm(product) {
  return {
    productName: product.product_name ?? "",
    category: product.category ?? "",
    supplier: product.supplier ?? "",
    price: product.price ?? "",
    quantity: product.quantity ?? "",
    minimumStock: product.minimum_stock ?? "",
    description: product.description ?? "",
  };
}

// Read JSON responses safely.
async function readApiResponse(response) {
  const text = await response.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

function App() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingEditId, setLoadingEditId] =
    useState(null);
  const [deletingId, setDeletingId] =
    useState(null);

  const [editingId, setEditingId] =
    useState(null);
  const [editMethod, setEditMethod] =
    useState("PUT");
  const [originalForm, setOriginalForm] =
    useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==================================================
  // GET: Load all products
  // ==================================================

  async function loadProducts() {
    setLoading(true);

    try {
      const response = await fetch(API_URL);
      const data = await readApiResponse(response);

      if (!Array.isArray(data)) {
        throw new Error(
          "The API did not return a product list."
        );
      }

      setProducts(data);
      setError("");
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the backend. Check that the server is running on port 5001."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  // ==================================================
  // FORM CHANGE
  // ==================================================

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  // ==================================================
  // CANCEL EDIT
  // ==================================================

  function cancelEdit() {
    setEditingId(null);
    setEditMethod("PUT");
    setOriginalForm(null);
    setForm(initialForm);
    setError("");
    setSuccess("");
  }

  // ==================================================
  // GET BY ID: Fetch latest product before editing
  // ==================================================

  async function handleEdit(product, method) {
    setError("");
    setSuccess("");
    setLoadingEditId(product.id);

    try {
      const response = await fetch(
        `${API_URL}/${product.id}`
      );

      const latestProduct =
        await readApiResponse(response);

      const values =
        productToForm(latestProduct);

      setForm(values);
      setOriginalForm({ ...values });
      setEditingId(latestProduct.id);
      setEditMethod(method);

      document
        .getElementById("product-form")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the backend."
          : err.message
      );
    } finally {
      setLoadingEditId(null);
    }
  }

  // ==================================================
  // POST / PUT / PATCH
  // ==================================================

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    const isEditing =
      editingId !== null;

    const method = isEditing
      ? editMethod
      : "POST";

    let payload = {
      ...form,

      // Convert number fields to numbers
      price: Number(form.price),
      quantity: Number(form.quantity),
      minimumStock: Number(
        form.minimumStock
      ),
    };

    // PATCH = send only changed fields
    if (method === "PATCH") {
      payload = Object.fromEntries(
        Object.entries(payload).filter(
          ([key, value]) =>
            value !==
            originalForm?.[key]
        )
      );

      if (
        Object.keys(payload).length === 0
      ) {
        setError(
          "No changes detected. Edit at least one field."
        );

        setSaving(false);
        return;
      }
    }

    const endpoint = isEditing
      ? `${API_URL}/${editingId}`
      : API_URL;

    try {
      const response = await fetch(
        endpoint,
        {
          method,
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const savedProduct =
        await readApiResponse(response);

      // POST
      if (method === "POST") {
        setProducts((previous) => [
          savedProduct,
          ...previous.filter(
            (product) =>
              product.id !==
              savedProduct.id
          ),
        ]);

        setSuccess(
          "Product added successfully."
        );
      }

      // PUT / PATCH
      else {
        setProducts((previous) =>
          previous.map((product) =>
            product.id ===
            savedProduct.id
              ? savedProduct
              : product
          )
        );

        setSuccess(
          method === "PUT"
            ? "Product completely updated using PUT."
            : "Selected fields updated successfully using PATCH."
        );
      }

      setForm(initialForm);
      setEditingId(null);
      setEditMethod("PUT");
      setOriginalForm(null);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the backend. Check your API server."
          : err.message
      );
    } finally {
      setSaving(false);
    }
  }

  // ==================================================
  // DELETE PRODUCT
  // ==================================================

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Delete ${product.product_name}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(product.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/${product.id}`,
        {
          method: "DELETE",
        }
      );

      await readApiResponse(response);

      setProducts((previous) =>
        previous.filter(
          (item) =>
            item.id !== product.id
        )
      );

      if (editingId === product.id) {
        cancelEdit();
      }

      setSuccess(
        `${product.product_name} was deleted.`
      );
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the backend."
          : err.message
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="enrollment-page">
      <div className="page-container">

        {/* ==========================================
            HEADER
        ========================================== */}

        <header className="topbar">
          <a href="#home" className="brand">
            <span className="brand-mark">
              SM
            </span>

            <span className="brand-copy">
              <strong>
                Stock Manager
              </strong>

              <small>
                INVENTORY MANAGEMENT
              </small>
            </span>
          </a>

          <span className="admission-badge">
            <span className="status-dot" />
            Stock Management
          </span>
        </header>

        {/* ==========================================
            HERO
        ========================================== */}

        <section
          className="hero"
          id="home"
        >
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="eyebrow-line" />
              INVENTORY MANAGEMENT SYSTEM
            </p>

            <h1>
              Manage stock.
              <br />
              Track products.
              <br />
              <span>Grow your business.</span>
            </h1>

            <p className="hero-description">
              Manage products, monitor stock
              levels and keep your inventory
              organized in one place.
            </p>

            <div className="hero-benefits">
              <span>
                <span className="benefit-check">
                  ✓
                </span>
                Product management
              </span>

              <span>
                <span className="benefit-check">
                  ✓
                </span>
                Stock tracking
              </span>

              <span>
                <span className="benefit-check">
                  ✓
                </span>
                Low stock monitoring
              </span>
            </div>
          </div>

          <div className="hero-panel">
            <div className="panel-icon">
              📦
            </div>

            <p className="panel-label">
              STOCK MANAGER
            </p>

            <h2>
              Inventory Dashboard
            </h2>

            <p className="panel-description">
              Add products, update stock
              information and manage your
              inventory efficiently.
            </p>

            <div className="learning-path">
              <div className="path-item">
                <span className="path-number">
                  01
                </span>

                <div>
                  <strong>
                    Products
                  </strong>

                  <small>
                    Add and manage products
                  </small>
                </div>
              </div>

              <div className="path-item">
                <span className="path-number">
                  02
                </span>

                <div>
                  <strong>
                    Stock
                  </strong>

                  <small>
                    Track available quantity
                  </small>
                </div>
              </div>

              <div className="path-item">
                <span className="path-number">
                  03
                </span>

                <div>
                  <strong>
                    Reports
                  </strong>

                  <small>
                    Monitor inventory status
                  </small>
                </div>
              </div>
            </div>

            <div className="panel-footer">
              Add. Track. Manage.
            </div>
          </div>
        </section>

        {/* ==========================================
            FORM SECTION
        ========================================== */}

        <section className="enrollment-layout">

          <div
            className="form-card"
            id="product-form"
          >
            <div className="section-heading">
              <div>
                <p className="section-label">
                  {editingId !== null
                    ? `EDIT PRODUCT · ${editMethod}`
                    : "PRODUCT MANAGEMENT"}
                </p>

                <h2>
                  {editingId !== null
                    ? "Update product details"
                    : "Add a new product"}
                </h2>

                <p className="section-description">
                  {editingId !== null
                    ? editMethod === "PUT"
                      ? "PUT replaces all product fields."
                      : "PATCH updates only the fields you changed."
                    : "Enter product information to add it to your inventory."}
                </p>
              </div>

              <span
                className="form-icon"
                aria-hidden="true"
              >
                📦
              </span>
            </div>

            <div className="form-progress">
              <span className="progress-fill" />
            </div>

            <p className="form-hint">
              Required fields are marked *
            </p>

            {/* Error */}
            {error && (
              <div
                className="notice notice-error"
                role="alert"
              >
                <span className="notice-icon">
                  !
                </span>

                <p>{error}</p>
              </div>
            )}

            {/* Success */}
            {success && (
              <div
                className="notice notice-success"
                role="status"
              >
                <span className="notice-icon">
                  ✓
                </span>

                <p>{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>

              {/* ======================================
                  PRODUCT INFORMATION
              ====================================== */}

              <div className="form-section-title">
                <span>01</span>

                <h3>
                  Product information
                </h3>
              </div>

              <div className="field-grid">

                {/* Product Name */}
                <div className="field">
                  <label htmlFor="productName">
                    Product name <span>*</span>
                  </label>

                  <input
                    id="productName"
                    name="productName"
                    type="text"
                    maxLength={150}
                    placeholder="Enter product name"
                    value={
                      form.productName
                    }
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Category */}
                <div className="field">
                  <label htmlFor="category">
                    Category <span>*</span>
                  </label>

                  <input
                    id="category"
                    name="category"
                    type="text"
                    maxLength={80}
                    placeholder="e.g. Electronics"
                    value={
                      form.category
                    }
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Supplier */}
                <div className="field">
                  <label htmlFor="supplier">
                    Supplier <span>*</span>
                  </label>

                  <input
                    id="supplier"
                    name="supplier"
                    type="text"
                    maxLength={120}
                    placeholder="Enter supplier name"
                    value={
                      form.supplier
                    }
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Description */}
                <div className="field">
                  <label htmlFor="description">
                    Description
                  </label>

                  <input
                    id="description"
                    name="description"
                    type="text"
                    maxLength={500}
                    placeholder="Product description"
                    value={
                      form.description
                    }
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-divider" />

              {/* ======================================
                  STOCK INFORMATION
              ====================================== */}

              <div className="form-section-title">
                <span>02</span>

                <h3>
                  Stock information
                </h3>
              </div>

              <div className="field-grid">

                {/* Price */}
                <div className="field">
                  <label htmlFor="price">
                    Price <span>*</span>
                  </label>

                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter price"
                    value={form.price}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Quantity */}
                <div className="field">
                  <label htmlFor="quantity">
                    Quantity <span>*</span>
                  </label>

                  <input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="0"
                    placeholder="Enter quantity"
                    value={
                      form.quantity
                    }
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Minimum Stock */}
                <div className="field field-full">
                  <label htmlFor="minimumStock">
                    Minimum stock <span>*</span>
                  </label>

                  <input
                    id="minimumStock"
                    name="minimumStock"
                    type="number"
                    min="0"
                    placeholder="Enter minimum stock level"
                    value={
                      form.minimumStock
                    }
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* ======================================
                  EDIT METHOD
              ====================================== */}

              {editingId !== null && (
                <div
                  style={{
                    marginTop: "20px",
                  }}
                >
                  <label>
                    Update Method:{" "}
                  </label>

                  <select
                    value={editMethod}
                    onChange={(event) =>
                      setEditMethod(
                        event.target.value
                      )
                    }
                  >
                    <option value="PUT">
                      PUT - Full Update
                    </option>

                    <option value="PATCH">
                      PATCH - Partial Update
                    </option>
                  </select>
                </div>
              )}

              {/* ======================================
                  SUBMIT
              ====================================== */}

              <div className="submit-area">
                <button
                  className="submit-button"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="button-spinner" />
                      Processing...
                    </>
                  ) : editingId !== null ? (
                    <>
                      {editMethod === "PUT"
                        ? "Save Full Update (PUT)"
                        : "Save Partial Update (PATCH)"}

                      <span>→</span>
                    </>
                  ) : (
                    <>
                      Add Product
                      <span>→</span>
                    </>
                  )}
                </button>

                {editingId !== null && (
                  <button
                    type="button"
                    className="cancel-edit-button"
                    onClick={cancelEdit}
                    disabled={saving}
                  >
                    Cancel Editing
                  </button>
                )}

                <p className="privacy-note">
                  Product details are saved
                  through the backend to
                  PostgreSQL.
                </p>
              </div>
            </form>
          </div>

          {/* ==========================================
              INFO COLUMN
          ========================================== */}

          <aside className="info-column">

            <div className="info-card">
              <p className="section-label">
                INVENTORY MANAGEMENT
              </p>

              <h2>
                Manage your stock
              </h2>

              <p className="info-intro">
                Keep your products organized
                and monitor stock levels easily.
              </p>

              <div className="journey-item">
                <span className="journey-icon">
                  01
                </span>

                <div>
                  <h3>
                    Add products
                  </h3>

                  <p>
                    Store product and supplier
                    information.
                  </p>
                </div>
              </div>

              <div className="journey-item">
                <span className="journey-icon">
                  02
                </span>

                <div>
                  <h3>
                    Track quantity
                  </h3>

                  <p>
                    Monitor available stock
                    for every product.
                  </p>
                </div>
              </div>

              <div className="journey-item">
                <span className="journey-icon">
                  03
                </span>

                <div>
                  <h3>
                    Check low stock
                  </h3>

                  <p>
                    Identify products that
                    need restocking.
                  </p>
                </div>
              </div>
            </div>

            <div className="next-steps-card">
              <div className="next-steps-icon">
                ✦
              </div>

              <h3>
                Stock Manager
              </h3>

              <ol>
                <li>
                  Add your products.
                </li>

                <li>
                  Update stock information.
                </li>

                <li>
                  Delete products when needed.
                </li>
              </ol>

              <div className="tagline">
                Add. Track. Manage.
              </div>
            </div>
          </aside>
        </section>

        {/* ==========================================
            PRODUCTS LIST
        ========================================== */}

        <section className="registered-section">

          <div className="registered-heading">
            <div>
              <p className="section-label">
                DATABASE MANAGEMENT
              </p>

              <h2>
                Product inventory
              </h2>

              <p className="section-description">
                Manage products using GET,
                PUT, PATCH and DELETE.
              </p>
            </div>

            <div className="student-count">
              <strong>
                {products.length}
              </strong>

              <span>
                Products
              </span>
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="empty-state">
              <span className="loading-spinner" />

              <p>
                Loading products...
              </p>
            </div>
          ) : products.length === 0 ? (
            /* Empty */
            <div className="empty-state">
              <div className="empty-state-icon">
                ＋
              </div>

              <h3>
                No products yet
              </h3>

              <p>
                Add your first product
                using the form above.
              </p>
            </div>
          ) : (
            /* Products */
            <div className="registered-grid">

              {products.map((product) => {

                const isLowStock =
                  Number(
                    product.quantity
                  ) <=
                  Number(
                    product.minimum_stock
                  );

                return (
                  <article
                    className="registered-card"
                    key={product.id}
                  >

                    {/* Product Header */}
                    <div className="registered-card-top">

                      <div className="avatar">
                        {(
                          product.product_name ||
                          "P"
                        )
                          .trim()
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="registered-person">

                        <h3>
                          {
                            product.product_name
                          }
                        </h3>

                        <p>
                          {
                            product.category
                          }
                        </p>

                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="record-details">

                      <div>
                        <span>
                          SUPPLIER
                        </span>

                        <strong>
                          {
                            product.supplier ||
                            "Not provided"
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          PRICE
                        </span>

                        <strong>
                          ₹
                          {Number(
                            product.price
                          ).toFixed(2)}
                        </strong>
                      </div>

                      <div>
                        <span>
                          QUANTITY
                        </span>

                        <strong>
                          {
                            product.quantity
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          MINIMUM STOCK
                        </span>

                        <strong>
                          {
                            product.minimum_stock
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          STATUS
                        </span>

                        <strong
                          style={{
                            color: isLowStock
                              ? "red"
                              : "green",
                          }}
                        >
                          {isLowStock
                            ? "Low Stock"
                            : "In Stock"}
                        </strong>
                      </div>

                    </div>

                    {/* Footer */}
                    <div className="record-footer">

                      <span>
                        Product #{product.id}
                      </span>

                      <span className="record-status">
                        <span className="status-dot" />

                        Saved
                      </span>

                    </div>

                    {/* Actions */}
                    <div className="record-actions">

                      <button
                        type="button"
                        className="record-action-btn record-action-edit"
                        onClick={() =>
                          handleEdit(
                            product,
                            "PUT"
                          )
                        }
                        disabled={
                          loadingEditId !==
                            null ||
                          deletingId ===
                            product.id
                        }
                      >
                        {loadingEditId ===
                        product.id
                          ? "Loading..."
                          : "Edit (PUT)"}
                      </button>

                      <button
                        type="button"
                        className="record-action-btn record-action-patch"
                        onClick={() =>
                          handleEdit(
                            product,
                            "PATCH"
                          )
                        }
                        disabled={
                          loadingEditId !==
                            null ||
                          deletingId ===
                            product.id
                        }
                      >
                        Partial Edit
                        (PATCH)
                      </button>

                      <button
                        type="button"
                        className="record-action-btn record-action-delete"
                        onClick={() =>
                          handleDelete(
                            product
                          )
                        }
                        disabled={
                          deletingId !==
                            null ||
                          loadingEditId ===
                            product.id
                        }
                      >
                        {deletingId ===
                        product.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>

                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* ==========================================
            FOOTER
        ========================================== */}

        <footer className="page-footer">
          <span>
            © {new Date().getFullYear()} Stock
            Manager
          </span>

          <span>
            Add. Track. Manage.
          </span>
        </footer>
      </div>
    </main>
  );
}

export default App;
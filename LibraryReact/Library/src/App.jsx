import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5001/api/books";

const initialForm = {
  bookName: "",
  author: "",
  category: "",
  price: "",
  quantity: "",
};

function bookToForm(book) {
  return {
    bookName: book.book_name ?? "",
    author: book.author ?? "",
    category: book.category ?? "",
    price: book.price ?? "",
    quantity: book.quantity ?? "",
  };
}

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
      data.message || `Request failed with status ${response.status}`
    );
  }

  return data;
}

function App() {
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [editingId, setEditingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ===============================
  // GET ALL BOOKS
  // ===============================

  async function loadBooks() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);
      const data = await readApiResponse(response);

      if (!Array.isArray(data)) {
        throw new Error("Invalid data received from server.");
      }

      setBooks(data);
    } catch (error) {
      setError(error.message || "Failed to load books.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBooks();
  }, []);

  // ===============================
  // FORM CHANGE
  // ===============================

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  // ===============================
  // EDIT BOOK
  // ===============================

  async function handleEdit(book) {
    try {
      setError("");
      setSuccess("");

      const response = await fetch(`${API_URL}/${book.id}`);
      const data = await readApiResponse(response);

      setForm(bookToForm(data));
      setEditingId(book.id);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      setError(error.message || "Failed to load book.");
    }
  }

  // ===============================
  // CANCEL EDIT
  // ===============================

  function handleCancelEdit() {
    setEditingId(null);
    setForm(initialForm);
    setError("");
    setSuccess("");
  }

  // ===============================
  // ADD / UPDATE BOOK
  // ===============================

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const payload = {
        bookName: form.bookName.trim(),
        author: form.author.trim(),
        category: form.category.trim(),
        price: Number(form.price),
        quantity: Number(form.quantity),
      };

      if (
        !payload.bookName ||
        !payload.author ||
        !payload.category ||
        form.price === "" ||
        form.quantity === ""
      ) {
        throw new Error("Please fill all fields.");
      }

      if (payload.price < 0) {
        throw new Error("Price cannot be negative.");
      }

      if (payload.quantity < 0) {
        throw new Error("Quantity cannot be negative.");
      }

      const isEditing = editingId !== null;

      const url = isEditing
        ? `${API_URL}/${editingId}`
        : API_URL;

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const savedBook = await readApiResponse(response);

      if (isEditing) {
        setBooks((currentBooks) =>
          currentBooks.map((book) =>
            book.id === editingId ? savedBook : book
          )
        );

        setSuccess("Book updated successfully.");
      } else {
        setBooks((currentBooks) => [
          savedBook,
          ...currentBooks,
        ]);

        setSuccess("Book added successfully.");
      }

      setForm(initialForm);
      setEditingId(null);
    } catch (error) {
      setError(error.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  // ===============================
  // DELETE BOOK
  // ===============================

  async function handleDelete(book) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${book.book_name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(book.id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/${book.id}`,
        {
          method: "DELETE",
        }
      );

      await readApiResponse(response);

      setBooks((currentBooks) =>
        currentBooks.filter(
          (currentBook) => currentBook.id !== book.id
        )
      );

      setSuccess("Book deleted successfully.");
    } catch (error) {
      setError(error.message || "Failed to delete book.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="enrollment-page">
      {/* ===============================
          TOP BAR
      =============================== */}

      <header className="topbar">
        <div className="page-container topbar-inner">
          <div className="brand">
            <div className="brand-mark">L</div>

            <div className="brand-copy">
              <strong>Library Manager</strong>
              <span>LIBRARY MANAGEMENT</span>
            </div>
          </div>

          <div className="admission-badge">
            <span className="status-dot"></span>
            Library Open
          </div>
        </div>
      </header>

      {/* ===============================
          HERO
      =============================== */}

      <main className="page-container">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-line"></span>
              SIMPLE LIBRARY SYSTEM
            </div>

            <h1>
              Manage books.
              <br />
              <span>Build your library.</span>
            </h1>

            <p className="hero-description">
              Add, update and manage your library books
              easily from one simple system.
            </p>

            <div className="hero-benefits">
              <div className="benefit-check">
                <span> ✓ </span>
                Add books easily
              </div>

              <div className="benefit-check">
                <span> ✓ </span>
                Manage book records
              </div>

              <div className="benefit-check">
                <span> ✓ </span>
                Simple and organized
              </div>
            </div>
          </div>

          <div className="hero-panel">
            <div className="panel-icon">📚</div>

            <div className="panel-label">
              LIBRARY SYSTEM
            </div>

            <h3>Everything in one place.</h3>

            <p className="panel-description">
              Keep your book records organized and easy
              to manage.
            </p>

            <div className="learning-path">
              <div className="path-item">
                <span className="path-number">01</span>
                <span>Add Book</span>
              </div>

              <div className="path-item">
                <span className="path-number">02</span>
                <span>Manage Books</span>
              </div>

              <div className="path-item">
                <span className="path-number">03</span>
                <span>Update Records</span>
              </div>
            </div>

            <div className="panel-footer">
              Simple• Fast• Organized
            </div>
          </div>
        </section>

        {/* ===============================
            FORM + INFO
        =============================== */}

        <section className="enrollment-layout">
          <div className="form-card">
            <div className="section-heading">
              <div className="form-icon">📖</div>

              <div>
                <div className="section-label">
                  {editingId
                    ? "UPDATE BOOK"
                    : "ADD NEW BOOK"}
                </div>

                <h2>
                  {editingId
                    ? "Update book details"
                    : "Add a book"}
                </h2>

                <p className="section-description">
                  Enter the book information below.
                </p>
              </div>
            </div>

            <div className="form-progress">
              <div
                className="progress-fill"
                style={{
                  width: editingId ? "100%" : "50%",
                }}
              ></div>
            </div>

            {error && (
              <div className="notice notice-error">
                <span className="notice-icon">!</span>
                {error}
              </div>
            )}

            {success && (
              <div className="notice notice-success">
                <span className="notice-icon">✓</span>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-section-title">
                Book Information
              </div>

              <div className="field-grid">
                <div className="field field-full">
                  <label htmlFor="bookName">
                    Book Name
                  </label>

                  <input
                    id="bookName"
                    name="bookName"
                    type="text"
                    placeholder="Enter book name"
                    value={form.bookName}
                    onChange={handleChange}
                  />
                </div>

                <div className="field">
                  <label htmlFor="author">
                    Author
                  </label>

                  <input
                    id="author"
                    name="author"
                    type="text"
                    placeholder="Enter author name"
                    value={form.author}
                    onChange={handleChange}
                  />
                </div>

                <div className="field">
                  <label htmlFor="category">
                    Category
                  </label>

                  <input
                    id="category"
                    name="category"
                    type="text"
                    placeholder="e.g. Fiction"
                    value={form.category}
                    onChange={handleChange}
                  />
                </div>

                <div className="field">
                  <label htmlFor="price">
                    Price
                  </label>

                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    placeholder="Enter price"
                    value={form.price}
                    onChange={handleChange}
                  />
                </div>

                <div className="field">
                  <label htmlFor="quantity">
                    Quantity
                  </label>

                  <input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="0"
                    placeholder="Enter quantity"
                    value={form.quantity}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-divider"></div>

              <div className="submit-area">
                <button
                  type="submit"
                  className="submit-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="button-spinner"></span>
                      Saving...
                    </>
                  ) : editingId ? (
                    "Update Book"
                  ) : (
                    "Add Book"
                  )}
                </button>

                {editingId && (
                  <button
                    type="button"
                    className="cancel-edit-button"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                )}
              </div>

              <p className="privacy-note">
                All book information is stored securely
                in your library database.
              </p>
            </form>
          </div>

          {/* ===============================
              INFO COLUMN
          =============================== */}

          <div className="info-column">
            <div className="info-card">
              <div className="info-intro">
                <div className="form-icon">📚</div>

                <h3>Manage your library</h3>

                <p>
                  Keep track of all your books in one
                  convenient place.
                </p>
              </div>

              <div className="journey-item">
                <div className="journey-icon">➕</div>

                <div>
                  <strong>Add Books</strong>
                  <p>
                    Add new books with their details.
                  </p>
                </div>
              </div>

              <div className="journey-item">
                <div className="journey-icon">✏️</div>

                <div>
                  <strong>Update Books</strong>
                  <p>
                    Edit book information whenever needed.
                  </p>
                </div>
              </div>

              <div className="journey-item">
                <div className="journey-icon">🗑️</div>

                <div>
                  <strong>Remove Books</strong>
                  <p>
                    Delete books that are no longer needed.
                  </p>
                </div>
              </div>
            </div>

            <div className="next-steps-card">
              <div className="next-steps-icon">
                ✓
              </div>

              <div>
                <strong>Simple Library Management</strong>

                <p>
                  Add your books and manage your library
                  records easily.
                </p>
              </div>
            </div>

            <div className="tagline">
              ORGANIZE • MANAGE • GROW
            </div>
          </div>
        </section>

        {/* ===============================
            BOOK LIST
        =============================== */}

        <section className="registered-section">
          <div className="registered-heading">
            <div>
              <div className="section-label">
                LIBRARY COLLECTION
              </div>

              <h2>Available Books</h2>

              <p className="section-description">
                All books currently stored in the library.
              </p>
            </div>

            <div className="student-count">
              {books.length}{" "}
              {books.length === 1 ? "Book" : "Books"}
            </div>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                ⏳
              </div>

              <h3>Loading books...</h3>

              <p>
                Please wait while we load your library.
              </p>
            </div>
          ) : books.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                📚
              </div>

              <h3>No books yet</h3>

              <p>
                Add your first book using the form above.
              </p>
            </div>
          ) : (
            <div className="registered-grid">
              {books.map((book) => (
                <article
                  className="registered-card"
                  key={book.id}
                >
                  <div className="registered-card-top">
                    <div className="avatar">
                      {book.book_name
                        ?.charAt(0)
                        .toUpperCase() || "B"}
                    </div>

                    <div className="registered-person">
                      <h3>{book.book_name}</h3>

                      <p>{book.author}</p>
                    </div>
                  </div>

                  <div className="record-details">
                    <div>
                      <span>Category</span>
                      <strong>{book.category}</strong>
                    </div>

                    <div>
                      <span>Price</span>
                      <strong>
                        ₹{Number(book.price).toFixed(2)}
                      </strong>
                    </div>

                    <div>
                      <span>Quantity</span>
                      <strong>{book.quantity}</strong>
                    </div>
                  </div>

                  <div className="record-footer">
                    <div className="record-status">
                      <span className="status-dot"></span>
                      Available
                    </div>

                    <span>
                      Book #{book.id}
                    </span>
                  </div>

                  <div className="record-actions">
                    <button
                      type="button"
                      className="record-action-btn record-action-edit"
                      onClick={() => handleEdit(book)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="record-action-btn record-action-delete"
                      onClick={() => handleDelete(book)}
                      disabled={deletingId === book.id}
                    >
                      {deletingId === book.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ===============================
          FOOTER
      =============================== */}

      <footer className="page-footer">
        <div className="page-container">
          <span>Library Manager</span>
          <span>Library Management System</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
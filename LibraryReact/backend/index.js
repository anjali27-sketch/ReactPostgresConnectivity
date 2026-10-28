import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db.js";

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT || 5001);

// Middleware
app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "Library Management System API is running",
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
  });
});

// Database health check
app.get("/health/db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      status: "OK",
      database: "Connected",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error(error.message);

    res.status(500).json({
      status: "ERROR",
      message: "Database connection failed",
    });
  }
});

// ===============================
// GET ALL BOOKS
// ===============================

app.get("/api/books", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM books ORDER BY id DESC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error.message);

    res.status(500).json({
      message: "Failed to fetch books",
    });
  }
});

// ===============================
// GET SINGLE BOOK
// ===============================

app.get("/api/books/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const result = await pool.query(
      "SELECT * FROM books WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error.message);

    res.status(500).json({
      message: "Failed to fetch book",
    });
  }
});

// ===============================
// ADD BOOK
// ===============================

app.post("/api/books", async (req, res) => {
  try {
    const {
      bookName,
      author,
      category,
      price,
      quantity,
    } = req.body;

    if (
      !bookName ||
      !author ||
      !category ||
      price === undefined ||
      quantity === undefined
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO books
      (book_name, author, category, price, quantity)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        bookName,
        author,
        category,
        Number(price),
        Number(quantity),
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error.message);

    res.status(500).json({
      message: "Failed to add book",
    });
  }
});

// ===============================
// UPDATE BOOK
// ===============================

app.put("/api/books/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const {
      bookName,
      author,
      category,
      price,
      quantity,
    } = req.body;

    if (
      !bookName ||
      !author ||
      !category ||
      price === undefined ||
      quantity === undefined
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const result = await pool.query(
      `
      UPDATE books
      SET
        book_name = $1,
        author = $2,
        category = $3,
        price = $4,
        quantity = $5
      WHERE id = $6
      RETURNING *
      `,
      [
        bookName,
        author,
        category,
        Number(price),
        Number(quantity),
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error.message);

    res.status(500).json({
      message: "Failed to update book",
    });
  }
});

// ===============================
// DELETE BOOK
// ===============================

app.delete("/api/books/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const result = await pool.query(
      "DELETE FROM books WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    res.json({
      message: "Book deleted successfully",
      book: result.rows[0],
    });
  } catch (error) {
    console.error(error.message);

    res.status(500).json({
      message: "Failed to delete book",
    });
  }
});

// ===============================
// 404 ROUTE
// ===============================

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// ===============================
// ERROR HANDLER
// ===============================

app.use((error, req, res, next) => {
  console.error(error);

  res.status(500).json({
    message: "Something went wrong",
  });
});

// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {
  console.log(`Library backend running on http://localhost:${PORT}`);
});
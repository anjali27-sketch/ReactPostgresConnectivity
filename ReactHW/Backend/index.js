import "dotenv/config";
import express from "express";
import cors from "cors";
import { pool } from "./db.js";

const app = express();
const PORT = Number(process.env.PORT || 5001);

app.use(cors());
app.use(express.json({ limit: "20kb" }));

// Request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Product fields configuration
const FIELDS = {
  productName: {
    column: "product_name",
    required: true,
    max: 150,
    type: "string",
  },

  category: {
    column: "category",
    required: true,
    max: 80,
    type: "string",
  },

  supplier: {
    column: "supplier",
    required: true,
    max: 120,
    type: "string",
  },

  price: {
    column: "price",
    required: true,
    type: "number",
    min: 0,
  },

  quantity: {
    column: "quantity",
    required: true,
    type: "integer",
    min: 0,
  },

  minimumStock: {
    column: "minimum_stock",
    required: true,
    type: "integer",
    min: 0,
  },

  description: {
    column: "description",
    required: false,
    max: 500,
    type: "string",
  },
};

const FIELD_KEYS = Object.keys(FIELDS);

// --------------------------------------------------
// Normalize and validate one field
// --------------------------------------------------

function normalizeField(key, value) {
  const config = FIELDS[key];

  // Missing value
  if (value === undefined || value === null) {
    if (config.required) {
      return {
        error: `${key} is required.`,
      };
    }

    return {
      value: null,
    };
  }

  // Number fields
  if (
    config.type === "number" ||
    config.type === "integer"
  ) {
    if (typeof value === "string") {
      value = value.trim();

      if (!value) {
        if (config.required) {
          return {
            error: `${key} is required.`,
          };
        }

        return {
          value: null,
        };
      }
    }

    const normalized = Number(value);

    if (!Number.isFinite(normalized)) {
      return {
        error: `${key} must be a valid number.`,
      };
    }

    if (
      config.type === "integer" &&
      !Number.isInteger(normalized)
    ) {
      return {
        error: `${key} must be a whole number.`,
      };
    }

    if (
      config.min !== undefined &&
      normalized < config.min
    ) {
      return {
        error: `${key} cannot be less than ${config.min}.`,
      };
    }

    return {
      value: normalized,
    };
  }

  // String fields
  if (typeof value !== "string") {
    return {
      error: `${key} must be a string.`,
    };
  }

  const normalized = value.trim();

  if (!normalized) {
    if (config.required) {
      return {
        error: `${key} is required.`,
      };
    }

    return {
      value: null,
    };
  }

  if (normalized.length > config.max) {
    return {
      error: `${key} must be ${config.max} characters or fewer.`,
    };
  }

  return {
    value: normalized,
  };
}

// --------------------------------------------------
// Validate complete product
// --------------------------------------------------

function validateFullProduct(body) {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return {
      error: "A valid JSON object is required.",
    };
  }

  // Check unknown fields
  for (const key of Object.keys(body)) {
    if (!Object.hasOwn(FIELDS, key)) {
      return {
        error: `Unknown field: ${key}`,
      };
    }
  }

  const values = {};

  for (const key of FIELD_KEYS) {
    const result = normalizeField(
      key,
      body[key]
    );

    if (result.error) {
      return {
        error: result.error,
      };
    }

    values[key] = result.value;
  }

  return {
    values,
  };
}

// --------------------------------------------------
// Validate partial product for PATCH
// --------------------------------------------------

function validatePartialProduct(body) {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return {
      error: "A valid JSON object is required.",
    };
  }

  const keys = Object.keys(body);

  if (keys.length === 0) {
    return {
      error: "Provide at least one field to update.",
    };
  }

  const values = {};

  for (const key of keys) {
    if (!Object.hasOwn(FIELDS, key)) {
      return {
        error: `Unknown field: ${key}`,
      };
    }

    const result = normalizeField(
      key,
      body[key]
    );

    if (result.error) {
      return {
        error: result.error,
      };
    }

    values[key] = result.value;
  }

  return {
    values,
  };
}

// --------------------------------------------------
// Validate Product ID
// --------------------------------------------------

function validateProductId(req, res, next) {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({
      message: "Invalid product ID.",
    });
  }

  req.productId = id;

  next();
}

// --------------------------------------------------
// Database error handler
// --------------------------------------------------

function handleDatabaseError(
  error,
  res,
  operation
) {
  console.error(
    `${operation}:`,
    error.message
  );

  // Duplicate value
  if (error.code === "23505") {
    return res.status(409).json({
      message:
        "A product with this information already exists.",
    });
  }

  // NOT NULL / CHECK constraint
  if (
    error.code === "23502" ||
    error.code === "23514"
  ) {
    return res.status(400).json({
      message:
        "Some product information is invalid or missing.",
    });
  }

  return res.status(500).json({
    message: `${operation}. Please try again.`,
  });
}

// ==================================================
// HEALTH ROUTES
// ==================================================

// API health
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "running",
    message: "Stock Manager API is working.",
  });
});

// Database health
app.get("/health/db", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.status(200).json({
      status: "connected",
      message:
        "PostgreSQL connection successful.",
    });
  } catch (error) {
    console.error(
      "Database health check:",
      error.message
    );

    res.status(500).json({
      message:
        "PostgreSQL connection failed.",
    });
  }
});

// ==================================================
// GET ALL PRODUCTS
// ==================================================

app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM products ORDER BY id DESC"
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(
      "GET all products:",
      error.message
    );

    return res.status(500).json({
      message:
        "Could not fetch products.",
    });
  }
});

// ==================================================
// GET PRODUCT BY ID
// ==================================================

app.get(
  "/api/products/:id",
  validateProductId,
  async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM products WHERE id = $1",
        [req.productId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Product not found.",
        });
      }

      return res.status(200).json(
        result.rows[0]
      );
    } catch (error) {
      console.error(
        "GET product by ID:",
        error.message
      );

      return res.status(500).json({
        message:
          "Could not fetch product details.",
      });
    }
  }
);

// ==================================================
// CREATE PRODUCT
// ==================================================

app.post("/api/products", async (req, res) => {
  const validation =
    validateFullProduct(req.body);

  if (validation.error) {
    return res.status(400).json({
      message: validation.error,
    });
  }

  const values = validation.values;

  try {
    const columns = FIELD_KEYS.map(
      (key) => FIELDS[key].column
    );

    const placeholders = FIELD_KEYS.map(
      (_, index) => `$${index + 1}`
    );

    const parameters = FIELD_KEYS.map(
      (key) => values[key]
    );

    const query = `
      INSERT INTO products
      (${columns.join(", ")})
      VALUES
      (${placeholders.join(", ")})
      RETURNING *
    `;

    const result = await pool.query(
      query,
      parameters
    );

    return res.status(201).json(
      result.rows[0]
    );
  } catch (error) {
    return handleDatabaseError(
      error,
      res,
      "Could not create product"
    );
  }
});

// ==================================================
// PUT - FULL PRODUCT UPDATE
// ==================================================

app.put(
  "/api/products/:id",
  validateProductId,
  async (req, res) => {
    const validation =
      validateFullProduct(req.body);

    if (validation.error) {
      return res.status(400).json({
        message: validation.error,
      });
    }

    const values = validation.values;

    try {
      const assignments = FIELD_KEYS.map(
        (key, index) =>
          `${FIELDS[key].column} = $${index + 1}`
      );

      const parameters = [
        ...FIELD_KEYS.map(
          (key) => values[key]
        ),
        req.productId,
      ];

      const query = `
        UPDATE products
        SET ${assignments.join(", ")}
        WHERE id = $${parameters.length}
        RETURNING *
      `;

      const result = await pool.query(
        query,
        parameters
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Product not found.",
        });
      }

      return res.status(200).json(
        result.rows[0]
      );
    } catch (error) {
      return handleDatabaseError(
        error,
        res,
        "Could not replace product"
      );
    }
  }
);

// ==================================================
// PATCH - PARTIAL PRODUCT UPDATE
// ==================================================

app.patch(
  "/api/products/:id",
  validateProductId,
  async (req, res) => {
    const validation =
      validatePartialProduct(req.body);

    if (validation.error) {
      return res.status(400).json({
        message: validation.error,
      });
    }

    const values = validation.values;
    const keys = Object.keys(values);

    try {
      const assignments = keys.map(
        (key, index) =>
          `${FIELDS[key].column} = $${index + 1}`
      );

      const parameters = [
        ...keys.map(
          (key) => values[key]
        ),
        req.productId,
      ];

      const query = `
        UPDATE products
        SET ${assignments.join(", ")}
        WHERE id = $${parameters.length}
        RETURNING *
      `;

      const result = await pool.query(
        query,
        parameters
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Product not found.",
        });
      }

      return res.status(200).json(
        result.rows[0]
      );
    } catch (error) {
      return handleDatabaseError(
        error,
        res,
        "Could not update product"
      );
    }
  }
);

// ==================================================
// DELETE PRODUCT
// ==================================================

app.delete(
  "/api/products/:id",
  validateProductId,
  async (req, res) => {
    try {
      const result = await pool.query(
        `
        DELETE FROM products
        WHERE id = $1
        RETURNING id
        `,
        [req.productId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Product not found.",
        });
      }

      return res.status(200).json({
        message:
          "Product deleted successfully.",
        id: result.rows[0].id,
      });
    } catch (error) {
      console.error(
        "DELETE product:",
        error.message
      );

      return res.status(500).json({
        message:
          "Could not delete product.",
      });
    }
  }
);

// ==================================================
// 404 ROUTE
// ==================================================

app.use((req, res) => {
  res.status(404).json({
    message:
      `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ==================================================
// START SERVER
// ==================================================

const server = app.listen(
  PORT,
  () => {
    console.log(
      `Stock Manager backend running at http://localhost:${PORT}`
    );
  }
);

server.on("error", (error) => {
  console.error(
    "Backend startup error:",
    error.message
  );

  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use.`
    );
  }
});
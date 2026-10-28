require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT)
});

app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products");

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Database error"
    });
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
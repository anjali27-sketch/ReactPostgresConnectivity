require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: "http://localhost:5173"
}));

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

app.get("/api/student5", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT message FROM demo_messages ORDER BY id LIMIT 1"
    );

    res.json({
      message: result.rows[0]?.message ?? "No message found"
    });
  } catch (error) {
    console.error("Database error:", error.message);
    res.status(500).json({
      error: "Could not fetch the database message"
    });
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log("Backend running at http://localhost:5000");
});
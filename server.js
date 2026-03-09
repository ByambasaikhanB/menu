const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

// ================= DATABASE =================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Init DB
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS menu_items(
      id SERIAL PRIMARY KEY,
      image_url TEXT,
      name TEXT,
      ingredients TEXT,
      price INT,
      category TEXT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders(
      id SERIAL PRIMARY KEY,
      table_number TEXT,
      items JSONB,
      total_price INT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}
initDB();

// ================= MENU =================
app.get("/menu/:category", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM menu_items WHERE category=$1",
      [req.params.category],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ================= ORDERS =================
// Create order
app.post("/orders", async (req, res) => {
  const { table_number, items, total_price } = req.body;
  try {
    await pool.query(
      `INSERT INTO orders(table_number, items, total_price) VALUES($1,$2,$3)`,
      [table_number, items, total_price],
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Get orders (only pending + in progress)
app.get("/orders", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM orders ORDER BY created_at DESC",
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Mark order done
app.put("/orders/:id", async (req, res) => {
  try {
    await pool.query("UPDATE orders SET status='done' WHERE id=$1", [
      req.params.id,
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));

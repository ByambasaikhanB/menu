const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();

// BODY PARSER
app.use(bodyParser.json());

// --- API ROUTES --- (static files-ээс өмнө байх ёстой)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// INIT DB
async function initDB() {
  try {
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

    console.log("Database initialized ✅");
  } catch (err) {
    console.error("DB init error:", err);
  }
}
initDB();

// GET MENU BY CATEGORY
app.get("/menu/:category", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM menu_items WHERE category=$1",
      [req.params.category],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch menu" });
  }
});

// CREATE ORDER
app.post("/orders", async (req, res) => {
  try {
    const { table_number, items, total_price } = req.body;

    // JSONB-д дамжуулахын тулд stringify
    const itemsJSON = JSON.stringify(items);

    await pool.query(
      `INSERT INTO orders(table_number, items, total_price) VALUES($1,$2,$3)`,
      [table_number, itemsJSON, total_price],
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Order insert error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET ORDERS
app.get("/orders", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM orders ORDER BY created_at DESC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// MARK ORDER DONE
app.put("/orders/:id", async (req, res) => {
  try {
    await pool.query("UPDATE orders SET status='done' WHERE id=$1", [
      req.params.id,
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- STATIC FILES (PUBLIC FOLDER) ---
app.use(express.static("public"));

// SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));

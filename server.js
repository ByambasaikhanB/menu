const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

// FILE UPLOAD
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// POSTGRES POOL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// INIT DB
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS menu_items(
      id SERIAL PRIMARY KEY,
      image_url TEXT,
      name TEXT,
      ingredients TEXT,
      price INT,
      kcal TEXT,
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

  console.log("DB ready");
}
initDB();

// ================= API ROUTES =================

// GET all menu
app.get("/menu", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM menu_items ORDER BY id DESC",
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET menu by category
app.get("/menu/:category", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM menu_items WHERE category=$1 ORDER BY id DESC",
      [req.params.category],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD menu (admin)
app.post("/add-menu", upload.single("image"), async (req, res) => {
  const { name, ingredients, price, kcal, category } = req.body;
  const image_url = req.file ? "/uploads/" + req.file.filename : null;
  await pool.query(
    `INSERT INTO menu_items(name, ingredients, price, kcal, category, image_url)
    VALUES($1,$2,$3,$4,$5,$6)`,
    [name, ingredients, price, kcal, category, image_url],
  );
  res.json({ success: true });
});

// ORDERS
app.get("/orders", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM orders ORDER BY created_at DESC",
  );
  res.json(result.rows);
});

app.post("/orders", async (req, res) => {
  const { table_number, items, total_price } = req.body;
  await pool.query(
    `INSERT INTO orders(table_number, items, total_price) VALUES($1,$2,$3)`,
    [table_number, JSON.stringify(items), total_price],
  );
  res.json({ success: true });
});

app.put("/orders/:id", async (req, res) => {
  await pool.query("UPDATE orders SET status='done' WHERE id=$1", [
    req.params.id,
  ]);
  res.json({ success: true });
});

// STATIC FILES
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));

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
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});
const upload = multer({ storage });

// POSTGRES POOL
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
        kcal TEXT,
        icons TEXT,
        category TEXT,
        sort_order INT
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

// ================== MENU API ==================

// GET all menu
app.get("/menu", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM menu_items ORDER BY id DESC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ADD menu
app.post("/add-menu", upload.single("image"), async (req, res) => {
  try {
    const { name, ingredients, price, category, kcal, icons, sort_order } =
      req.body;
    const image_url = req.file ? "/uploads/" + req.file.filename : null;

    await pool.query(
      `INSERT INTO menu_items(name, ingredients, price, category, kcal, icons, sort_order, image_url)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        name,
        ingredients,
        price,
        category,
        kcal,
        icons,
        sort_order || 0,
        image_url,
      ],
    );

    res.json({ success: true });
  } catch (err) {
    console.error("ADD MENU ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE menu
app.put("/menu/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, ingredients, price, category, kcal, icons, sort_order } =
      req.body;
    const image_url = req.file ? "/uploads/" + req.file.filename : null;

    const fields = [];
    const values = [];
    let idx = 1;

    if (name) {
      fields.push(`name=$${idx++}`);
      values.push(name);
    }
    if (ingredients) {
      fields.push(`ingredients=$${idx++}`);
      values.push(ingredients);
    }
    if (price) {
      fields.push(`price=$${idx++}`);
      values.push(price);
    }
    if (category) {
      fields.push(`category=$${idx++}`);
      values.push(category);
    }
    if (kcal) {
      fields.push(`kcal=$${idx++}`);
      values.push(kcal);
    }
    if (icons) {
      fields.push(`icons=$${idx++}`);
      values.push(icons);
    }
    if (sort_order) {
      fields.push(`sort_order=$${idx++}`);
      values.push(sort_order);
    }
    if (image_url) {
      fields.push(`image_url=$${idx++}`);
      values.push(image_url);
    }

    if (fields.length === 0)
      return res
        .status(400)
        .json({ success: false, error: "Nothing to update" });

    values.push(req.params.id);

    await pool.query(
      `UPDATE menu_items SET ${fields.join(", ")} WHERE id=$${idx}`,
      values,
    );

    res.json({ success: true });
  } catch (err) {
    console.error("UPDATE MENU ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE menu
app.delete("/menu/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM menu_items WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE MENU ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================== ORDERS ==================

// GET orders
app.get("/orders", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM orders ORDER BY created_at DESC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// CREATE order
app.post("/orders", async (req, res) => {
  try {
    const { table_number, items, total_price } = req.body;
    const itemsJSON = JSON.stringify(items);
    await pool.query(
      `INSERT INTO orders(table_number, items, total_price) VALUES($1,$2,$3)`,
      [table_number, itemsJSON, total_price],
    );
    res.json({ success: true });
  } catch (err) {
    console.error("ORDER ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// MARK DONE
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

// ================== STATIC FILES ==================
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));

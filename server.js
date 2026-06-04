const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const multer = require("multer");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

const app = express();

// ================= CLOUDINARY =================
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// ================= DATABASE =================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ================= MIDDLEWARE =================
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ dest: "tmp/" });

// ================= DB INIT =================
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id SERIAL PRIMARY KEY,
      image_url TEXT,
      name TEXT NOT NULL,
      ingredients TEXT,
      price TEXT NOT NULL,
      kcal TEXT,
      icons TEXT,
      category TEXT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_name TEXT,
      phone TEXT,
      items JSONB,
      total_price TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}
initDB();

// ================= MENU API =================
app.get("/menu", async (req, res) => {
  const result = await pool.query("SELECT * FROM menu_items ORDER BY id DESC");
  res.json(result.rows);
});

app.get("/menu/:category", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM menu_items WHERE LOWER(category)=LOWER($1)",
    [req.params.category],
  );
  res.json(result.rows);
});

// ================= ADD MENU =================
app.post("/add-menu", upload.single("image"), async (req, res) => {
  try {
    let { name, ingredients, price, kcal, icons, category } = req.body;

    let image_url = null;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "menu_items",
      });
      image_url = result.secure_url;
      fs.unlinkSync(req.file.path);
    }

    const db = await pool.query(
      `INSERT INTO menu_items
      (image_url,name,ingredients,price,kcal,icons,category)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *`,
      [image_url, name, ingredients, price, kcal, icons, category],
    );

    res.json(db.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true });
  }
});

// ================= ORDER API =================
app.post("/order", async (req, res) => {
  try {
    const { customer_name, phone, items, total_price } = req.body;

    const result = await pool.query(
      `INSERT INTO orders (customer_name, phone, items, total_price)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [customer_name, phone, JSON.stringify(items), total_price],
    );

    res.json({ success: true, order: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// ================= GET ORDERS =================
app.get("/orders", async (req, res) => {
  const result = await pool.query("SELECT * FROM orders ORDER BY id DESC");
  res.json(result.rows);
});

// ================= STATIC =================
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running " + PORT));

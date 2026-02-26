// ================= IMPORTS =================
const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const multer = require("multer");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

const app = express();

// ================= CLOUDINARY CONFIG =================
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
app.use(express.static("public"));

// ================= MULTER =================
const upload = multer({ dest: "tmp/" });

// ================= CREATE TABLE =================
async function initDB() {
  try {
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
    console.log("Table ready");
  } catch (err) {
    console.error("DB INIT ERROR:", err);
    process.exit(1);
  }
}
initDB();

// ======================================================
// ================= ADD MENU ===========================
// ======================================================

app.post("/add-menu", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "Image required" });
    }

    let { name, ingredients, price, kcal, icons, category } = req.body;

    // ===== VALIDATION =====
    if (!name || !price) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Name and Price required" });
    }

    // ===== AUTO FORMAT =====
    name = name ? name.toUpperCase() : null;
    ingredients = ingredients ? ingredients.toUpperCase() : null;
    category = category ? category.toLowerCase() : "food";
    kcal = kcal ? kcal : null;
    icons = icons ? icons : null;

    // ===== CLOUDINARY UPLOAD =====
    let image_url;
    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "menu_items",
      });
      image_url = result.secure_url;
    } catch (err) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(500).json({ error: "Cloudinary upload failed" });
    }

    // ===== DB INSERT =====
    const result = await pool.query(
      `INSERT INTO menu_items
       (image_url, name, ingredients, price, kcal, icons, category)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [image_url, name, ingredients, price, kcal, icons, category],
    );

    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    res.json({ success: true, item: result.rows[0] });
  } catch (err) {
    console.error("ADD MENU ERROR:", err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: "Server error" });
  }
});

// ======================================================
// ================= GET ALL MENU =======================
// ======================================================

app.get("/menu", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM menu_items ORDER BY id DESC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error("FETCH ERROR:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ======================================================
// ================= GET BY CATEGORY ====================
// ======================================================

app.get("/menu/:category", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM menu_items WHERE category=$1 ORDER BY id DESC",
      [req.params.category.toLowerCase()],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("FETCH BY CATEGORY ERROR:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ======================================================
// ================= UPDATE MENU ========================
// ======================================================

app.put("/menu/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let { name, ingredients, price, kcal, icons, category } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: "Name and Price required" });
    }

    // ===== AUTO FORMAT =====
    name = name ? name.toUpperCase() : null;
    ingredients = ingredients ? ingredients.toUpperCase() : null;
    category = category ? category.toLowerCase() : null;
    kcal = kcal ? kcal : null;
    icons = icons ? icons : null;

    await pool.query(
      `UPDATE menu_items
       SET name=$1,
           ingredients=$2,
           price=$3,
           kcal=$4,
           icons=$5,
           category=$6
       WHERE id=$7`,
      [name, ingredients, price, kcal, icons, category, id],
    );

    res.json({ success: true });
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ error: "Database update failed" });
  }
});

// ======================================================
// ================= DELETE MENU ========================
// ======================================================

app.delete("/menu/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM menu_items WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ error: "Database delete failed" });
  }
});

// ================= SERVER START =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

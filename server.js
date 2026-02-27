// ================= IMPORTS =================
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
app.use(express.static("public"));

// ================= MULTER =================
const upload = multer({ dest: "tmp/" });

// ================= CREATE TABLE =================
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
}
initDB();

// ======================================================
// ================= ADD MENU ===========================
// ======================================================

app.post("/add-menu", upload.single("image"), async (req, res) => {
  try {
    let { name, ingredients, price, kcal, icons, category } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ success: false, error: "Missing fields" });
    }

    name = name.toUpperCase();
    ingredients = ingredients ? ingredients.toUpperCase() : null;
    category = category.toLowerCase();
    kcal = kcal || null;
    icons = icons || null;

    let image_url = null;

    // 🔥 ЗӨВХӨН list биш үед зураг required
    if (category !== "list") {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, error: "Image required" });
      }

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "menu_items",
      });

      image_url = result.secure_url;

      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    }

    // list үед зураг байвал upload хийнэ
    if (category === "list" && req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "menu_items",
      });

      image_url = result.secure_url;

      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    }

    const result = await pool.query(
      `INSERT INTO menu_items
       (image_url, name, ingredients, price, kcal, icons, category)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [image_url, name, ingredients, price, kcal, icons, category],
    );

    res.json({ success: true, item: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ======================================================
// ================= GET ALL ============================
// ======================================================

app.get("/menu", async (req, res) => {
  const result = await pool.query("SELECT * FROM menu_items ORDER BY id DESC");
  res.json(result.rows);
});

// ======================================================
// ================= GET BY CATEGORY ====================
// ======================================================

app.get("/menu/:category", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM menu_items WHERE category=$1 ORDER BY id DESC",
    [req.params.category.toLowerCase()],
  );
  res.json(result.rows);
});

// ======================================================
// ================= UPDATE =============================
// ======================================================

app.put("/menu/:id", async (req, res) => {
  const { id } = req.params;
  let { name, ingredients, price, kcal, icons, category } = req.body;

  name = name.toUpperCase();
  ingredients = ingredients ? ingredients.toUpperCase() : null;
  category = category.toLowerCase();

  await pool.query(
    `UPDATE menu_items
     SET name=$1,
         ingredients=$2,
         price=$3,
         kcal=$4,
         icons=$5,
         category=$6
     WHERE id=$7`,
    [name, ingredients, price, kcal || null, icons || null, category, id],
  );

  res.json({ success: true });
});

// ======================================================
// ================= DELETE =============================
// ======================================================

app.delete("/menu/:id", async (req, res) => {
  await pool.query("DELETE FROM menu_items WHERE id=$1", [req.params.id]);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));

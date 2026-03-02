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

// ================= SAFE DB INIT =================
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

    // sort_order column байхгүй бол нэмнэ
    await pool.query(`
      ALTER TABLE menu_items
      ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
    `);

    console.log("Database ready");
  } catch (err) {
    console.error("DB INIT ERROR:", err);
  }
}
initDB();

// =================================================
// ================= API ROUTES ====================
// =================================================

// GET ALL
app.get("/menu", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM menu_items ORDER BY sort_order ASC, id DESC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET BY CATEGORY
app.get("/menu/:category", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM menu_items
       WHERE LOWER(category)=LOWER($1)
       ORDER BY sort_order ASC, id DESC`,
      [req.params.category],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ADD MENU
app.post("/add-menu", upload.single("image"), async (req, res) => {
  try {
    let { name, ingredients, price, kcal, icons, category, sort_order } =
      req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ success: false, error: "Missing fields" });
    }

    name = name.toUpperCase();
    ingredients = ingredients ? ingredients.toUpperCase() : null;
    category = category.toLowerCase();

    let image_url = null;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "menu_items",
      });
      image_url = result.secure_url;
      fs.unlinkSync(req.file.path);
    }

    const result = await pool.query(
      `INSERT INTO menu_items
       (image_url,name,ingredients,price,kcal,icons,category,sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        image_url,
        name,
        ingredients,
        price,
        kcal || null,
        icons || null,
        category,
        sort_order || 0,
      ],
    );

    res.json({ success: true, item: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE
app.put("/menu/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    let { name, ingredients, price, kcal, icons, category, sort_order } =
      req.body;

    name = name.toUpperCase();
    ingredients = ingredients ? ingredients.toUpperCase() : null;
    category = category.toLowerCase();

    let image_url = null;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "menu_items",
      });
      image_url = result.secure_url;
      fs.unlinkSync(req.file.path);
    }

    if (image_url) {
      await pool.query(
        `UPDATE menu_items
         SET name=$1,
             ingredients=$2,
             price=$3,
             kcal=$4,
             icons=$5,
             category=$6,
             sort_order=$7,
             image_url=$8
         WHERE id=$9`,
        [
          name,
          ingredients,
          price,
          kcal || null,
          icons || null,
          category,
          sort_order || 0,
          image_url,
          id,
        ],
      );
    } else {
      await pool.query(
        `UPDATE menu_items
         SET name=$1,
             ingredients=$2,
             price=$3,
             kcal=$4,
             icons=$5,
             category=$6,
             sort_order=$7
         WHERE id=$8`,
        [
          name,
          ingredients,
          price,
          kcal || null,
          icons || null,
          category,
          sort_order || 0,
          id,
        ],
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE
app.delete("/menu/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM menu_items WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ================= STATIC =================
app.use(express.static("public"));

// ================= GLOBAL ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));

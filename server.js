const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const multer = require("multer");
const fs = require("fs");
const path = require("path"); // Хуудасны замуудыг зөв заахад хэрэгтэй
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
    console.log("Database table checked/initialized successfully.");
  } catch (err) {
    console.error("Database initialization error:", err);
  }
}
initDB();

// =================================================
// ================= API ROUTES ====================
// =================================================

// GET ALL (Try-catch нэмж аюулгүй болгов)
app.get("/menu", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM menu_items ORDER BY id DESC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET BY CATEGORY (CASE INSENSITIVE)
app.get("/menu/:category", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM menu_items WHERE LOWER(category)=LOWER($1) ORDER BY id DESC",
      [req.params.category],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ADD
app.post("/add-menu", upload.single("image"), async (req, res) => {
  try {
    let { name, ingredients, price, kcal, icons, category } = req.body;

    name = name ? name.toUpperCase() : "";
    ingredients = ingredients ? ingredients.toUpperCase() : null;
    category = category ? category.toLowerCase() : "food";

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
       (image_url, name, ingredients, price, kcal, icons, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        image_url,
        name,
        ingredients,
        price,
        kcal || null,
        icons || null,
        category,
      ],
    );

    res.json({ success: true, item: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// UPDATE
app.put("/menu/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    let { name, ingredients, price, kcal, icons, category } = req.body;

    name = name ? name.toUpperCase() : "";
    ingredients = ingredients ? ingredients.toUpperCase() : null;
    category = category ? category.toLowerCase() : "food";

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
         SET name=$1, ingredients=$2, price=$3,
             kcal=$4, icons=$5, category=$6, image_url=$7
         WHERE id=$8`,
        [
          name,
          ingredients,
          price,
          kcal || null,
          icons || null,
          category,
          image_url,
          id,
        ],
      );
    } else {
      await pool.query(
        `UPDATE menu_items
         SET name=$1, ingredients=$2, price=$3,
             kcal=$4, icons=$5, category=$6
         WHERE id=$7`,
        [name, ingredients, price, kcal || null, icons || null, category, id],
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// DELETE
app.delete("/menu/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM menu_items WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// ================= STATIC FILES & ROUTING =================

// Хэрэв таны HTML файлууд болон style.css, app.js нь public хавтсанд БАЙХГҮЙ,
// үндсэн хавтас (root) дээр байгаа бол доорх мөрүүдийг ашиглан чиглүүлнэ.
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(__dirname)); // Үндсэн хавтсыг статик болгох (шаардлагатай бол)

// Линкээр шууд хандах үед хуудаснуудыг зөв дуудах замууд
app.get("/menu-food.html", (req, res) => {
  res.sendFile(path.join(__dirname, "menu-food.html"));
});

app.get("/orders.html", (req, res) => {
  res.sendFile(path.join(__dirname, "orders.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));

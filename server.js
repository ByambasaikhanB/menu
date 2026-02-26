// server.js

const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const multer = require("multer");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
require("dotenv").config(); // .env файлыг ашиглах бол

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

// ================= ADD MENU =================
app.post("/add-menu", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      console.error("UPLOAD ERROR: No file uploaded");
      return res.status(400).json({ success: false, error: "Image required" });
    }

    console.log("File received:", req.file.originalname, req.file.path);

    // Cloudinary upload
    let image_url;
    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "menu_items",
      });
      image_url = result.secure_url;
      console.log("Cloudinary upload success:", image_url);
    } catch (cloudErr) {
      console.error("CLOUDINARY ERROR:", cloudErr);
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res
        .status(500)
        .json({ success: false, error: "Cloudinary upload failed" });
    }

    // DB insert
    const { name, ingredients, price, kcal, icons, category } = req.body;

    try {
      const query = `
        INSERT INTO menu_items
        (image_url, name, ingredients, price, kcal, icons, category)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING *;
      `;
      const values = [
        image_url,
        name,
        ingredients || null,
        price,
        kcal || null,
        icons || null,
        category?.toLowerCase() || "food",
      ];

      const result = await pool.query(query, values);
      console.log("DB insert success:", result.rows[0]);

      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

      res.json({ success: true, item: result.rows[0] });
    } catch (dbErr) {
      console.error("DB INSERT ERROR:", dbErr);
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(500).json({ success: false, error: "Database insert failed" });
    }
  } catch (err) {
    console.error("UNEXPECTED ERROR:", err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, error: "Unexpected server error" });
  }
});

// ================= GET ALL MENU =================
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

// ================= GET MENU BY CATEGORY =================
app.get("/menu/:category", async (req, res) => {
  const { category } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM menu_items WHERE category=$1 ORDER BY id DESC",
      [category.toLowerCase()],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("FETCH BY CATEGORY ERROR:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ================= UPDATE MENU =================
app.put("/menu/:id", async (req, res) => {
  const { id } = req.params;
  const { name, ingredients, price, kcal, icons, category } = req.body;
  try {
    await pool.query(
      `UPDATE menu_items
       SET name=$1, ingredients=$2, price=$3, kcal=$4, icons=$5, category=$6
       WHERE id=$7`,
      [
        name.toUpperCase(),
        ingredients.toUpperCase(),
        price,
        kcal,
        icons,
        category.toLowerCase(),
        id,
      ],
    );
    res.json({ success: true });
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ error: "Database update failed" });
  }
});

// ================= DELETE MENU =================
app.delete("/menu/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM menu_items WHERE id=$1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ error: "Database delete failed" });
  }
});

// ================= SERVER START =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

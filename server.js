const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const multer = require("multer");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

const app = express();

// ===== CLOUDINARY =====
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// ===== DATABASE =====
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ===== MIDDLEWARE =====
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ dest: "tmp/" });

// ===== DB INIT =====
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
        category TEXT,
        sort_order INT DEFAULT 0
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        table_number TEXT NOT NULL,
        items JSONB NOT NULL,
        total_price INT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Database ready");
  } catch (err) {
    console.error(err);
  }
}
initDB();

// ===== MENU API =====

// бүх menu
app.get("/menu", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM menu_items ORDER BY sort_order ASC, id DESC",
  );
  res.json(result.rows);
});

// category menu
app.get("/menu/:category", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM menu_items WHERE category=$1 ORDER BY sort_order ASC,id ASC",
    [req.params.category],
  );
  res.json(result.rows);
});

// add menu
app.post("/add-menu", upload.single("image"), async (req, res) => {
  try {
    let { name, ingredients, price, kcal, icons, category, sort_order } =
      req.body;

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
        name.toUpperCase(),
        ingredients ? ingredients.toUpperCase() : null,
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
    res.status(500).json({ success: false });
  }
});

// update
app.put("/menu/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    let { name, ingredients, price, kcal, icons, category, sort_order } =
      req.body;

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
         SET name=$1,ingredients=$2,price=$3,kcal=$4,icons=$5,
         category=$6,sort_order=$7,image_url=$8
         WHERE id=$9`,
        [
          name.toUpperCase(),
          ingredients ? ingredients.toUpperCase() : null,
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
         SET name=$1,ingredients=$2,price=$3,kcal=$4,icons=$5,
         category=$6,sort_order=$7
         WHERE id=$8`,
        [
          name.toUpperCase(),
          ingredients ? ingredients.toUpperCase() : null,
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
  }
});

// delete
app.delete("/menu/:id", async (req, res) => {
  await pool.query("DELETE FROM menu_items WHERE id=$1", [req.params.id]);
  res.json({ success: true });
});

// ===== ORDER API =====

// create order
app.post("/orders", async (req, res) => {
  try {
    const { table_number, items, total_price } = req.body;

    await pool.query(
      `INSERT INTO orders (table_number,items,total_price)
       VALUES ($1,$2,$3)`,
      [table_number, items, total_price],
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
  }
});

// orders list
app.get("/orders", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM orders ORDER BY created_at DESC",
  );
  res.json(result.rows);
});

// done
app.put("/orders/:id", async (req, res) => {
  await pool.query("UPDATE orders SET status='done' WHERE id=$1", [
    req.params.id,
  ]);

  res.json({ success: true });
});

// ===== STATIC =====
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running " + PORT));

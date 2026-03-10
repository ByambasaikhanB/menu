const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const multer = require("multer");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

const upload = multer({ dest: "public/uploads/" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ================= DB INIT =================
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS menu_items(
      id SERIAL PRIMARY KEY,
      image_url TEXT,
      name TEXT,
      ingredients TEXT,
      price INT,
      kcal INT,
      icons TEXT,
      category TEXT,
      sort_order INT DEFAULT 0
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
}
initDB();

// ================= GET ALL MENU =================
app.get("/menu", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM menu_items ORDER BY sort_order ASC, id DESC",
  );
  res.json(result.rows);
});

// ================= CATEGORY MENU =================
app.get("/menu/:category", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM menu_items WHERE category=$1 ORDER BY sort_order ASC",
    [req.params.category],
  );
  res.json(result.rows);
});

// ================= ADD MENU =================
app.post("/add-menu", upload.single("image"), async (req, res) => {
  try {
    const { name, ingredients, price, kcal, icons, category, sort_order } =
      req.body;

    const image_url = req.file ? "/uploads/" + req.file.filename : null;

    await pool.query(
      `INSERT INTO menu_items
      (image_url,name,ingredients,price,kcal,icons,category,sort_order)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        image_url,
        name,
        ingredients,
        price,
        kcal,
        icons,
        category,
        sort_order || 0,
      ],
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// ================= UPDATE =================
app.put("/menu/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, ingredients, price, kcal, icons, category, sort_order } =
      req.body;

    let imagePart = "";
    let values = [name, ingredients, price, kcal, icons, category, sort_order];

    if (req.file) {
      imagePart = ", image_url=$8";
      values.push("/uploads/" + req.file.filename);
    }

    await pool.query(
      `UPDATE menu_items SET
      name=$1,
      ingredients=$2,
      price=$3,
      kcal=$4,
      icons=$5,
      category=$6,
      sort_order=$7
      ${imagePart}
      WHERE id=${req.params.id}`,
      values,
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// ================= DELETE =================
app.delete("/menu/:id", async (req, res) => {
  await pool.query("DELETE FROM menu_items WHERE id=$1", [req.params.id]);
  res.json({ success: true });
});

// ================= ORDERS =================
app.post("/orders", async (req, res) => {
  const { table_number, items, total_price } = req.body;

  await pool.query(
    "INSERT INTO orders(table_number,items,total_price) VALUES($1,$2,$3)",
    [table_number, JSON.stringify(items), total_price],
  );

  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on " + PORT));

const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

// ================= DATABASE =================
// Render.com-д DATABASE_URL environment variable ашиглана
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Render PostgreSQL-д шаардлагатай
  },
});

// ================= MIDDLEWARE =================
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// ================= UPLOAD FOLDER =================
const uploadPath = path.join(__dirname, "public/uploads");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// ================= MULTER =================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// ================= ADD MENU =================
app.post("/add-menu", upload.single("image"), async (req, res) => {
  try {
    const { name, ingredients, price, kcal, icons, category } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Image required" });
    }

    const image_url = "/uploads/" + req.file.filename;

    await pool.query(
      `INSERT INTO menu_items
       (image_url, name, ingredients, price, kcal, icons, category)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [image_url, name, ingredients, price, kcal, icons, category],
    );

    res.json({ success: true });
  } catch (err) {
    console.error("INSERT ERROR:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ================= GET BY CATEGORY =================
app.get("/menu/:category", async (req, res) => {
  try {
    const { category } = req.params;

    const result = await pool.query(
      "SELECT * FROM menu_items WHERE category = $1 ORDER BY id DESC",
      [category],
    );

    res.json(result.rows);
  } catch (err) {
    console.error("FETCH ERROR:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ================= SERVER START =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// ================= AUTO CREATE TABLE =================
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        image_url TEXT,
        name TEXT,
        ingredients TEXT,
        price TEXT,
        kcal TEXT,
        icons TEXT,
        category TEXT
      );
    `);

    console.log("Table ready");

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("DB INIT ERROR:", err);
    process.exit(1); // DB ажиллахгүй бол server асахгүй
  }
}

initDB();

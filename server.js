const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

// ================= DATABASE =================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ================= MIDDLEWARE =================
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// ================= UPLOAD FOLDER =================
const uploadPath = path.join(__dirname, "public/uploads");
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

// ================= MULTER =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ================= CREATE TABLE =================
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
  } catch (err) {
    console.error("DB INIT ERROR:", err);
    process.exit(1);
  }
}
initDB();

// ================= ADD MENU =================
app.post("/add-menu", upload.single("image"), async (req, res) => {
  try {
    const { name, ingredients, price, kcal, icons } = req.body;
    const category = req.body.category?.toLowerCase() || "food";

    if (!req.file) return res.status(400).json({ error: "Image required" });
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

// ================= GET MENU =================
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

// ================= UPDATE MENU =================
app.put("/menu/:id", async (req, res) => {
  const { id } = req.params;
  const { name, ingredients, price, kcal, icons, category } = req.body;
  try {
    await pool.query(
      `UPDATE menu_items
       SET name=$1, ingredients=$2, price=$3, kcal=$4, icons=$5, category=$6
       WHERE id=$7`,
      [name, ingredients, price, kcal, icons, category.toLowerCase(), id],
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

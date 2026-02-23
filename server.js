const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "menu_db",
  password: "1234",
  port: 5432,
});

const app = express();
app.use(bodyParser.json());
app.use(express.static("public")); // public folder serve

// POST admin-аас
app.post("/api/menu", async (req, res) => {
  const { image_url, name, ingredients, price, kcal, icons } = req.body;
  try {
    await pool.query(
      "INSERT INTO menu_items (image_url, name, ingredients, price, kcal, icons) VALUES ($1,$2,$3,$4,$5,$6)",
      [image_url, name, ingredients, price, kcal, icons],
    );
    res.status(200).send("Item added");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

// GET menu вэб рүү харуулах
app.get("/api/menu", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM menu_items ORDER BY id DESC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));

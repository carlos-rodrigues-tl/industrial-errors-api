const express = require("express");
const router = express.Router();
const db = require("../database/db");

// criar erro
router.post("/", (req, res) => {
  const { name, description, category } = req.body;

  const sql = `
    INSERT INTO error_types (name, description, category)
    VALUES (?, ?, ?)
  `;

  db.run(sql, [name, description, category], function (err) {
    if (err) {
      return res.status(500).json(err);
    }

    res.json({ id: this.lastID });
  });
});

// listar erros
router.get("/", (req, res) => {
  db.all("SELECT * FROM error_types", [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

module.exports = router;

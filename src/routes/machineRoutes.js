const express = require("express");
const router = express.Router();
const db = require("../database/db");

// 🔹 Criar máquina
router.post("/", (req, res) => {
  const { code, brand, sectorId, notes } = req.body;

  if (!code || !brand) {
    return res.status(400).json({
      error: "Código e marca são obrigatórios",
    });
  }

  const sql = `
    INSERT INTO machines (code, brand, sectorId, notes)
    VALUES (?, ?, ?, ?)
  `;

  db.run(sql, [code, brand, sectorId || null, notes || null], function (err) {
    if (err) {
      if (err.message.includes("UNIQUE")) {
        return res.status(400).json({
          error: "Já existe uma máquina com esse código",
        });
      }

      return res.status(500).json(err);
    }

    res.json({
      id: this.lastID,
      code,
      brand,
    });
  });
});

// 🔹 Listar todas máquinas
router.get("/", (req, res) => {
  const sql = `
    SELECT m.*, s.name as sectorName
    FROM machines m
    LEFT JOIN sectors s ON m.sectorId = s.id
    ORDER BY m.code ASC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json(err);

    res.json(rows);
  });
});

// 🔹 Buscar por código
router.get("/:code", (req, res) => {
  const { code } = req.params;

  const sql = `
    SELECT * FROM machines WHERE code = ?
  `;

  db.get(sql, [code], (err, row) => {
    if (err) return res.status(500).json(err);

    if (!row) {
      return res.status(404).json({
        error: "Máquina não encontrada",
      });
    }

    res.json(row);
  });
});

// 🔹 Atualizar máquina
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { code, brand, sectorId, notes } = req.body;

  const sql = `
    UPDATE machines
    SET code = ?, brand = ?, sectorId = ?, notes = ?
    WHERE id = ?
  `;

  db.run(sql, [code, brand, sectorId, notes, id], function (err) {
    if (err) return res.status(500).json(err);

    res.json({ updated: this.changes });
  });
});

// 🔹 Deletar máquina
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  db.run(`DELETE FROM machines WHERE id = ?`, [id], function (err) {
    if (err) return res.status(500).json(err);

    res.json({ deleted: this.changes });
  });
});

module.exports = router;

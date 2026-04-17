const express = require("express");
const router = express.Router();
const db = require("../database/db");

// 🔹 Criar ocorrência
router.post("/", (req, res) => {
  const { machineId, errorTypeId, date, solutionText, worked, notes } =
    req.body;

  if (!machineId || !errorTypeId) {
    return res.status(400).json({
      error: "machineId e errorTypeId são obrigatórios",
    });
  }

  const sql = `
    INSERT INTO occurrences 
    (machineId, errorTypeId, date, solutionText, worked, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(
    sql,
    [
      machineId,
      errorTypeId,
      date || new Date().toISOString(),
      solutionText || null,
      worked ? 1 : 0,
      notes || null,
    ],
    function (err) {
      if (err) return res.status(500).json(err);

      res.json({
        id: this.lastID,
      });
    }
  );
});

// 🔹 Listar ocorrências (com JOIN 🔥)
router.get("/", (req, res) => {
  const sql = `
    SELECT 
      o.*,
      m.code as machineCode,
      m.brand,
      e.name as errorName
    FROM occurrences o
    JOIN machines m ON o.machineId = m.id
    JOIN error_types e ON o.errorTypeId = e.id
    ORDER BY o.date DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json(err);

    res.json(rows);
  });
});

// 🔹 Buscar por máquina
router.get("/machine/:machineId", (req, res) => {
  const { machineId } = req.params;

  const sql = `
    SELECT 
      o.*,
      e.name as errorName
    FROM occurrences o
    JOIN error_types e ON o.errorTypeId = e.id
    WHERE o.machineId = ?
    ORDER BY o.date DESC
  `;

  db.all(sql, [machineId], (err, rows) => {
    if (err) return res.status(500).json(err);

    res.json(rows);
  });
});

// 🔹 Buscar por erro
router.get("/error/:errorTypeId", (req, res) => {
  const { errorTypeId } = req.params;

  const sql = `
    SELECT 
      o.*,
      m.code as machineCode,
      m.brand
    FROM occurrences o
    JOIN machines m ON o.machineId = m.id
    WHERE o.errorTypeId = ?
    ORDER BY o.date DESC
  `;

  db.all(sql, [errorTypeId], (err, rows) => {
    if (err) return res.status(500).json(err);

    res.json(rows);
  });
});

// 🔹 Deletar ocorrência
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  db.run(`DELETE FROM occurrences WHERE id = ?`, [id], function (err) {
    if (err) return res.status(500).json(err);

    res.json({ deleted: this.changes });
  });
});

module.exports = router;

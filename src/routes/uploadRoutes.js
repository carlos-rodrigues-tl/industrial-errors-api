const express = require("express");
const router = express.Router();
const upload = require("../config/upload");
const db = require("../database/db");

// 📷 upload de imagem para ocorrência
router.post("/:occurrenceId", upload.single("image"), (req, res) => {
  const { occurrenceId } = req.params;

  if (!req.file) {
    return res.status(400).json({
      error: "Imagem obrigatória",
    });
  }

  const fileUrl = `/uploads/${req.file.filename}`;

  const sql = `
    INSERT INTO attachments (occurrenceId, fileUrl)
    VALUES (?, ?)
  `;

  db.run(sql, [occurrenceId, fileUrl], function (err) {
    if (err) return res.status(500).json(err);

    res.json({
      id: this.lastID,
      fileUrl,
    });
  });
});

// 🔍 listar imagens da ocorrência
router.get("/:occurrenceId", (req, res) => {
  const { occurrenceId } = req.params;

  const sql = `
    SELECT * FROM attachments
    WHERE occurrenceId = ?
  `;

  db.all(sql, [occurrenceId], (err, rows) => {
    if (err) return res.status(500).json(err);

    res.json(rows);
  });
});

module.exports = router;

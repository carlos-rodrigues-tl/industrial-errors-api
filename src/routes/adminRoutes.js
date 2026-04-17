const express = require("express");
const router = express.Router();
const db = require("../database/db.js");

// 🔐 proteção simples
function checkAdmin(req, res, next) {
  const password = req.headers.adminpassword;

  if (password !== "123456") {
    return res.status(401).json({
      success: false,
      message: "Senha inválida",
    });
  }

  next();
}

// ===============================
// 🏭 CADASTRAR MÁQUINA
// ===============================
router.post("/machines", checkAdmin, (req, res) => {
  const { code, brand, sectorId, notes } = req.body;

  if (!code || !brand) {
    return res.status(400).json({
      success: false,
      message: "Informe code e brand",
    });
  }

  db.run(
    `
    INSERT INTO machines (code, brand, sectorId, notes)
    VALUES (?, ?, ?, ?)
    `,
    [code, brand, sectorId || 1, notes || ""],
    function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          error: err.message,
        });
      }

      res.json({
        success: true,
        id: this.lastID,
        message: "Máquina cadastrada",
      });
    },
  );
});

// ===============================
// ❌ EXCLUIR MÁQUINA
// ===============================
router.delete("/machines/:id", checkAdmin, (req, res) => {
  db.run(`DELETE FROM machines WHERE id = ?`, [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }

    res.json({
      success: true,
      message: "Máquina removida",
    });
  });
});

// ===============================
// ⚠️ CADASTRAR ERRO
// ===============================
router.post("/errors", checkAdmin, (req, res) => {
  const { name, description, category } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Informe nome do erro",
    });
  }

  db.run(
    `
    INSERT INTO error_types (name, description, category)
    VALUES (?, ?, ?)
    `,
    [name, description || "", category || "eletrica"],
    function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          error: err.message,
        });
      }

      res.json({
        success: true,
        id: this.lastID,
        message: "Erro cadastrado",
      });
    },
  );
});

// ===============================
// ❌ EXCLUIR ERRO
// ===============================
router.delete("/errors/:id", checkAdmin, (req, res) => {
  db.run(
    `DELETE FROM error_types WHERE id = ?`,
    [req.params.id],
    function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          error: err.message,
        });
      }

      res.json({
        success: true,
        message: "Erro removido",
      });
    },
  );
});

// ===============================
// 📅 EXCLUIR OCORRÊNCIA
// ===============================
router.delete("/occurrences/:id", checkAdmin, (req, res) => {
  db.run(
    `DELETE FROM occurrences WHERE id = ?`,
    [req.params.id],
    function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          error: err.message,
        });
      }

      res.json({
        success: true,
        message: "Ocorrência removida",
      });
    },
  );
});

// ===============================
// 📊 DASHBOARD ADMIN
// ===============================
router.get("/dashboard", checkAdmin, (req, res) => {
  db.serialize(() => {
    const data = {};

    db.get(`SELECT COUNT(*) total FROM machines`, (err, row) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: err.message,
        });
      }

      data.machines = row.total;

      db.get(`SELECT COUNT(*) total FROM error_types`, (err, row) => {
        if (err) {
          return res.status(500).json({
            success: false,
            error: err.message,
          });
        }

        data.errors = row.total;

        db.get(`SELECT COUNT(*) total FROM occurrences`, (err, row) => {
          if (err) {
            return res.status(500).json({
              success: false,
              error: err.message,
            });
          }

          data.occurrences = row.total;

          res.json({
            success: true,
            data,
          });
        });
      });
    });
  });
});

module.exports = router;

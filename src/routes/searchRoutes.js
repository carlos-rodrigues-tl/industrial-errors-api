const express = require("express");
const router = express.Router();
const db = require("../database/db");

router.get("/", (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: "Query obrigatória" });
  }

  const terms = q.toLowerCase().split(" ");

  let machineCode = null;
  let errorTerm = [];

  terms.forEach((term) => {
    if (!isNaN(term)) {
      machineCode = term;
    } else {
      errorTerm.push(term);
    }
  });

  const errorSearch = `%${errorTerm.join("%")}%`;

  // 🔎 Buscar erro
  const errorSql = `
    SELECT * FROM error_types
    WHERE LOWER(name) LIKE ?
    LIMIT 1
  `;

  db.get(errorSql, [errorSearch], (err, error) => {
    if (err) return res.status(500).json(err);

    if (!error) {
      return res.json({
        message: "Nenhum erro encontrado",
      });
    }

    // 🔎 Buscar máquina (se tiver)
    if (machineCode) {
      db.get(
        `SELECT * FROM machines WHERE code = ?`,
        [machineCode],
        (err, machine) => {
          if (err) return res.status(500).json(err);

          getFullData(error, machine, res);
        },
      );
    } else {
      getFullData(error, null, res);
    }
  });
});

// 🔥 função central
function getFullData(error, machine, res) {
  // 🔧 soluções
  const solutionsSql = `
    SELECT * FROM solutions
    WHERE errorTypeId = ?
    ORDER BY priority ASC
  `;

  // 📅 ocorrências
  let occurrenceSql = `
  SELECT 
    o.*,
    m.code as machineCode,
    (
      SELECT fileUrl 
      FROM attachments 
      WHERE occurrenceId = o.id 
      LIMIT 1
    ) as image
  FROM occurrences o
  JOIN machines m ON o.machineId = m.id
  WHERE o.errorTypeId = ?
`;

  const params = [error.id];

  if (machine) {
    occurrenceSql += ` AND o.machineId = ?`;
    params.push(machine.id);
  }

  occurrenceSql += ` ORDER BY o.date DESC LIMIT 10`;

  db.all(solutionsSql, [error.id], (err, solutions) => {
    if (err) return res.status(500).json(err);

    db.all(occurrenceSql, params, (err, occurrences) => {
      if (err) return res.status(500).json(err);

      let stats = {};

      occurrences.forEach((o) => {
        if (!o.solutionText) return;

        if (!stats[o.solutionText]) {
          stats[o.solutionText] = {
            total: 0,
            success: 0,
          };
        }

        stats[o.solutionText].total++;

        if (o.worked) {
          stats[o.solutionText].success++;
        }
      });

      let bestSolution = null;
      let bestRate = 0;

      for (let key in stats) {
        const { total, success } = stats[key];
        const rate = (success / total) * 100;

        if (rate > bestRate) {
          bestRate = rate;
          bestSolution = key;
        }
      }

      res.json({
        error,
        machine: machine || null,
        solutions,
        occurrences,
        bestSolution: bestSolution
          ? {
              text: bestSolution,
              rate: bestRate.toFixed(0),
            }
          : null,
      });
    });
  });
}

module.exports = router;

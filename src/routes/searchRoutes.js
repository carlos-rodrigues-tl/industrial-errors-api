const express = require("express");
const router = express.Router();
const db = require("../database/db");

router.get("/", (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: "Query obrigatória" });
  }

  const terms = q.toLowerCase().trim().split(" ");

  let machineCode = null;
  let textTerms = [];

  terms.forEach((term) => {
    if (!isNaN(term)) {
      machineCode = term;
    } else {
      textTerms.push(term);
    }
  });

  const search = `%${textTerms.join("%")}%`;

  const sql = `
    SELECT DISTINCT e.*
    FROM error_types e
    LEFT JOIN solutions s ON s.errorTypeId = e.id
    LEFT JOIN occurrences o ON o.errorTypeId = e.id
    WHERE LOWER(e.name) LIKE ?
       OR LOWER(IFNULL(s.description,'')) LIKE ?
       OR LOWER(IFNULL(o.solutionText,'')) LIKE ?
    LIMIT 1
  `;

  db.get(sql, [search, search, search], (err, error) => {
    if (err) return res.status(500).json(err);

    if (!error) {
      return res.json({
        message: "Nenhum resultado encontrado",
      });
    }

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

function getFullData(error, machine, res) {
  const solutionsSql = `
    SELECT * FROM solutions
    WHERE errorTypeId = ?
    ORDER BY priority ASC
  `;

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

        if (o.worked) stats[o.solutionText].success++;
      });

      let bestSolution = null;
      let bestRate = 0;

      for (let key in stats) {
        const rate = (stats[key].success / stats[key].total) * 100;

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

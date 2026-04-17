const express = require("express");
const cors = require("cors");
require("./database/db");

const errorRoutes = require("./routes/errorRoutes");
const machineRoutes = require("./routes/machineRoutes");
const occurrenceRoutes = require("./routes/occurrenceRoutes");
const searchRoutes = require("./routes/searchRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("src/uploads"));
app.use("/errors", errorRoutes);
app.use("/machines", machineRoutes);
app.use("/occurrences", occurrenceRoutes);
app.use("/search", searchRoutes);
app.use("/uploads-api", uploadRoutes);

// rota teste
app.get("/", (req, res) => {
  res.send("API rodando 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

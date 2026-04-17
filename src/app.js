const express = require("express");
require("./database/db");
const cors = require("cors");

const errorRoutes = require("./routes/errorRoutes");
const machineRoutes = require("./routes/machineRoutes");
const occurrenceRoutes = require("./routes/occurrenceRoutes");
const searchRoutes = require("./routes/searchRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const adminRoutes = require("./routes/adminRoutes");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("src/uploads"));
app.use("/errors", errorRoutes);
app.use("/machines", machineRoutes);
app.use("/occurrences", occurrenceRoutes);
app.use("/search", searchRoutes);
app.use("/uploads-api", uploadRoutes);
app.use("/admin", adminRoutes);

// rota teste
app.get("/", (req, res) => {
  res.send("API rodando 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

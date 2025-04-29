const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config(); // Load .env variables

const personal_details_router = require("./router/personal_details_router.js");
const company_details_router = require("./router/company_details_router.js");

const dbUrl = process.env.DATABASE_URL;
const Port = process.env.PORT || 3000;

mongoose
  .connect(dbUrl)
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.error("Error connecting to the database:", err));

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(
  "/api/v1/steelwarehouse/personal_details_router",
  personal_details_router
);
app.use(
  "/api/v1/steelwarehouse/company_details_router",
  company_details_router
);

app.listen(Port, () => {
  console.log("The server is running at port:", Port);
});

import express from "express";

const app = express();

app.get("/", (_req, res) => {
  res.send("<h1>Section 7: The Model View Controller (MVC)</h1>");
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

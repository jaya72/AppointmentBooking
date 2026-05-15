const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("NEW BACKEND WORKING");
});

app.post("/book", (req, res) => {
    console.log("=================================");
    console.log("BOOK API HIT");
    console.log(req.body);
    console.log("=================================");

  res.json({
    message: "NEW APPOINTMENT BOOKED",
  });
});

app.listen(5000, () => {
  console.log("SERVER STARTED");
});
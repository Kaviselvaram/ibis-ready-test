import express from "express";
const app = express();
const server = app.listen(4001, () => {
  console.log("Listening on 4001");
});

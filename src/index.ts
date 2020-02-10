import express from "express";

const app = express();

app.get("/health", (_, res) => res.end("OK"));

app.listen(8080);
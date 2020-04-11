const express = require('express');
const server = express();
const routes = require("./routes");
server.use("/", routes);
server.set("view engine", "pug");
server.set("views", "./views");

server.listen(3000, () => {
    console.log("Сервер запущен по адресу http://localhost:3000");
});
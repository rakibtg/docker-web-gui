const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();
const port = 3230;

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "web")));

// Boot database.
const db = require("./utilities/db");
db.boot();

const { DefaultController } = require("./controllers/DefaultController");
const {
  GenericCommandController,
} = require("./controllers/GenericCommandController");
const ContainerController = require("./controllers/ContainerController");
const ImageController = require("./controllers/ImageController");
const GroupController = require("./controllers/GroupController");
const CleanUpController = require("./controllers/CleanUpController");

app.get("/", DefaultController);
app.get("/api/generic", GenericCommandController);

app.get("/api/container/fetch", ContainerController.fetch);
app.get("/api/container/fetchById", ContainerController.fetchById);
app.get("/api/container/command", ContainerController.command);
app.get("/api/container/logs", ContainerController.logs);
app.get("/api/container/stats", ContainerController.stats);

app.get("/api/image/fetch", ImageController.fetch);
app.get("/api/image/command", ImageController.command);
app.get("/api/cleanup/command", CleanUpController.command);

app.post("/api/groups", GroupController.create);
app.get("/api/groups", GroupController.fetch);
app.delete("/api/groups", GroupController.delete);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

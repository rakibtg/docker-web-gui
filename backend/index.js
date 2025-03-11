const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();
const port = 3230;
const auditLogMiddleware = require("./middleware/auditLogMiddleware");

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "web")));

// Add audit middleware before routes
app.use(auditLogMiddleware);

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
const VolumeController = require("./controllers/VolumeController");

// Add audit logs endpoint
app.get("/api/audit-logs", async (req, res) => {
  try {
    const logs = await db
      .knex("audit_logs")
      .select()
      .orderBy("created_at", "desc")
      .limit(100);
    res.json(logs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

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

// Volume endpoints
app.get("/api/volumes", VolumeController.fetch);
app.post("/api/volumes", VolumeController.create);
app.delete("/api/volumes/:name", VolumeController.remove);

app.post("/api/groups", GroupController.create);
app.get("/api/groups", GroupController.fetch);
app.delete("/api/groups", GroupController.delete);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
